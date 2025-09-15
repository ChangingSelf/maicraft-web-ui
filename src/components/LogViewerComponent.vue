<template>
  <div class="log-viewer">
    <!-- 页面标题 -->
    <div class="header">
      <h1 class="title">
        <el-icon class="title-icon"><Document /></el-icon>
        {{ props.title }}
      </h1>
      <div class="controls">
        <!-- 频率限制状态 -->
        <div v-if="rateLimitedCount > 0" class="rate-limit-status">
          <el-tag type="warning" size="small"> 已限制 {{ rateLimitedCount }} 条日志 </el-tag>
        </div>
        <!-- 滚动状态指示器 -->
        <div v-if="userScrolledUp || scrollPausedBySpam" class="scroll-status">
          <el-tag :type="scrollPausedBySpam ? 'danger' : 'info'" size="small">
            {{ scrollPausedBySpam ? '刷屏暂停' : '手动暂停' }}
          </el-tag>
          <el-button type="success" icon="Bottom" @click="resumeAutoScroll" size="small">
            恢复滚动
          </el-button>
        </div>
        <el-button
          :type="isConnected ? 'success' : 'primary'"
          :icon="isConnected ? VideoPause : VideoPlay"
          @click="toggleConnection"
          size="small"
        >
          {{ isConnected ? '断开连接' : '连接服务器' }}
        </el-button>
        <el-button type="primary" icon="Refresh" @click="clearLogs" size="small">
          清空日志
        </el-button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <FilterPanel :filters="filterConfigs" @change="handleFilterChange" />

      <div class="filter-section">
        <el-button type="info" icon="Setting" @click="showSettings = true" size="small">
          设置
        </el-button>
        <el-button
          type="primary"
          :icon="statsVisible ? 'ArrowUp' : 'ArrowDown'"
          @click="toggleStats"
          size="small"
        >
          {{ statsVisible ? '隐藏统计' : '显示统计' }}
        </el-button>
      </div>
    </div>

    <!-- 统计面板 -->
    <div v-if="statsVisible" class="stats-panel">
      <div class="stats-section">
        <h3>日志级别统计</h3>
        <div class="stats-grid">
          <div v-for="(count, level) in levelStats" :key="level" class="stat-item">
            <span class="stat-label" :class="`level-${level.toLowerCase()}`">{{ level }}</span>
            <span class="stat-value">{{ count }}</span>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3>模块统计</h3>
        <div class="stats-grid">
          <div v-for="(count, module) in moduleStats" :key="module" class="stat-item">
            <span class="stat-label">{{ module }}</span>
            <span class="stat-value">{{ count }}</span>
            <span class="stat-frequency">({{ getLogFrequency(module) }}/min)</span>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3>总体信息</h3>
        <div class="stats-info">
          <div class="info-item">
            <span class="info-label">总日志数:</span>
            <span class="info-value">{{ logs.length }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">每分钟频率:</span>
            <span class="info-value">{{ getLogFrequency() }}/min</span>
          </div>
          <div class="info-item">
            <span class="info-label">被限制日志:</span>
            <span class="info-value">{{ rateLimitedCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div class="logs-container" ref="logsContainer" @scroll="handleScroll">
      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        class="log-entry"
        :class="[getLogClass(log.level), { 'log-merged': log.merged }]"
      >
        <div class="log-time">
          {{ formatTime(log.merged ? log.lastTimestamp! : log.timestamp) }}
        </div>
        <div class="log-level" :class="`level-${log.level.toLowerCase()}`">
          {{ log.level }}
          <span v-if="log.merged" class="merge-count">×{{ log.count }}</span>
        </div>
        <div class="log-module">{{ log.module }}</div>
        <div class="log-message">
          <span v-if="log.message.length > 200 && !expandedLogs[index]" class="message-preview">
            {{ truncateMessage(log.message) }}
            <el-button text size="small" @click="toggleExpand(index)" class="expand-btn">
              展开
            </el-button>
          </span>
          <span v-else-if="log.message.length > 200 && expandedLogs[index]" class="message-full">
            {{ log.message }}
            <el-button text size="small" @click="toggleExpand(index)" class="expand-btn">
              收起
            </el-button>
          </span>
          <span v-else class="message-normal">{{ log.message }}</span>
          <span v-if="log.merged" class="merge-indicator">
            (合并显示，最后更新: {{ formatTime(log.lastTimestamp!) }})
          </span>
        </div>
      </div>

      <div v-if="filteredLogs.length === 0" class="no-logs">
        <el-empty description="暂无日志数据" />
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="连接设置" width="400px">
      <div class="settings-form">
        <el-form :model="settings" label-width="100px">
          <el-form-item label="WebSocket地址">
            <el-input v-model="settings.wsUrl" :placeholder="props.wsUrl" />
          </el-form-item>
          <el-form-item label="自动滚动">
            <el-switch v-model="settings.autoScroll" />
          </el-form-item>
          <el-form-item label="最大显示条数">
            <el-input-number v-model="settings.maxLogs" :min="100" :max="10000" :step="100" />
          </el-form-item>
          <el-form-item label="启用日志合并">
            <el-switch v-model="settings.enableLogMerge" />
          </el-form-item>
          <el-form-item label="合并间隔(毫秒)">
            <el-input-number
              v-model="settings.mergeInterval"
              :min="100"
              :max="10000"
              :step="100"
              :disabled="!settings.enableLogMerge"
            />
          </el-form-item>
          <el-form-item label="启用频率限制">
            <el-switch v-model="settings.enableRateLimit" />
          </el-form-item>
          <el-form-item label="每秒最大日志数">
            <el-input-number
              v-model="settings.rateLimitPerSecond"
              :min="1"
              :max="1000"
              :step="1"
              :disabled="!settings.enableRateLimit"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="applySettings">应用</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, VideoPlay, VideoPause, Refresh, Setting } from '@element-plus/icons-vue'
import FilterPanel from '@/components/FilterPanel.vue'

// Props定义
interface Props {
  title?: string
  wsUrl?: string
  maxLogs?: number
  autoScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '日志查看器',
  wsUrl: 'ws://localhost:20914/ws/logs',
  maxLogs: 1000,
  autoScroll: true,
})

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'LogViewerComponent',
})

