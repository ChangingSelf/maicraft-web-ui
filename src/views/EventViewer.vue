<template>
  <div class="event-viewer">
    <!-- 页面标题 -->
    <div class="header">
      <h1 class="title">
        <el-icon class="title-icon"><List /></el-icon>
        事件查看器
      </h1>
      <div class="controls">
        <WebSocketManager
          ref="wsManager"
          :config="wsConfig"
          @connect="connectWebSocket"
          @disconnect="disconnectWebSocket"
          @message="handleWebSocketMessage"
          @status-change="handleConnectionStatusChange"
        />
        <el-button type="info" icon="Setting" @click="showSettings = true" size="small">
          设置
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.stats.total }}</div>
        <div class="stat-label">总事件数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value thinking">{{ stats.stats.thinking }}</div>
        <div class="stat-label">思考事件</div>
      </div>
      <div class="stat-card">
        <div class="stat-value action">{{ stats.stats.action }}</div>
        <div class="stat-label">动作事件</div>
      </div>
      <div class="stat-card">
        <div class="stat-value event">{{ stats.stats.event }}</div>
        <div class="stat-label">游戏事件</div>
      </div>
      <div class="stat-card">
        <div class="stat-value notice">{{ stats.stats.notice || 0 }}</div>
        <div class="stat-label">通知事件</div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <FilterPanel :filters="filterConfigs" @change="handleFilterChange" />

      <div class="filter-row">
        <div class="filter-section">
          <label class="filter-label">时间范围：</label>
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="x"
            @change="handleTimeRangeChange"
            size="small"
          />
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-section search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索事件内容..."
            clearable
            @input="handleSearchInput"
            @clear="handleSearchClear"
            size="small"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="filter-section">
          <el-button
            type="primary"
            icon="Search"
            @click="performSearch"
            :loading="searching"
            size="small"
          >
            搜索
          </el-button>
          <el-button @click="clearFilters" size="small"> 清空筛选 </el-button>
        </div>
      </div>
    </div>

    <!-- 事件列表 -->
    <div class="events-container">
      <div class="events-list">
        <div
          v-for="(event, index) in events"
          :key="index"
          class="event-item"
          :class="getEventClass(event.type)"
        >
          <div class="event-header">
            <div class="event-time">{{ formatTime(event.timestamp) }}</div>
            <div class="event-type" :class="`type-${event.type}`">
              {{ getTypeLabel(event.type) }}
            </div>
          </div>
          <div class="event-content">{{ event.content }}</div>
        </div>

        <div v-if="events.length === 0 && !loading" class="no-events">
          <el-empty
            :description="searchKeyword ? '未找到匹配的事件' : '暂无事件数据'"
            :image-size="80"
          />
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
          small
        />
      </div>
    </div>

    <!-- 设置对话框 -->
    <SettingsDialog
      v-model="showSettings"
      title="显示设置"
      :settings="settingsConfig"
      :initial-data="settings"
      @confirm="applySettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import WebSocketManager from '@/components/WebSocketManager.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'EventViewer',
})

// 扩展 Window 接口
declare global {
  interface Window {
    searchTimer?: number
  }
}
import { ElMessage } from 'element-plus'
import { List, Setting, Search } from '@element-plus/icons-vue'
import type { WebSocketMessage, WSErrorMessage } from '../types'

// 类型定义
interface EventItem {
  content: string
  type: 'thinking' | 'action' | 'event' | 'notice'
  timestamp: number
}

interface WebSocketMessage {
  type:
    | 'event'
    | 'events_response'
    | 'stats_response'
    | 'search_response'
    | 'error'
    | 'pong'
    | string
  request_id?: string
  success?: boolean
  message?: string
  data?: any
  timestamp?: number
  errorCode?: string
}

interface EventsResponse {
  events: EventItem[]
  total: number
  has_more: boolean
}

interface StatsResponse {
  period: string
  stats: {
    thinking: number
    action: number
    event: number
    notice?: number
    total: number
  }
  recent_events: Array<{
    type: string
    count: number
  }>
}

// 响应式数据
const loading = ref(false)
const searching = ref(false)
const events = ref<EventItem[]>([])
const stats = ref<StatsResponse | null>(null)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchKeyword = ref('')
const selectedTypes = ref<string[]>([])
const timeRange = ref<number[]>([])
const showSettings = ref(false)

// WebSocket相关
const wsManager = ref()
const requestIdCounter = ref(0)
const pendingRequests = ref<Map<string, { resolve: Function; reject: Function }>>(new Map())

// 配置数据
const availableTypes = [
  { value: 'all', label: '全部' },
  { value: 'thinking', label: '思考' },
  { value: 'action', label: '动作' },
  { value: 'event', label: '游戏事件' },
  { value: 'notice', label: '通知' },
]

// WebSocket配置
const wsConfig = ref({
  url: 'ws://localhost:20914/ws/events',
  heartbeatInterval: 10000, // 10秒 - 匹配服务器清理间隔
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
})

