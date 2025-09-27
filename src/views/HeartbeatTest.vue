<template>
  <div class="heartbeat-test-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>心跳机制测试</h2>
      <div class="header-actions">
        <el-button
          type="primary"
          :icon="VideoPlay"
          @click="startTest"
          :disabled="isTesting"
          :loading="isTesting"
        >
          开始测试
        </el-button>
        <el-button type="danger" :icon="VideoPause" @click="stopTest" :disabled="!isTesting">
          停止测试
        </el-button>
        <el-button type="info" :icon="Delete" @click="clearLogs"> 清空日志 </el-button>
      </div>
    </div>

    <!-- 测试配置 -->
    <div class="test-config">
      <el-card class="config-card" shadow="never">
        <div class="config-row">
          <div class="config-item">
            <label>WebSocket端点:</label>
            <el-select v-model="selectedEndpoint" placeholder="选择端点" :disabled="isTesting">
              <el-option
                v-for="endpoint in availableEndpoints"
                :key="endpoint.key"
                :label="endpoint.label"
                :value="endpoint.key"
              />
            </el-select>
          </div>
          <div class="config-item">
            <label>心跳间隔:</label>
            <el-select v-model="heartbeatInterval" :disabled="isTesting" style="width: 120px">
              <el-option :value="1" label="1秒"></el-option>
              <el-option :value="2" label="2秒"></el-option>
              <el-option :value="5" label="5秒"></el-option>
              <el-option :value="10" label="10秒"></el-option>
              <el-option :value="15" label="15秒"></el-option>
              <el-option :value="30" label="30秒"></el-option>
              <el-option :value="60" label="60秒"></el-option>
            </el-select>
          </div>
          <div class="config-item">
            <el-tag :type="connectionStatus.type" size="large">
              {{ connectionStatus.text }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 测试结果 -->
    <div class="test-results">
      <el-row :gutter="20">
        <!-- 统计信息 -->
        <el-col :span="8">
          <el-card class="stats-card" shadow="never">
            <template #header>
              <span>心跳统计</span>
            </template>
            <div class="stats-content">
              <div class="stat-item">
                <span class="stat-label">收到服务端Ping:</span>
                <span class="stat-value">{{ pingCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">收到服务端Pong:</span>
                <span class="stat-value">{{ pongCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功率:</span>
                <span class="stat-value" :class="successRateClass"> {{ successRate }}% </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后Ping:</span>
                <span class="stat-value">
                  {{ lastPingTime ? formatTime(lastPingTime) : '-' }}
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后Pong:</span>
                <span class="stat-value">
                  {{ lastPongTime ? formatTime(lastPongTime) : '-' }}
                </span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 日志输出 -->
        <el-col :span="16">
          <el-card class="logs-card" shadow="never">
            <template #header>
              <span>测试日志</span>
            </template>
            <div class="logs-container" ref="logsContainer">
              <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                <span class="log-level" :class="log.level">{{ log.level }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
              <div v-if="logs.length === 0" class="no-logs">
                <el-empty description="暂无日志" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { VideoPlay, VideoPause, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { createWebSocketManager } from '@/services/websocket'

// WebSocket端点配置
const availableEndpoints = [
  { key: 'TOKEN_USAGE', label: 'Token使用量监控', url: 'ws://localhost:20914/ws/token-usage' },
  { key: 'LOGS', label: '日志监控', url: 'ws://localhost:20914/ws/logs' },
]

// 状态管理
const isTesting = ref(false)
const wsManager = ref<any>(null)
const logs = ref<any[]>([])
const logsContainer = ref<HTMLElement>()

// 测试配置
const selectedEndpoint = ref('TOKEN_USAGE')
const heartbeatInterval = ref(10) // 10秒 - 匹配服务器清理间隔

// 统计数据
const pingCount = ref(0)
const pongCount = ref(0)
const lastPingTime = ref<number | null>(null)
const lastPongTime = ref<number | null>(null)

// ping计数器
let pingSequence = 0

// 计算属性
const connectionStatus = computed(() => {
  if (!wsManager.value) return { type: 'danger', text: '未连接' }
  if (wsManager.value.isConnected) {
    return { type: 'success', text: '已连接' }
  }
  return { type: 'warning', text: '连接中...' }
})

const successRate = computed(() => {
  if (pingCount.value === 0) return 0
  return Math.round((pongCount.value / pingCount.value) * 100)
})

const successRateClass = computed(() => {
  const rate = successRate.value
  if (rate === 100) return 'success'
  if (rate >= 80) return 'warning'
  return 'error'
})

// 处理器引用（用于清理）
let currentMessageHandler: ((message: any) => void) | null = null
let currentConnectionHandler: ((connected: boolean) => void) | null = null
let currentErrorHandler: ((error: Event) => void) | null = null

// 格式化时间
const formatTime = (timestamp: number | null) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 添加日志
const addLog = (level: 'info' | 'success' | 'warning' | 'error', message: string) => {
  const log = {
    timestamp: Date.now(),
    level,
    message,
    type: level === 'error' ? 'error' : 'normal',
  }

  logs.value.push(log)

  // 自动滚动到底部
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  })
}

// 获取端点URL
const getEndpointUrl = () => {
  const endpoint = availableEndpoints.find((e) => e.key === selectedEndpoint.value)
  return endpoint ? endpoint.url : ''
}

// 开始测试
const startTest = () => {
  if (isTesting.value) return

  const url = getEndpointUrl()
  if (!url) {
    ElMessage.warning('请选择有效的WebSocket端点')
    return
  }

  isTesting.value = true
  pingCount.value = 0
  pongCount.value = 0
  lastPingTime.value = null
  lastPongTime.value = null

  addLog('info', `开始心跳测试: ${url}`)
  addLog('info', `心跳间隔: ${heartbeatInterval.value}秒`)

  try {
    const intervalMs = heartbeatInterval.value * 1000
    addLog('info', `设置心跳间隔: ${heartbeatInterval.value}秒 (${intervalMs}ms)`)

    wsManager.value = createWebSocketManager(url, {
      heartbeatInterval: intervalMs,
      reconnectInterval: 3000,
      maxReconnectAttempts: 3,
      enableHeartbeat: true,
      autoReconnect: true,
      onPing: (pingMessage) => {
        // ping发送回调
        pingSequence++
        pingCount.value++
        lastPingTime.value = Date.now()
        addLog('success', `📨 发送Ping消息 #${pingSequence}`)
      },
    })

    // 添加消息处理器
    currentMessageHandler = (message: any) => {
      const now = Date.now()

      if (message.type === 'ping') {
        // 这通常是服务端发送的ping消息（如果服务端也在做心跳）
        pingCount.value++
        lastPingTime.value = now
        addLog('warning', `收到服务端Ping (${pingCount.value}) - 双向心跳`)

        // 自动回复pong
        const pongMessage = {
          type: 'pong',
          timestamp: now,
        }
        wsManager.value.sendMessage(pongMessage)
        addLog('info', `自动回复Pong消息`)
      } else if (message.type === 'pong') {
        // 这是对客户端ping的回复
        pongCount.value++
        lastPongTime.value = now
        addLog('success', `收到服务端Pong (${pongCount.value}) - 心跳正常`)
      } else if (message.type === 'welcome') {
        addLog('info', `连接成功: ${message.message}`)
      } else if (message.type === 'subscribed') {
        addLog('info', `订阅成功: ${message.message}`)
      } else if (message.type === 'token_usage_update') {
        addLog('info', `收到Token更新数据`)
      } else {
        addLog('info', `收到消息: ${message.type}`)
      }
    }
    wsManager.value.addMessageHandler(currentMessageHandler)

    // 添加连接状态处理器
    currentConnectionHandler = (connected: boolean) => {
      if (connected) {
        addLog('success', 'WebSocket连接已建立')

        // 重置计数器
        pingSequence = 0
        pingCount.value = 0
        pongCount.value = 0

        // 发送订阅消息
        setTimeout(() => {
          if (wsManager.value && wsManager.value.isConnected) {
            const subscribeMsg = {
              type: 'subscribe',
              update_interval: 5000,
              model_filter: '',
            }
            wsManager.value.sendMessage(subscribeMsg)
            addLog('info', '发送订阅消息')
          }
        }, 1000)
      } else {
        addLog('warning', 'WebSocket连接已断开')
      }
    }
    wsManager.value.addConnectionHandler(currentConnectionHandler)

    // 添加错误处理器
    currentErrorHandler = (error: Event) => {
      addLog('error', `WebSocket错误: ${error}`)
    }
    wsManager.value.addErrorHandler(currentErrorHandler)

    // 连接WebSocket
    wsManager.value.connect()
  } catch (error) {
    addLog('error', `创建WebSocket连接失败: ${error}`)
    isTesting.value = false
  }
}

// 停止测试
const stopTest = () => {
  if (wsManager.value) {
    addLog('info', '停止心跳测试')

    // 清理处理器
    if (currentMessageHandler) {
      wsManager.value.removeMessageHandler(currentMessageHandler)
      currentMessageHandler = null
    }
    if (currentConnectionHandler) {
      wsManager.value.removeConnectionHandler(currentConnectionHandler)
      currentConnectionHandler = null
    }
    if (currentErrorHandler) {
      wsManager.value.removeErrorHandler(currentErrorHandler)
      currentErrorHandler = null
    }

    // 断开连接
    wsManager.value.disconnect()
    wsManager.value = null
  }

  isTesting.value = false
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  pingSequence = 0
}

// 组件挂载时初始化
onMounted(() => {
  addLog('info', '心跳测试页面已加载')
})

// 组件卸载时停止测试
onUnmounted(() => {
  stopTest()
})
</script>

<style scoped>
.heartbeat-test-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.test-config {
  margin-bottom: 24px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-item label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.test-results {
  margin-bottom: 24px;
}

.stats-card {
  height: 100%;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.error {
  color: #f56c6c;
}

.logs-card {
  height: 400px;
}

.logs-container {
  height: 320px;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.log-item {
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-item.info {
  background: #f0f9ff;
  border-left: 3px solid #409eff;
}

.log-item.success {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
}

.log-item.warning {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.log-item.error {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.log-time {
  color: #909399;
  margin-right: 8px;
}

.log-level {
  display: inline-block;
  width: 60px;
  text-align: center;
  font-weight: 600;
  font-size: 11px;
  border-radius: 2px;
  margin-right: 8px;
}

.log-level.info {
  background: #ecf5ff;
  color: #409eff;
}

.log-level.success {
  background: #f0f9ff;
  color: #67c23a;
}

.log-level.warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.log-level.error {
  background: #fef0f0;
  color: #f56c6c;
}

.log-message {
  color: #333;
}

.no-logs {
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .config-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .test-results .el-col {
    margin-bottom: 16px;
  }

  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