// 类型定义
interface LogEntry {
  timestamp: number
  level: string
  module: string
  message: string
  count?: number
  lastTimestamp?: number
  merged?: boolean
}

interface WebSocketMessage {
  type: 'log' | 'error' | 'pong'
  timestamp?: number
  level?: string
  module?: string
  message?: string
  errorCode?: string
}

// 响应式数据
const isConnected = ref(false)
const logs = ref<LogEntry[]>([])
const selectedLevels = ref<string[]>(['INFO', 'WARNING', 'ERROR'])
const selectedModules = ref<string[]>([]) // 空数组表示全选所有模块
const showSettings = ref(false)
const logsContainer = ref<HTMLElement>()
const expandedLogs = ref<Record<number, boolean>>({})
const dynamicModules = ref<Set<string>>(new Set())

// 频率限制相关
const logTimestamps = ref<number[]>([])
const rateLimitedCount = ref(0)

// 智能滚动相关
const userScrolledUp = ref(false)
const scrollPausedBySpam = ref(false)
const lastScrollCheck = ref(0)
const spamDetectionThreshold = ref(5) // 5条日志/秒算刷屏

// 统计数据相关
const statsVisible = ref(false)
const moduleStats = ref<Record<string, number>>({})
const levelStats = ref<Record<string, number>>({})
const lastStatsUpdate = ref(0)