// 筛选器配置
const filterConfigs = computed(() => [
  {
    key: 'eventTypes',
    label: '事件类型',
    options: availableTypes.filter((type) => type.value !== 'all'),
    selectedValues: selectedTypes.value,
    showSelectAll: true,
  },
])

// 设置配置
const settingsConfig = [
  {
    key: 'pageSize',
    label: '每页显示条数',
    type: 'select' as const,
    options: [
      { value: 20, label: '20' },
      { value: 50, label: '50' },
      { value: 100, label: '100' },
      { value: 200, label: '200' },
    ],
  },
  {
    key: 'autoRefresh',
    label: '自动刷新',
    type: 'switch' as const,
  },
  {
    key: 'refreshInterval',
    label: '刷新间隔(秒)',
    type: 'number' as const,
    min: 10,
    max: 300,
    step: 10,
  },
  {
    key: 'showTimestamp',
    label: '显示时间戳',
    type: 'switch' as const,
  },
]

// 设置
const settings = ref({
  pageSize: 50,
  autoRefresh: false,
  refreshInterval: 30,
  showTimestamp: true,
})

// 自动刷新定时器
let refreshTimer: number | null = null

// API基础URL
const API_BASE = 'http://localhost:20914/api'

// 计算属性
const selectedEventTypes = computed(() => {
  if (selectedTypes.value.length === 0 || selectedTypes.value.includes('all')) {
    return ['thinking', 'action', 'event', 'notice']
  }
  return selectedTypes.value
})

const startTime = computed(() => {
  return timeRange.value && timeRange.value[0] ? Math.floor(timeRange.value[0] / 1000) : null
})

// 工具函数
const formatTime = (timestamp: number): string => {
  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp)
  const timeString = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  return `${timeString}.${milliseconds}`
}

const getEventClass = (type: string): string => {
  return `event-${type}`
}

const getTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    thinking: '思考',
    action: '动作',
    event: '游戏事件',
    notice: '通知',
  }
  return typeMap[type] || type
}

const generateRequestId = (): string => {
  requestIdCounter.value++
  return `req_${Date.now()}_${requestIdCounter.value}`
}

// WebSocket消息处理函数
const sendWebSocketMessage = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!wsManager.value?.sendMessage(message)) {
      reject(new Error('WebSocket未连接'))
      return
    }

    if (message.request_id) {
      pendingRequests.value.set(message.request_id, { resolve, reject })

      // 设置超时
      setTimeout(() => {
        if (pendingRequests.value.has(message.request_id)) {
          pendingRequests.value.delete(message.request_id)
          reject(new Error('请求超时'))
        }
      }, 10000) // 10秒超时
    } else {
      resolve(null)
    }
  })
}

const fetchEvents = async (page: number = 1, isSearch: boolean = false) => {
  try {
    const requestId = generateRequestId()
    const message: any = {
      type: isSearch ? 'search' : 'get_events',
      request_id: requestId,
    }

    if (isSearch) {
      message.keyword = searchKeyword.value.trim()
      message.limit = pageSize.value
      if (selectedEventTypes.value.length > 0 && !selectedEventTypes.value.includes('all')) {
        message.type = selectedEventTypes.value[0] // 搜索时只支持单个类型
      }
    } else {
      message.type =
        selectedTypes.value.length === 0 || selectedTypes.value.includes('all')
          ? 'all'
          : selectedTypes.value.join(',')
      message.limit = pageSize.value
      if (startTime.value) {
        message.start_time = startTime.value
      }
    }

    return await sendWebSocketMessage(message)
  } catch (error) {
    console.error('获取事件数据失败:', error)
    ElMessage.error('获取事件数据失败')
    throw error
  }
}

