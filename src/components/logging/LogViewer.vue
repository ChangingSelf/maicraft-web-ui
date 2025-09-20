<template>
  <div class="log-viewer">
    <!-- 页面标题和控制区域 -->
    <div class="header">
      <h1 class="title">
        <el-icon class="title-icon"><Document /></el-icon>
        {{ props.title }}
      </h1>
      <LogControls
        :is-connected="isConnected"
        :rate-limited-count="rateLimitedCount"
        :user-scrolled-up="userScrolledUp"
        :scroll-paused-by-spam="scrollPausedBySpam"
        :stats-visible="statsVisible"
        @toggle-connection="toggleConnection"
        @clear-logs="clearLogs"
        @show-settings="showSettings = true"
        @toggle-stats="toggleStats"
        @resume-auto-scroll="resumeAutoScroll"
      />
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <FilterPanel :filters="filterConfigs" @change="handleFilterChange" />
    </div>

    <!-- 统计面板 -->
    <LogStats
      :visible="statsVisible"
      :level-stats="levelStats"
      :module-stats="moduleStats"
      :total-logs="logs.length"
      :rate-limited-count="rateLimitedCount"
      :logs="logs"
    />

    <!-- 日志显示区域 -->
    <div class="logs-container" ref="logsContainer" @scroll="handleScroll">
      <LogEntry
        v-for="(log, index) in filteredLogs"
        :key="index"
        :log="log"
        :expanded="expandedLogs[index]"
        @toggle-expand="toggleExpand(index)"
      />

      <div v-if="filteredLogs.length === 0" class="no-logs">
        <el-empty description="暂无日志数据" />
      </div>
    </div>

    <!-- 设置对话框 -->
    <LogSettings
      v-model="showSettings"
      :settings="settings"
      :default-ws-url="props.wsUrl"
      @apply="applySettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { createWebSocketManager } from '@/services/websocket'
import FilterPanel from '@/components/FilterPanel.vue'
import LogControls from './LogControls.vue'
import LogStats from './LogStats.vue'
import LogEntry from './LogEntry.vue'
import LogSettings from './LogSettings.vue'

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
  name: 'LogViewer',
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

// WebSocket管理器实例
let wsManager: any = null

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
  if (wsManager && wsManager.isConnected) {
    return
  }

  try {
    // 创建WebSocket管理器
    wsManager = createWebSocketManager(settings.value.wsUrl, {
      heartbeatInterval: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
    })

    // 添加消息处理器
    wsManager.addMessageHandler(handleMessage)

    // 添加连接状态处理器
    wsManager.addConnectionHandler((connected: boolean) => {
      isConnected.value = connected
      if (connected) {
        ElMessage.success('WebSocket连接成功')
        subscribeToLogs()
      } else {
        ElMessage.warning('WebSocket连接断开')
      }
    })

    // 添加错误处理器
    wsManager.addErrorHandler((error: Event) => {
      console.error('WebSocket错误:', error)
      ElMessage.error('WebSocket连接出错')
    })

    // 连接WebSocket
    wsManager.connect()
  } catch (error) {
    console.error('创建WebSocket连接失败:', error)
    ElMessage.error('创建WebSocket连接失败')
  }
}

const disconnect = () => {
  if (wsManager) {
    // 清理处理器
    wsManager.removeMessageHandler(handleMessage)
    wsManager.removeConnectionHandler(() => {})
    wsManager.removeErrorHandler(() => {})

    // 断开连接
    wsManager.disconnect()
    wsManager = null
  }
  isConnected.value = false
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
  if (!wsManager || !wsManager.isConnected) return

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

  wsManager.sendMessage(subscription)
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

// 心跳包已统一到WebSocket管理器中，不需要单独实现

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

.filters {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