// 配置数据
const availableLevels = ['TRACE', 'DEBUG', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']

// 筛选器配置
const filterConfigs = computed(() => [
  {
    key: 'logLevels',
    label: '日志级别',
    options: availableLevels.map((level) => ({ value: level, label: level })),
    selectedValues: selectedLevels.value,
    showSelectAll: true,
  },
  {
    key: 'modules',
    label: '模块',
    options: availableModules.value.map((module) => ({ value: module, label: module })),
    selectedValues: selectedModules.value,
    showSelectAll: true,
  },
])

// 设置
const settings = ref({
  wsUrl: props.wsUrl,
  autoScroll: props.autoScroll,
  maxLogs: props.maxLogs,
  enableLogMerge: true,
  mergeInterval: 1000, // 合并时间间隔（毫秒）
  enableRateLimit: false,
  rateLimitPerSecond: 10, // 每秒最大日志条数
})

// WebSocket实例
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let heartbeatTimer: number | null = null

// 计算属性
const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    // 日志级别过滤逻辑
    let levelMatch = false
    if (selectedLevels.value.length === 0) {
      // 空数组：显示所有日志（全选）
      levelMatch = true
    } else if (selectedLevels.value.length === 1 && selectedLevels.value[0] === '__NONE__') {
      // 特殊值：不显示任何日志
      levelMatch = false
    } else if (selectedLevels.value.length === availableLevels.length) {
      // 选择了所有级别：显示所有日志
      levelMatch = true
    } else {
      // 选择了部分级别：只显示匹配的日志
      levelMatch = selectedLevels.value.includes(log.level)
    }

    // 模块过滤逻辑
    let moduleMatch = false
    if (selectedModules.value.length === 0) {
      // 空数组：显示所有日志（全选）
      moduleMatch = true
    } else if (selectedModules.value.length === 1 && selectedModules.value[0] === '__NONE__') {
      // 特殊值：不显示任何日志
      moduleMatch = false
    } else if (selectedModules.value.length === availableModules.value.length) {
      // 选择了所有模块：显示所有日志
      moduleMatch = true
    } else {
      // 选择了部分模块：只显示匹配的日志
      moduleMatch = selectedModules.value.includes(log.module)
    }

    return levelMatch && moduleMatch
  })
})

const availableModules = computed(() => {
  return Array.from(dynamicModules.value).sort()
})

// 工具函数
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
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

// 频率限制检查函数
const checkRateLimit = (): boolean => {
  if (!settings.value.enableRateLimit) {
    return false // 不限制
  }

  const now = Date.now()
  const windowStart = now - 1000 // 1秒时间窗口

  // 清理过期的timestamp
  logTimestamps.value = logTimestamps.value.filter((timestamp) => timestamp > windowStart)

  // 检查是否超过限制
  if (logTimestamps.value.length >= settings.value.rateLimitPerSecond) {
    rateLimitedCount.value++
    return true // 超过限制，需要丢弃
  }

  // 添加当前timestamp
  logTimestamps.value.push(now)
  return false // 没有超过限制
}

// 刷屏检测函数
const detectSpam = (): boolean => {
  const now = Date.now()
  if (now - lastScrollCheck.value < 1000) {
    return false // 每秒只检测一次
  }

  lastScrollCheck.value = now
  const recentLogs = logs.value.filter((log) => now - log.timestamp < 1000)

  if (recentLogs.length >= spamDetectionThreshold.value) {
    return true // 检测到刷屏
  }

  return false
}

// 检查用户是否滚动到底部
const isScrolledToBottom = (): boolean => {
  if (!logsContainer.value) return true

  const container = logsContainer.value
  const threshold = 50 // 距离底部50px以内算到底部
  return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
}

// 处理滚动事件
const handleScroll = () => {
  if (!logsContainer.value) return

  const atBottom = isScrolledToBottom()

  if (!atBottom) {
    userScrolledUp.value = true
  } else {
    userScrolledUp.value = false
  }
}

// 智能滚动函数
const smartScrollToBottom = () => {
  if (!settings.value.autoScroll) return
  if (userScrolledUp.value) return
  if (scrollPausedBySpam.value) return

  // 检查是否检测到刷屏
  if (detectSpam()) {
    scrollPausedBySpam.value = true
    ElMessage.info('检测到日志刷屏，已暂停自动滚动')
    return
  }

  nextTick(() => {
    scrollToBottom()
  })
}

