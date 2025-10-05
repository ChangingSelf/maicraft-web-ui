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
        :stats-visible="statsVisible"
        :auto-scroll-enabled="manualAutoScrollEnabled"
        @toggle-connection="toggleConnection"
        @clear-logs="clearLogs"
        @show-settings="showSettings = true"
        @toggle-stats="toggleStats"
        @toggle-auto-scroll="toggleAutoScroll"
      />

      <!-- 测试按钮（仅开发环境显示） -->
      <div v-if="true" class="test-controls" style="margin-top: 10px">
        <el-button size="small" @click="addTestLogs" type="primary"> 添加测试日志 </el-button>
        <el-button size="small" @click="addSingleTestLog" type="success" style="margin-left: 10px">
          添加单条日志
        </el-button>
        <span style="margin-left: 10px; font-size: 12px; color: #666">
          模块数量: {{ availableModules.length }} | 日志数量: {{ logs.length }} | 自动滚动:
          {{ manualAutoScrollEnabled ? '开' : '关' }}
        </span>
      </div>
    </div>

    <!-- 筛选器和搜索 -->
    <div class="filters">
      <div class="filter-container">
        <!-- 日志级别筛选 -->
        <div class="filter-item">
          <label class="filter-label">级别：</label>
          <el-select
            v-model="displaySelectedLevels"
            multiple
            collapse-tags-tooltip
            placeholder="选择日志级别"
            size="small"
            @change="handleLevelChange"
          >
            <template #header>
              <el-button text size="small" @click="toggleAllLevels" class="select-all-option">
                {{ isAllLevelsSelected ? '取消全选' : '全选' }}
              </el-button>
            </template>
            <el-option v-for="level in availableLevels" :key="level" :label="level" :value="level">
              <span class="level-option" :class="`level-${level.toLowerCase()}`">
                {{ level }}
              </span>
            </el-option>
          </el-select>
        </div>

        <!-- 模块筛选 -->
        <div class="filter-item">
          <label class="filter-label">模块：</label>
          <el-select
            v-model="displaySelectedModules"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择模块"
            size="small"
            filterable
            class="module-select"
            @change="handleModuleChange"
          >
            <template #header>
              <el-button text size="small" @click="toggleAllModules" class="select-all-option">
                {{ isAllModulesSelected ? '取消全选' : '全选' }}
              </el-button>
            </template>
            <el-option
              v-for="module in availableModules"
              :key="module"
              :label="module"
              :value="module"
            />
          </el-select>
        </div>

        <!-- 搜索区域 -->
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索日志内容..."
            class="search-input"
            size="small"
            clearable
            @input="handleSearchInput"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-checkbox
            v-model="useRegex"
            @change="handleSearchInput"
            class="regex-checkbox"
            size="small"
          >
            正则
          </el-checkbox>

          <div class="search-stats" v-if="searchQuery">{{ searchMatchCount }} 条</div>
        </div>
      </div>
    </div>

    <!-- 统计面板 -->
    <LogStats
      :visible="statsVisible"
      :level-stats="levelStats"
      :module-stats="moduleStats"
      :total-logs="logs.length"
      :rate-limited-count="rateLimitedCount"
      :logs="
        logs.map((log) => ({ timestamp: log.timestamp, module: log.module, count: log.count }))
      "
    />

    <!-- 日志显示区域 -->
    <div class="logs-container" ref="logsContainer" @scroll="handleScroll">
      <!-- 导航按钮 -->
      <div class="navigation-buttons" v-if="filteredLogs.length > 10">
        <el-button
          type="primary"
          size="small"
          circle
          @click="scrollToTop"
          class="nav-btn"
          title="回到顶部"
        >
          <el-icon><ArrowUp /></el-icon>
        </el-button>

        <el-button
          type="primary"
          size="small"
          circle
          @click="scrollToBottom"
          class="nav-btn"
          title="回到底部"
        >
          <el-icon><ArrowDown /></el-icon>
        </el-button>
      </div>
      <LogEntry
        v-for="(log, index) in filteredLogs"
        :key="index"
        :log="log"
        :line-number="index + 1"
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
import {
  ref,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  nextTick,
  computed,
  watch,
} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Search, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { createWebSocketManager, getWebSocketManager } from '@/services/websocket'
import { useWebSocketDataStore } from '@/stores/websocketData'
import {
  getGlobalConnectionStatus,
  connectSingleEndpoint,
  disconnectSingleEndpoint,
} from '@/services/globalWebSocketService'
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
  timestamp: number | string
  level: string
  module: string
  message: string
  count?: number
  lastTimestamp?: number | string
  merged?: boolean
  formatted_timestamp?: string
}

