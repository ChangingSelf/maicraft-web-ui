<template>
  <div class="ws-debugger-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>WebSocket 调试工具</h2>
      <div class="header-actions">
        <el-button
          type="primary"
          :icon="Connection"
          @click="connect"
          :disabled="isConnected"
          :loading="connecting"
        >
          连接
        </el-button>
        <el-button type="danger" :icon="Delete" @click="disconnect" :disabled="!isConnected">
          断开
        </el-button>
        <el-button type="info" :icon="Delete" @click="clearMessages"> 清空消息 </el-button>
      </div>
    </div>

    <!-- 连接配置面板 -->
    <div class="config-panel">
      <el-card class="config-card" shadow="never">
        <div class="config-row">
          <div class="config-item">
            <label>WebSocket 端点:</label>
            <el-select
              v-model="selectedEndpoint"
              placeholder="选择端点"
              @change="onEndpointChange"
              :disabled="isConnected"
              style="width: 300px"
            >
              <el-option
                v-for="endpoint in availableEndpoints"
                :key="endpoint.key"
                :label="endpoint.label"
                :value="endpoint.key"
              />
            </el-select>
          </div>
          <div class="config-item">
            <label>自定义URL:</label>
            <el-input
              v-model="customUrl"
              placeholder="ws://localhost:20914/ws/..."
              :disabled="isConnected"
              style="width: 250px"
            />
          </div>
          <div class="config-item">
            <label>心跳间隔:</label>
            <el-select v-model="heartbeatInterval" :disabled="isConnected" style="width: 100px">
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

        <!-- 连接信息 -->
        <div class="connection-info" v-if="isConnected">
          <el-descriptions :column="3" size="small">
            <el-descriptions-item label="连接URL">
              {{ wsUrl }}
            </el-descriptions-item>
            <el-descriptions-item label="连接时间">
              {{ formatTime(connectionTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="消息计数">
              {{ messageCount }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </div>

    <!-- 消息面板 -->
    <div class="messages-panel">
      <el-row :gutter="20">
        <!-- 消息历史 -->
        <el-col :span="16">
          <el-card class="messages-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>消息历史</span>
                <div class="message-controls">
                  <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
                  <el-switch
                    v-model="formatJson"
                    active-text="格式化JSON"
                    inactive-text="原始格式"
                    size="small"
                  />
                </div>
              </div>
            </template>

            <div class="messages-container" ref="messagesContainer">
              <div
                v-for="(message, index) in messages"
                :key="index"
                class="message-item"
                :class="message.direction"
              >
                <div class="message-header">
                  <el-tag size="small" :type="getMessageType(message)">
                    {{ message.direction === 'incoming' ? '接收' : '发送' }}
                  </el-tag>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                  <span class="message-type">{{ message.type || 'unknown' }}</span>
                </div>
                <div class="message-content">
                  <pre v-if="formatJson && isJsonString(message.data)">{{
                    formatJsonString(message.data)
                  }}</pre>
                  <pre v-else>{{ message.data }}</pre>
                </div>
              </div>

              <div v-if="messages.length === 0" class="no-messages">
                <el-empty description="暂无消息">
                  <el-button type="primary" @click="connect" :disabled="isConnected">
                    开始连接
                  </el-button>
                </el-empty>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 消息发送 -->
        <el-col :span="8">
          <el-card class="send-card" shadow="never">
            <template #header>
              <span>发送消息</span>
            </template>

            <!-- 预设消息 -->
            <div class="preset-messages">
              <div class="preset-group">
                <h4>通用消息</h4>
                <el-button-group>
                  <el-button size="small" @click="sendPresetMessage('ping')">ping</el-button>
                  <el-button size="small" @click="sendPresetMessage('subscribe')">订阅</el-button>
                  <el-button size="small" @click="sendPresetMessage('unsubscribe')"
                    >取消订阅</el-button
                  >
                </el-button-group>
              </div>

              <div class="preset-group" v-if="selectedEndpoint === 'TOKEN_USAGE'">
                <h4>Token监控专用</h4>
                <el-button-group>
                  <el-button size="small" @click="sendTokenUsagePreset('subscribe')"
                    >订阅Token</el-button
                  >
                  <el-button size="small" @click="sendTokenUsagePreset('get_usage')"
                    >获取使用量</el-button
                  >
                </el-button-group>
              </div>
            </div>

            <!-- 自定义消息 -->
            <div class="custom-message">
              <el-input
                v-model="customMessage"
                type="textarea"
                :rows="6"
                placeholder="输入要发送的JSON消息..."
                :disabled="!isConnected"
              />
              <el-button
                type="primary"
                @click="sendCustomMessage"
                :disabled="!isConnected || !customMessage.trim()"
                style="width: 100%; margin-top: 10px"
              >
                发送消息
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { Connection, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { createWebSocketManager } from '@/services/websocket'

// WebSocket端点配置
const availableEndpoints = [
  { key: 'TOKEN_USAGE', label: 'Token使用量监控', url: 'ws://localhost:20914/ws/token-usage' },
  { key: 'LOGS', label: '日志监控', url: 'ws://localhost:20914/ws/logs' },
  { key: 'PLAYER', label: '玩家状态', url: 'ws://localhost:20914/ws/game/player' },
  { key: 'WORLD', label: '世界状态', url: 'ws://localhost:20914/ws/game/world' },
  { key: 'TASK_MANAGER', label: '任务管理器', url: 'ws://localhost:20914/ws/task-manager' },
]

// 状态管理
const isConnected = ref(false)
const connecting = ref(false)
const wsManager = ref<any>(null)
const messages = ref<any[]>([])
const messageCount = ref(0)
const connectionTime = ref<number | null>(null)
const autoScroll = ref(true)
const formatJson = ref(true)

// 配置
const selectedEndpoint = ref('TOKEN_USAGE')
const customUrl = ref('')
const customMessage = ref('')
const heartbeatInterval = ref(10) // 10秒 - 匹配服务器清理间隔
const messagesContainer = ref<HTMLElement>()

// 计算属性
const wsUrl = computed(() => {
  if (customUrl.value.trim()) {
    return customUrl.value.trim()
  }
  const endpoint = availableEndpoints.find((e) => e.key === selectedEndpoint.value)
  return endpoint ? endpoint.url : ''
})

const connectionStatus = computed(() => {
  if (isConnected.value) {
    return { type: 'success', text: '已连接' }
  }
  if (connecting.value) {
    return { type: 'warning', text: '连接中...' }
  }
  return { type: 'danger', text: '未连接' }
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

// 添加消息到历史
const addMessage = (direction: 'incoming' | 'outgoing', data: any, type?: string) => {
  const message = {
    direction,
    data: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    timestamp: Date.now(),
    type: type || (typeof data === 'object' ? data.type : 'unknown'),
  }

  messages.value.push(message)
  messageCount.value++

  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
}

// 检查是否为JSON字符串
const isJsonString = (str: string) => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// 格式化JSON字符串
const formatJsonString = (str: string) => {
  try {
    const parsed = JSON.parse(str)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return str
  }
}

// 获取消息类型标签
const getMessageType = (message: any) => {
  if (message.direction === 'outgoing') {
    return 'primary'
  }
  if (message.type === 'error') {
    return 'danger'
  }
  if (message.type === 'token_usage_update') {
    return 'success'
  }
  return 'info'
}

// 连接WebSocket
const connect = () => {
  if (!wsUrl.value) {
    ElMessage.warning('请先选择或输入WebSocket URL')
    return
  }

  if (wsManager.value && wsManager.value.isConnected) {
    return
  }

  connecting.value = true

  try {
    const intervalMs = heartbeatInterval.value * 1000
    addMessage(
      'outgoing',
      { type: 'info', message: `设置心跳间隔: ${heartbeatInterval.value}秒 (${intervalMs}ms)` },
      'info',
    )

    wsManager.value = createWebSocketManager(wsUrl.value, {
      heartbeatInterval: intervalMs,
      reconnectInterval: 3000,
      maxReconnectAttempts: 3,
      enableHeartbeat: true,
      autoReconnect: true,
    })

    // 添加消息处理器
    currentMessageHandler = (message: any) => {
      // 处理心跳响应
      if (message.type === 'pong') {
        console.log('收到pong响应，连接活跃')
        // 不添加到消息历史，避免过多心跳消息
        return
      }

      // 处理服务端ping（双向心跳）
      if (message.type === 'ping') {
        console.log('收到服务端ping，自动回复pong')
        const pongMessage = {
          type: 'pong',
          timestamp: Date.now(),
        }
        wsManager.value.sendMessage(pongMessage)
        // 添加到消息历史
        addMessage('outgoing', pongMessage, 'pong')
        return
      }

      // 处理业务消息
      if (message.type === 'welcome') {
        console.log('WebSocket连接已建立:', message.message)
      } else if (message.type === 'subscribed') {
        console.log('已订阅数据:', message.message)
      }

      // 添加到消息历史
      addMessage('incoming', message, message.type)
    }
    wsManager.value.addMessageHandler(currentMessageHandler)

    // 添加连接状态处理器
    currentConnectionHandler = (connected: boolean) => {
      isConnected.value = connected
      connecting.value = false
      if (connected) {
        connectionTime.value = Date.now()
        ElMessage.success('WebSocket连接成功')
      } else {
        ElMessage.warning('WebSocket连接已断开')
      }
    }
    wsManager.value.addConnectionHandler(currentConnectionHandler)

    // 添加错误处理器
    currentErrorHandler = (error: Event) => {
      console.error('WebSocket连接错误:', error)
      ElMessage.error('WebSocket连接失败')
      connecting.value = false
    }
    wsManager.value.addErrorHandler(currentErrorHandler)

    // 连接WebSocket
    wsManager.value.connect()
  } catch (error) {
    console.error('创建WebSocket连接失败:', error)
    ElMessage.error('无法建立WebSocket连接')
    connecting.value = false
  }
}

// 断开连接
const disconnect = () => {
  if (wsManager.value) {
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
    isConnected.value = false
    connectionTime.value = null
  }
}

// 清空消息
const clearMessages = () => {
  messages.value = []
  messageCount.value = 0
}

// 发送预设消息
const sendPresetMessage = (type: string) => {
  if (!wsManager.value || !wsManager.value.isConnected) {
    ElMessage.warning('WebSocket未连接')
    return
  }

  const message: any = { type }

  switch (type) {
    case 'ping':
      message.timestamp = Date.now()
      break
    case 'subscribe':
      message.update_interval = 5000
      break
    case 'unsubscribe':
      // 不需要额外参数
      break
  }

  wsManager.value.sendMessage(message)
  addMessage('outgoing', message, type)
}

// 发送Token监控专用预设消息
const sendTokenUsagePreset = (type: string) => {
  if (!wsManager.value || !wsManager.value.isConnected) {
    ElMessage.warning('WebSocket未连接')
    return
  }

  const message: any = { type }

  switch (type) {
    case 'subscribe':
      message.update_interval = 5000
      message.model_filter = ''
      break
    case 'get_usage':
      // 不需要额外参数
      break
  }

  wsManager.value.sendMessage(message)
  addMessage('outgoing', message, type)
}

// 发送自定义消息
const sendCustomMessage = () => {
  if (!wsManager.value || !wsManager.value.isConnected) {
    ElMessage.warning('WebSocket未连接')
    return
  }

  if (!customMessage.value.trim()) {
    ElMessage.warning('请输入要发送的消息')
    return
  }

  try {
    let message: any
    if (isJsonString(customMessage.value)) {
      message = JSON.parse(customMessage.value)
    } else {
      message = customMessage.value
    }

    wsManager.value.sendMessage(message)
    addMessage('outgoing', message, typeof message === 'object' ? message.type : 'custom')
    customMessage.value = ''
  } catch (error) {
    ElMessage.error('消息格式错误，请检查JSON格式')
  }
}

// 端点变化处理
const onEndpointChange = () => {
  customUrl.value = ''
}

// 组件挂载时初始化
onMounted(() => {
  // 可以选择自动连接到默认端点
  // connect()
})

// 组件卸载时断开连接
onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.ws-debugger-page {
  padding: 20px;
  max-width: 1600px;
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

.config-panel {
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

.connection-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.messages-panel {
  margin-bottom: 24px;
}

.messages-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.message-item {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.message-item.incoming {
  background: #f0f9ff;
  border-left-color: #409eff;
}

.message-item.outgoing {
  background: #f0f9ff;
  border-left-color: #67c23a;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-type {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.message-content {
  margin: 0;
}

.message-content pre {
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.no-messages {
  padding: 40px;
}

.preset-messages {
  margin-bottom: 20px;
}

.preset-group {
  margin-bottom: 16px;
}

.preset-group h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.custom-message {
  margin-top: 16px;
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

  .messages-panel .el-col {
    margin-bottom: 16px;
  }

  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