// 更新统计数据
const updateStats = () => {
  const now = Date.now()
  if (now - lastStatsUpdate.value < 1000) {
    return // 每秒最多更新一次
  }

  lastStatsUpdate.value = now

  // 重置统计数据
  moduleStats.value = {}
  levelStats.value = {}

  // 统计各模块和级别的日志数量
  logs.value.forEach((log) => {
    // 统计模块
    if (!moduleStats.value[log.module]) {
      moduleStats.value[log.module] = 0
    }
    moduleStats.value[log.module] += log.count || 1

    // 统计级别
    if (!levelStats.value[log.level]) {
      levelStats.value[log.level] = 0
    }
    levelStats.value[log.level] += log.count || 1
  })
}

// 计算日志频率（每分钟）
const getLogFrequency = (module?: string): number => {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  const recentLogs = logs.value.filter((log) => {
    const matchesModule = !module || log.module === module
    const isRecent = log.timestamp > oneMinuteAgo
    return matchesModule && isRecent
  })

  const totalCount = recentLogs.reduce((sum, log) => sum + (log.count || 1), 0)
  return Math.round(totalCount)
}

// 切换统计显示
const toggleStats = () => {
  statsVisible.value = !statsVisible.value
  if (statsVisible.value) {
    updateStats()
  }
}

const getLogClass = (level: string): string => {
  return `log-${level.toLowerCase()}`
}

const toggleExpand = (index: number) => {
  expandedLogs.value[index] = !expandedLogs.value[index]
}

const truncateMessage = (message: string): string => {
  if (message.length <= 200) return message
  return message.substring(0, 200) + '...'
}

// WebSocket相关方法
const connect = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return
  }

  try {
    ws = new WebSocket(settings.value.wsUrl)

    ws.onopen = () => {
      isConnected.value = true
      ElMessage.success('WebSocket连接成功')
      subscribeToLogs()
      startHeartbeat()
    }

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        handleMessage(data)
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    }

    ws.onclose = () => {
      isConnected.value = false
      ElMessage.warning('WebSocket连接断开')
      stopHeartbeat()
      // 移除自动重连调用，保持手动连接模式
    }

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
      ElMessage.error('WebSocket连接出错' + JSON.stringify(error))
    }
  } catch (error) {
    console.error('创建WebSocket连接失败:', error)
    ElMessage.error('创建WebSocket连接失败')
  }
}

const disconnect = () => {
  if (ws) {
    ws.close()
    ws = null
  }
  isConnected.value = false
  stopHeartbeat()
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  ElMessage.info('WebSocket连接已断开')
}

const toggleConnection = () => {
  if (isConnected.value) {
    disconnect()
  } else {
    connect()
  }
}

const subscribeToLogs = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return

  // 如果没有选择任何模块，或者没有可用模块，则订阅所有（发送空数组或不包含modules字段）
  const subscription: any = {
    type: 'subscribe',
    levels: selectedLevels.value,
  }

  // 只有当有选择特定模块时才包含modules字段
  if (
    selectedModules.value.length > 0 &&
    selectedModules.value.length < availableModules.value.length
  ) {
    subscription.modules = selectedModules.value
  }
  // 如果selectedModules为空或等于availableModules，则表示订阅所有，不包含modules字段

  ws.send(JSON.stringify(subscription))
}

// 筛选器事件处理
const handleFilterChange = (filterKey: string, selectedValues: string[]) => {
  if (filterKey === 'logLevels') {
    selectedLevels.value = selectedValues
  } else if (filterKey === 'modules') {
    selectedModules.value = selectedValues
  }

  if (isConnected.value) {
    subscribeToLogs()
  }
}

const updateSubscription = () => {
  if (isConnected.value) {
    subscribeToLogs()
  }
}

// 处理模块选择变化
const handleModuleSelection = () => {
  updateSubscription()
}

// 全选/取消全选模块
const toggleAllModules = () => {
  if (selectedModules.value.length === availableModules.value.length) {
    // 取消全选
    selectedModules.value = []
  } else {
    // 全选所有可用模块
    selectedModules.value = [...availableModules.value]
  }
  updateSubscription()
}

