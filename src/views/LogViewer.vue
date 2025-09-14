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
      <div class="filter-section">
        <label class="filter-label">日志级别：</label>
        <el-checkbox-group v-model="selectedLevels" @change="updateSubscription" size="small">
          <el-checkbox
            v-for="level in availableLevels"
            :key="level"
            :label="level"
            :value="level"
          />
        </el-checkbox-group>
      </div>

      <div class="filter-section">
        <label class="filter-label">模块：</label>
        <el-checkbox-group v-model="selectedModules" @change="updateSubscription" size="small">
          <el-checkbox
            v-for="module in availableModules"
            :key="module"
            :label="module"
            :value="module"
          />
        </el-checkbox-group>
      </div>

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
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, VideoPlay, VideoPause, Refresh, Setting } from '@element-plus/icons-vue'

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
const selectedModules = ref<string[]>(['MCPClient', 'MaiAgent'])
const showSettings = ref(false)
const logsContainer = ref<HTMLElement>()
const expandedLogs = ref<Record<number, boolean>>({})

// 配置数据
const availableLevels = ['TRACE', 'DEBUG', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']
const availableModules = ['MCPClient', 'MaiAgent', 'System', 'TaskManager', 'EventHandler']

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
    const moduleMatch =
      selectedModules.value.length === 0 || selectedModules.value.includes(log.module)
    return levelMatch && moduleMatch
  })
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

  const subscription = {
    type: 'subscribe',
    levels: selectedLevels.value,
    modules: selectedModules.value,
  }

  ws.send(JSON.stringify(subscription))
}

const updateSubscription = () => {
  if (isConnected.value) {
    subscribeToLogs()
  }
}

const handleMessage = (data: WebSocketMessage) => {
  switch (data.type) {
    case 'log':
      if (data.timestamp && data.level && data.module && data.message) {
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
})

onUnmounted(() => {
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