interface WebSocketMessage {
  type: 'log' | 'error' | 'pong'
  timestamp?: number
  level?: string
  module?: string
  message?: string
  errorCode?: string
}

// 使用全局WebSocket数据存储
const store = useWebSocketDataStore()
const {
  logs: globalLogs,
  mcpLogs: globalMcpLogs,
  clearEndpointData,
  addLogEntry,
  addMCPLogEntry,
} = store
const globalConnectionStatus = getGlobalConnectionStatus()

// 根据URL确定使用哪种日志数据
const logs = computed(() => {
  // 如果是 MCP server 日志查看器
  if (props.wsUrl.includes('mcp-logs')) {
    return globalMcpLogs
  }
  // 否则是 maicraft 日志
  return globalLogs
})

// 根据URL确定连接状态
const isConnected = computed(() => {
  if (props.wsUrl.includes('mcp-logs')) {
    return globalConnectionStatus.connectionStatus.MCP_LOGS || false
  }
  return globalConnectionStatus.connectionStatus.LOGS || false
})
const selectedLevels = ref<string[]>(['INFO', 'WARNING', 'ERROR'])
const selectedModules = ref<string[]>([]) // 空数组表示全选所有模块
const showSettings = ref(false)
const logsContainer = ref<HTMLElement>()
const expandedLogs = ref<Record<number, boolean>>({})

// 搜索相关
const searchQuery = ref('')
const useRegex = ref(false)
const searchMatchCount = ref(0)

// 显示用的选中值（处理全选逻辑）
const displaySelectedLevels = computed({
  get: () => {
    if (selectedLevels.value.length === 0) {
      return availableLevels
    }
    if (selectedLevels.value.length === 1 && selectedLevels.value[0] === '__NONE__') {
      return []
    }
    return selectedLevels.value
  },
  set: (values: string[]) => {
    // 这里会被 handleLevelChange 处理，不直接设置
  },
})

const displaySelectedModules = computed({
  get: () => {
    if (selectedModules.value.length === 0) {
      return availableModules.value
    }
    if (selectedModules.value.length === 1 && selectedModules.value[0] === '__NONE__') {
      return []
    }
    return selectedModules.value
  },
  set: (values: string[]) => {
    // 这里会被 handleModuleChange 处理，不直接设置
  },
})

// 全选状态检查
const isAllLevelsSelected = computed(() => {
  return selectedLevels.value.length === 0 || selectedLevels.value.length === availableLevels.length
})

const isAllModulesSelected = computed(() => {
  return (
    selectedModules.value.length === 0 ||
    selectedModules.value.length === availableModules.value.length
  )
})

// 频率限制相关
const logTimestamps = ref<number[]>([])
const rateLimitedCount = ref(0)

// 智能滚动相关
const manualAutoScrollEnabled = ref(true) // 用户手动控制的自动滚动开关

// 统计数据相关
const statsVisible = ref(false)
const moduleStats = ref<Record<string, number>>({})
const levelStats = ref<Record<string, number>>({})
const lastStatsUpdate = ref(0)