const handleMessage = (data: WebSocketMessage) => {
  switch (data.type) {
    case 'log':
      if (data.timestamp && data.level && data.module && data.message) {
        // 频率限制检查
        if (checkRateLimit()) {
          // 超过频率限制，丢弃此日志
          break
        }

        // 过滤检查：如果新日志不在指定范围内，直接丢弃
        let shouldStore = true

        // 检查日志级别
        if (selectedLevels.value.length === 0) {
          // 空数组：存储所有日志（全选）
          shouldStore = true
        } else if (selectedLevels.value.length === 1 && selectedLevels.value[0] === '__NONE__') {
          // 特殊值：不存储任何日志
          shouldStore = false
        } else if (selectedLevels.value.length === availableLevels.length) {
          // 选择了所有级别：存储所有日志
          shouldStore = true
        } else {
          // 选择了部分级别：只存储匹配的日志
          shouldStore = selectedLevels.value.includes(data.level)
        }

        // 检查模块（如果级别检查通过才继续）
        if (shouldStore) {
          if (selectedModules.value.length === 0) {
            // 空数组：存储所有日志（全选）
            shouldStore = true
          } else if (
            selectedModules.value.length === 1 &&
            selectedModules.value[0] === '__NONE__'
          ) {
            // 特殊值：不存储任何日志
            shouldStore = false
          } else if (selectedModules.value.length === availableModules.value.length) {
            // 选择了所有模块：存储所有日志
            shouldStore = true
          } else {
            // 选择了部分模块：只存储匹配的日志
            shouldStore = selectedModules.value.includes(data.module)
          }
        }

        if (!shouldStore) {
          // 日志不符合当前筛选条件，丢弃
          break
        }

        // 动态注册新模块
        if (!dynamicModules.value.has(data.module)) {
          dynamicModules.value.add(data.module)
          console.log(`新模块已注册: ${data.module}`)
        }

        const newLogEntry: LogEntry = {
          timestamp: data.timestamp,
          level: data.level,
          module: data.module,
          message: data.message,
        }

        // 检查是否启用日志合并
        if (settings.value.enableLogMerge) {
          // 查找是否已存在相同的日志
          const existingIndex = logs.value.findIndex(
            (log) =>
              !log.merged &&
              log.level === newLogEntry.level &&
              log.module === newLogEntry.module &&
              log.message === newLogEntry.message &&
              data.timestamp &&
              log.timestamp &&
              data.timestamp - log.timestamp <= settings.value.mergeInterval,
          )

          if (existingIndex !== -1) {
            // 合并到现有日志
            const existingLog = logs.value[existingIndex]
            existingLog.count = (existingLog.count || 1) + 1
            existingLog.lastTimestamp = data.timestamp
            existingLog.merged = true
            break
          }
        }

        // 添加新日志
        logs.value.push(newLogEntry)

        // 限制日志数量，保留最新的日志
        if (logs.value.length > settings.value.maxLogs) {
          logs.value = logs.value.slice(-settings.value.maxLogs)
        }

        // 智能自动滚动到底部
        smartScrollToBottom()

        // 更新统计数据
        updateStats()
      }
      break

    case 'error':
      ElMessage.error(`WebSocket错误: ${data.message || '未知错误'}`)
      break

    case 'pong':
      // 心跳响应，无需处理
      break
  }
}

const startHeartbeat = () => {
  heartbeatTimer = window.setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }),
      )
    }
  }, 30000) // 30秒心跳
}

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

const scheduleReconnect = () => {
  // 移除自动重连功能，保持手动连接模式
}

const scrollToBottom = () => {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight
  }
}

// 恢复自动滚动
const resumeAutoScroll = () => {
  userScrolledUp.value = false
  scrollPausedBySpam.value = false
  ElMessage.success('已恢复自动滚动')

  // 立即滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    logs.value = []
    expandedLogs.value = {}
    dynamicModules.value.clear()
    logTimestamps.value = []
    rateLimitedCount.value = 0
    userScrolledUp.value = false
    scrollPausedBySpam.value = false
    ElMessage.success('日志已清空')
  } catch {
    // 用户取消操作
  }
}