const fetchStats = async () => {
  try {
    const requestId = generateRequestId()
    const message = {
      type: 'get_stats',
      request_id: requestId,
      period: '1h',
    }

    return await sendWebSocketMessage(message)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const subscribeToEvents = () => {
  const message = {
    type: 'subscribe',
    event_types: selectedEventTypes.value,
    timestamp: Date.now(),
  }

  sendWebSocketMessage(message).catch((error) => {
    console.error('订阅事件失败:', error)
  })
}

// WebSocket事件处理函数
const connectWebSocket = () => {
  wsManager.value?.connect()
}

const disconnectWebSocket = () => {
  wsManager.value?.disconnect()
}

const handleConnectionStatusChange = (connected: boolean) => {
  if (connected) {
    subscribeToEvents()
    refreshEvents()
  }
}

const handleWebSocketMessage = (message: WebSocketMessage) => {
  switch (message.type) {
    case 'events_response':
    case 'search_response':
      if (message.request_id && pendingRequests.value.has(message.request_id)) {
        const { resolve } = pendingRequests.value.get(message.request_id)!
        pendingRequests.value.delete(message.request_id)

        if (message.success && message.data) {
          events.value = message.data.events || []
          total.value = message.data.total || 0
          resolve(message.data)
        } else {
          ElMessage.error(message.message || '获取事件数据失败')
          resolve(null)
        }
      }
      loading.value = false
      searching.value = false
      break

    case 'stats_response':
      if (message.request_id && pendingRequests.value.has(message.request_id)) {
        const { resolve } = pendingRequests.value.get(message.request_id)!
        pendingRequests.value.delete(message.request_id)

        if (message.success && message.data) {
          stats.value = message.data
          resolve(message.data)
        } else {
          resolve(null)
        }
      }
      break

    case 'event':
      // 实时收到新事件
      if (message.data) {
        const newEvent: EventItem = {
          content: message.data.content,
          type: message.data.type,
          timestamp: message.data.timestamp,
        }

        // 添加到事件列表开头
        events.value.unshift(newEvent)

        // 限制事件数量
        if (events.value.length > settings.value.pageSize * 2) {
          events.value = events.value.slice(0, settings.value.pageSize * 2)
        }

        // 更新统计数据
        if (stats.value) {
          stats.value.stats.total++
          if (stats.value.stats[newEvent.type] !== undefined) {
            stats.value.stats[newEvent.type]++
          }
        }
      }
      break

    case 'error':
      ElMessage.error(message.message || 'WebSocket错误')
      break

    case 'pong':
      // 心跳响应，无需处理
      break
  }
}

// 筛选器事件处理函数
const handleFilterChange = (filterKey: string, selectedValues: string[]) => {
  if (filterKey === 'eventTypes') {
    selectedTypes.value = selectedValues
    currentPage.value = 1
    if (wsManager.value?.isConnected) {
      subscribeToEvents()
      refreshEvents()
    }
  }
}

const handleTimeRangeChange = () => {
  currentPage.value = 1
  refreshEvents()
}

const handleSearchInput = () => {
  // 延迟搜索，避免频繁请求
  clearTimeout(window.searchTimer)
  window.searchTimer = setTimeout(() => {
    if (searchKeyword.value.trim()) {
      performSearch()
    } else {
      refreshEvents()
    }
  }, 500)
}

const handleSearchClear = () => {
  searchKeyword.value = ''
  refreshEvents()
}

const performSearch = async () => {
  if (!searchKeyword.value.trim()) {
    refreshEvents()
    return
  }

  searching.value = true
  try {
    await fetchEvents(1, true)
    currentPage.value = 1
  } catch (error) {
    searching.value = false
  }
}

const clearFilters = () => {
  selectedTypes.value = []
  timeRange.value = []
  searchKeyword.value = ''
  currentPage.value = 1
  refreshEvents()
}

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
  refreshEvents()
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  fetchEvents(newPage)
}

const refreshEvents = async () => {
  loading.value = true
  try {
    await Promise.all([fetchEvents(currentPage.value), fetchStats()])
  } catch (error) {
    console.error('刷新事件失败:', error)
  } finally {
    loading.value = false
  }
}

const applySettings = (newSettings: any) => {
  showSettings.value = false
  settings.value = { ...settings.value, ...newSettings }
  pageSize.value = settings.value.pageSize
  refreshEvents()

  // 处理自动刷新
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  if (settings.value.autoRefresh) {
    refreshTimer = window.setInterval(() => {
      refreshEvents()
    }, settings.value.refreshInterval * 1000)
  }

  ElMessage.success('设置已应用')
}

// 生命周期
onMounted(() => {
  // 组件挂载时自动连接WebSocket
  connectWebSocket()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  disconnectWebSocket()
})
</script>

<style scoped>
.event-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 24px;
  color: #333;
}

.title-icon {
  color: #409eff;
}

.controls {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-value.thinking {
  color: #1890ff;
}

.stat-value.action {
  color: #52c41a;
}

.stat-value.event {
  color: #faad14;
}

.stat-value.notice {
  color: #722ed1;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.filters {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  align-items: center;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.filter-section.search-section {
  flex: 1;
  min-width: 300px;
}

.filter-label {
  font-weight: 500;
  color: #666;
  margin-right: 12px;
  white-space: nowrap;
}

.events-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.events-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.event-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid #e6e6e6;
  background: #fafafa;
  transition: all 0.2s;
}

.event-item:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-time {
  color: #999;
  font-size: 12px;
}

.event-type {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  text-align: center;
}

.type-thinking {
  background-color: #e6f7ff;
  color: #1890ff;
}

.type-action {
  background-color: #f6ffed;
  color: #52c41a;
}

.type-event {
  background-color: #fffbe6;
  color: #faad14;
}

.type-notice {
  background-color: #f9f0ff;
  color: #722ed1;
}

.event-content {
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}

.event-thinking {
  border-left-color: #1890ff;
}

.event-action {
  border-left-color: #52c41a;
}

.event-event {
  border-left-color: #faad14;
}

.event-notice {
  border-left-color: #722ed1;
}

.no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.pagination {
  padding: 16px;
  border-top: 1px solid #e6e6e6;
  background: #fafafa;
}

.settings-form {
  padding: 10px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-label {
    margin-right: 0;
    margin-bottom: 4px;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