// 配置数据
const availableLevels = ['TRACE', 'DEBUG', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']

// 注意：filterConfigs 已被新的选择器替代，保留此注释作为参考

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
// WebSocket管理器（不再需要本地管理器，使用全局管理器）
// let wsManager: any = null

// 搜索匹配函数
const isSearchMatch = (log: LogEntry, query: string, useRegex: boolean): boolean => {
  if (!query.trim()) return true

  const searchText = `${log.message} ${log.module} ${log.level}`.toLowerCase()

  if (useRegex) {
    try {
      const regex = new RegExp(query, 'i')
      return regex.test(searchText)
    } catch (e) {
      // 如果正则表达式无效，降级为普通文本搜索
      return searchText.includes(query.toLowerCase())
    }
  } else {
    return searchText.includes(query.toLowerCase())
  }
}

// 计算属性
const filteredLogs = computed(() => {
  const filtered = logs.value
    .filter((log) => {
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

      // 搜索匹配逻辑
      const searchMatch = isSearchMatch(log, searchQuery.value, useRegex.value)

      return levelMatch && moduleMatch && searchMatch
    })
    .sort((a, b) => {
      // 按时间戳排序，最旧的在前，最新的在后
      const aTime = typeof a.timestamp === 'number' ? a.timestamp : parseInt(String(a.timestamp))
      const bTime = typeof b.timestamp === 'number' ? b.timestamp : parseInt(String(b.timestamp))
      return aTime - bTime
    })

  return filtered
})

const availableModules = computed(() => {
  // 从日志数据中动态提取所有模块
  const modules = new Set<string>()
  logs.value.forEach((log) => {
    if (log.module) {
      modules.add(log.module)
    }
  })
  const moduleArray = Array.from(modules).sort()
  return moduleArray
})

// 工具函数
const formatTime = (timestamp: number | string): string => {
  // 确保timestamp是数字类型
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp

  // 检查时间戳是否有效
  if (
    isNaN(timestampNum) ||
    timestampNum < 0 ||
    timestampNum > Date.now() + 365 * 24 * 60 * 60 * 1000
  ) {
    return '时间无效'
  }

  try {
    const date = new Date(timestampNum)
    // 再次验证日期是否有效
    if (isNaN(date.getTime())) {
      return '时间无效'
    }
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
  } catch (error) {
    console.warn('日志时间戳格式化失败:', timestamp, error)
    return '时间无效'
  }
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

// 刷屏检测功能已移除，完全由用户手动控制

// 检查滚动位置功能已移除，完全由用户手动控制

// 处理滚动事件 - 移除自动暂停逻辑，完全由用户手动控制
const handleScroll = () => {
  // 不再自动检测滚动位置，完全由用户通过按钮控制自动滚动
}

// 智能自动滚动到底部 - 完全由用户控制
const smartScrollToBottom = () => {
  // 1. 检查全局设置中的自动滚动开关
  if (!settings.value.autoScroll) return

  // 2. 检查用户手动控制的自动滚动开关
  if (!manualAutoScrollEnabled.value) return

  // 执行自动滚动到底部
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
    const logTime =
      typeof log.timestamp === 'number' ? log.timestamp : parseInt(String(log.timestamp))
    const isRecent = logTime > oneMinuteAgo
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
const connect = async () => {
  try {
    if (props.wsUrl.includes('mcp-logs')) {
      await connectSingleEndpoint('MCP_LOGS')
    } else {
      await connectSingleEndpoint('LOGS')
    }
  } catch (error) {
    console.error('连接失败:', error)
    ElMessage.error('连接失败')
  }
}

const disconnect = () => {
  try {
    if (props.wsUrl.includes('mcp-logs')) {
      disconnectSingleEndpoint('MCP_LOGS')
    } else {
      disconnectSingleEndpoint('LOGS')
    }
  } catch (error) {
    console.error('断开连接失败:', error)
    ElMessage.error('断开连接失败')
  }
}

const toggleConnection = () => {
  if (isConnected.value) {
    disconnect()
  } else {
    connect()
  }
}

const subscribeToLogs = () => {
  // 订阅逻辑已经由全局连接管理器处理
  // 这里可以留空或者添加特定的筛选逻辑
  console.log('日志订阅已由全局管理器处理')
}

// 搜索输入处理
const handleSearchInput = () => {
  // 搜索功能通过 computed 属性自动响应，这里可以添加防抖逻辑
  // 目前直接响应，如果性能有问题可以添加 debounce
}

// 导航功能
const scrollToTop = () => {
  if (logsContainer.value) {
    logsContainer.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

const scrollToBottom = () => {
  if (logsContainer.value) {
    logsContainer.value.scrollTo({
      top: logsContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

// 新的选择器事件处理
const handleLevelChange = (values: string[]) => {
  if (values.length === 0) {
    selectedLevels.value = ['__NONE__']
  } else if (values.length === availableLevels.length) {
    selectedLevels.value = []
  } else {
    selectedLevels.value = values
  }
  if (isConnected.value) {
    subscribeToLogs()
  }
}

const handleModuleChange = (values: string[]) => {
  if (values.length === 0) {
    selectedModules.value = ['__NONE__']
  } else if (values.length === availableModules.value.length) {
    selectedModules.value = []
  } else {
    selectedModules.value = values
  }
  if (isConnected.value) {
    subscribeToLogs()
  }
}

const toggleAllLevels = () => {
  if (isAllLevelsSelected.value) {
    selectedLevels.value = ['__NONE__']
  } else {
    selectedLevels.value = []
  }
  if (isConnected.value) {
    subscribeToLogs()
  }
}

const toggleAllModules = () => {
  if (isAllModulesSelected.value) {
    selectedModules.value = ['__NONE__']
  } else {
    selectedModules.value = []
  }
  if (isConnected.value) {
    subscribeToLogs()
  }
}

// 保留原来的方法以保持兼容性
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

        const newLogEntry: LogEntry = {
          timestamp: data.timestamp,
          level: data.level,
          module: data.module,
          message: data.message,
        }

        // 检查是否启用日志合并
        if (settings.value.enableLogMerge) {
          // 查找是否已存在相同的日志
          const existingIndex = logs.value.findIndex((log) => {
            if (log.merged) return false
            if (log.level !== newLogEntry.level) return false
            if (log.module !== newLogEntry.module) return false
            if (log.message !== newLogEntry.message) return false

            const dataTime =
              typeof data.timestamp === 'number' ? data.timestamp : parseInt(String(data.timestamp))
            const logTime =
              typeof log.timestamp === 'number' ? log.timestamp : parseInt(String(log.timestamp))

            return dataTime && logTime && dataTime - logTime <= settings.value.mergeInterval
          })

          if (existingIndex !== -1) {
            // 合并到现有日志
            const existingLog = logs.value[existingIndex]
            existingLog.count = (existingLog.count || 1) + 1
            existingLog.lastTimestamp = data.timestamp
            existingLog.merged = true
            break
          }
        }

        // 添加新日志（由store处理数量限制）
        if (props.wsUrl.includes('mcp-logs')) {
          addMCPLogEntry(newLogEntry)
        } else {
          addLogEntry(newLogEntry)
        }

        // 自动滚动现在由watch(filteredLogs)处理

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

// 切换自动滚动 - 用户手动控制自动滚动开关
const toggleAutoScroll = () => {
  manualAutoScrollEnabled.value = !manualAutoScrollEnabled.value
  ElMessage.success(manualAutoScrollEnabled.value ? '已开启自动滚动' : '已暂停自动滚动')

  // 如果启用了自动滚动，立即滚动到底部
  if (manualAutoScrollEnabled.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 恢复自动滚动功能已移除，完全由用户手动控制

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 使用store的clearEndpointData函数清空日志
    if (props.wsUrl.includes('mcp-logs')) {
      clearEndpointData('MCP_LOGS')
    } else {
      clearEndpointData('LOGS')
    }

    // 重置所有筛选状态到默认值
    selectedLevels.value = ['INFO', 'WARNING', 'ERROR']
    selectedModules.value = [] // 空数组表示全选所有模块
    searchQuery.value = ''
    useRegex.value = false

    // 重置其他相关状态
    expandedLogs.value = {}
    logTimestamps.value = []
    rateLimitedCount.value = 0

    // 更新统计数据
    updateStats()

    ElMessage.success('日志已清空')
  } catch {
    // 用户取消操作
  }
}

// 添加单条测试日志（用于验证自动滚动）
const addSingleTestLog = () => {
  const testModules = [
    'minecraft.server',
    'minecraft.world',
    'minecraft.player',
    'minecraft.network',
  ]
  const testLevels = ['INFO', 'WARNING', 'ERROR']
  const testMessages = [
    '玩家加入游戏',
    '世界数据更新',
    '网络连接建立',
    '命令执行完成',
    '内存使用警告',
    '配置文件重载',
  ]

  const testLog = {
    timestamp: Date.now(),
    level: testLevels[Math.floor(Math.random() * testLevels.length)],
    module: testModules[Math.floor(Math.random() * testModules.length)],
    message:
      testMessages[Math.floor(Math.random() * testMessages.length)] +
      ` (${new Date().toLocaleTimeString()})`,
  }

  if (props.wsUrl.includes('mcp-logs')) {
    addMCPLogEntry(testLog)
  } else {
    addLogEntry(testLog)
  }

  ElMessage.success('已添加1条测试日志')
}

// 添加测试日志数据（用于开发测试）
const addTestLogs = () => {
  const testModules = [
    'minecraft.server',
    'minecraft.world',
    'minecraft.player',
    'minecraft.network',
  ]
  const testLevels = ['INFO', 'WARNING', 'ERROR']
  const testMessages = [
    '玩家加入游戏',
    '世界数据更新',
    '网络连接建立',
    '命令执行完成',
    '内存使用警告',
    '配置文件重载',
  ]

  // 添加10条测试日志
  for (let i = 0; i < 10; i++) {
    const testLog = {
      timestamp: Date.now() - Math.random() * 10000, // 随机时间戳
      level: testLevels[Math.floor(Math.random() * testLevels.length)],
      module: testModules[Math.floor(Math.random() * testModules.length)],
      message: testMessages[Math.floor(Math.random() * testMessages.length)],
    }

    if (props.wsUrl.includes('mcp-logs')) {
      addMCPLogEntry(testLog)
    } else {
      addLogEntry(testLog)
    }
  }

  ElMessage.success('已添加10条测试日志')
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

// 监听原始日志数据变化，触发自动滚动
watch(
  () => logs.value.length,
  (newLength, oldLength) => {
    // 只有当日志数量增加时才触发自动滚动
    if (newLength > oldLength) {
      // 使用更长的延迟确保DOM已更新
      setTimeout(() => {
        smartScrollToBottom()
      }, 50)
    }
  },
)

// 监听过滤后的日志变化，更新搜索匹配计数
watch(
  () => filteredLogs.value,
  (newFilteredLogs) => {
    // 更新搜索匹配计数
    searchMatchCount.value = searchQuery.value ? newFilteredLogs.length : 0
  },
  { immediate: true },
)

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
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.level-select,
.module-select {
  min-width: 120px;
}

.level-select {
  width: 160px;
}

.module-select {
  width: 200px;
}

.select-all-option {
  width: 100%;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 0;
  margin-bottom: 6px;
  padding-bottom: 6px;
}

.level-option {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
}

.level-option.level-trace {
  background-color: #f0f0f0;
  color: #666;
}

.level-option.level-debug {
  background-color: #e6f7ff;
  color: #1890ff;
}

.level-option.level-info {
  background-color: #f6ffed;
  color: #52c41a;
}

.level-option.level-success {
  background-color: #f6ffed;
  color: #52c41a;
}

.level-option.level-warning {
  background-color: #fffbe6;
  color: #faad14;
}

.level-option.level-error {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.level-option.level-critical {
  background-color: #ffe6e6;
  color: #cf1322;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.search-input {
  width: 200px;
}

.regex-checkbox {
  white-space: nowrap;
}

.regex-checkbox :deep(.el-checkbox__label) {
  font-size: 12px;
}

.search-stats {
  font-size: 11px;
  color: #666;
  padding: 2px 6px;
  background: #e3f2fd;
  border-radius: 3px;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .filter-container {
    gap: 16px;
  }

  .level-select {
    width: 140px;
  }

  .module-select {
    width: 180px;
  }
}

@media (max-width: 1024px) {
  .filter-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-item {
    justify-content: space-between;
  }

  .level-select,
  .module-select {
    flex: 1;
    max-width: 300px;
  }

  .search-section {
    justify-content: space-between;
  }

  .search-input {
    flex: 1;
    max-width: 200px;
  }
}

@media (max-width: 768px) {
  .filters {
    padding: 8px 12px;
  }

  .filter-container {
    gap: 10px;
  }

  .filter-item {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-label {
    margin-bottom: 4px;
  }

  .level-select,
  .module-select {
    width: 100%;
    max-width: none;
  }

  .search-section {
    flex-wrap: wrap;
    gap: 8px;
  }

  .search-input {
    width: 100%;
    max-width: none;
  }
}

.logs-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  position: relative;
}

.navigation-buttons {
  position: fixed;
  right: 30px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.nav-btn {
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  min-height: 40px !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.nav-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.nav-btn .el-icon {
  font-size: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