const applySettings = () => {
  showSettings.value = false
  ElMessage.success('设置已应用')

  // 如果连接状态发生变化，需要重新连接
  if (isConnected.value) {
    disconnect()
    setTimeout(() => connect(), 1000)
  }
}

// 生命周期
onMounted(() => {
  // 默认未连接，等待用户手动连接
  console.log('LogViewer组件被挂载')
})

onActivated(() => {
  // 组件被激活时（从其他页面返回到日志页面）
  // 可以在这里恢复一些状态或执行其他操作
  console.log('LogViewer组件被激活')
})

onDeactivated(() => {
  // 组件被停用时（离开日志页面到其他页面）
  // 可以在这里暂停一些操作或保存状态
  console.log('LogViewer组件被停用')
})

onUnmounted(() => {
  // 注意：由于使用了keep-alive，组件不会被真正卸载
  // 但为了安全起见，仍然保留断开连接的逻辑
  // 实际上，在keep-alive模式下，onUnmounted不会被频繁调用
  // 只有在页面刷新或组件真正被销毁时才会调用
  console.log('LogViewer组件真正被卸载')
  disconnect()
})
</script>

<style scoped>
.log-viewer {
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
  align-items: center;
}

.rate-limit-status {
  margin-right: 10px;
}

.scroll-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 10px;
}

.filters {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-weight: 500;
  color: #666;
  margin-right: 12px;
  min-width: 80px;
}

.module-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-all-btn {
  align-self: flex-start;
  color: #409eff;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  transition: all 0.2s;
}

.select-all-btn:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.logs-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
}

.log-entry {
  display: flex;
  padding: 8px 12px;
  margin-bottom: 2px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.log-entry:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.log-time {
  color: #999;
  font-size: 12px;
  min-width: 160px;
  margin-right: 12px;
}

.log-level {
  font-weight: bold;
  min-width: 80px;
  margin-right: 12px;
  text-align: center;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 12px;
}

.level-trace {
  background-color: #f0f0f0;
  color: #666;
}

.level-debug {
  background-color: #e6f7ff;
  color: #1890ff;
}

.level-info {
  background-color: #f6ffed;
  color: #52c41a;
}

.level-success {
  background-color: #f6ffed;
  color: #52c41a;
}

.level-warning {
  background-color: #fffbe6;
  color: #faad14;
}

.level-error {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.level-critical {
  background-color: #ffe6e6;
  color: #cf1322;
}

.log-module {
  color: #666;
  min-width: 100px;
  margin-right: 12px;
  font-weight: 500;
}

.log-message {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-preview,
.message-full,
.message-normal {
  white-space: pre-wrap;
  word-break: break-word;
}

.expand-btn {
  margin-left: 8px;
  color: #409eff;
  font-size: 12px;
  padding: 2px 4px;
}

.log-trace {
  border-left: 3px solid #d9d9d9;
}

.log-debug {
  border-left: 3px solid #1890ff;
}

.log-info {
  border-left: 3px solid #52c41a;
}

.log-success {
  border-left: 3px solid #52c41a;
}

.log-warning {
  border-left: 3px solid #faad14;
}

.log-error {
  border-left: 3px solid #ff4d4f;
}

.log-critical {
  border-left: 3px solid #cf1322;
}

.log-merged {
  border-left: 3px solid #722ed1;
  background-color: rgba(114, 46, 209, 0.05);
}

.merge-count {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 1px 4px;
  font-size: 10px;
  margin-left: 4px;
  font-weight: bold;
}

.merge-indicator {
  color: #722ed1;
  font-size: 11px;
  margin-left: 8px;
  font-style: italic;
}

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.settings-form {
  padding: 10px 0;
}

.stats-panel {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-section {
  margin-bottom: 20px;
}

.stats-section:last-child {
  margin-bottom: 0;
}

.stats-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 2px solid #409eff;
  padding-bottom: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.stat-label {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.stat-value {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

.stat-frequency {
  font-size: 12px;
  color: #666;
}

.stats-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.info-value {
  font-weight: bold;
  color: #409eff;
}
</style>
