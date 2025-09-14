<template>
  <div class="log-viewer">
    <!-- 页面标题 -->
    <div class="header">
      <h1 class="title">
        <el-icon class="title-icon"><Document /></el-icon>
        日志查看器
      </h1>
      <div class="controls">
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
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div class="logs-container" ref="logsContainer">
      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        class="log-entry"
        :class="getLogClass(log.level)"
      >
        <div class="log-time">{{ formatTime(log.timestamp) }}</div>
        <div class="log-level" :class="`level-${log.level.toLowerCase()}`">
          {{ log.level }}
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
            <el-input v-model="settings.wsUrl" placeholder="ws://localhost:20914/ws/logs" />
          </el-form-item>
          <el-form-item label="自动滚动">
            <el-switch v-model="settings.autoScroll" />
          </el-form-item>
          <el-form-item label="最大显示条数">
            <el-input-number v-model="settings.maxLogs" :min="100" :max="10000" :step="100" />
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
const selectedModules = ref<string[]>([])
const showSettings = ref(false)
const logsContainer = ref<HTMLElement>()
const expandedLogs = ref<Record<number, boolean>>({})
const dynamicModules = ref<Set<string>>(new Set())

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
  wsUrl: 'ws://localhost:20914/ws/logs',
  autoScroll: true,
  maxLogs: 1000,
})

// WebSocket实例
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let heartbeatTimer: number | null = null

// 计算属性
const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    const levelMatch = selectedLevels.value.length === 0 || selectedLevels.value.includes(log.level)
    // 如果没有选择任何模块，或者当前日志的模块已被选择，则显示
    const moduleMatch =
      selectedModules.value.length === 0 || selectedModules.value.includes(log.module)
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
        // 动态注册新模块
        if (!dynamicModules.value.has(data.module)) {
          dynamicModules.value.add(data.module)
          console.log(`新模块已注册: ${data.module}`)
        }

        const logEntry: LogEntry = {
          timestamp: data.timestamp,
          level: data.level,
          module: data.module,
          message: data.message,
        }

        logs.value.push(logEntry)

        // 限制日志数量，保留最新的日志
        if (logs.value.length > settings.value.maxLogs) {
          logs.value = logs.value.slice(-settings.value.maxLogs)
        }

        // 自动滚动到底部
        if (settings.value.autoScroll) {
          nextTick(() => {
            scrollToBottom()
          })
        }
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

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    logs.value = []
    expandedLogs.value = {}
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

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.settings-form {
  padding: 10px 0;
}
</style>
