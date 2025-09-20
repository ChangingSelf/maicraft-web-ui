<template>
  <div class="websocket-manager">
    <!-- 连接状态指示器 -->
    <div class="connection-status" :class="{ connected: isConnected, disconnected: !isConnected }">
      <el-icon v-if="isConnected" class="status-icon"><CircleCheck /></el-icon>
      <el-icon v-else class="status-icon"><CircleClose /></el-icon>
      <span class="status-text">
        {{ isConnected ? '已连接' : '未连接' }}
      </span>
      <el-button v-if="!isConnected" type="primary" size="small" @click="$emit('connect')">
        连接
      </el-button>
      <el-button v-else type="danger" size="small" @click="$emit('disconnect')"> 断开 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { createWebSocketManager } from '@/services/websocket'

// 类型定义
interface WebSocketConfig {
  url: string
  heartbeatInterval?: number
  reconnectInterval?: number
  maxReconnectAttempts?: number
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
  [key: string]: any
}

// Props
const props = defineProps<{
  config: WebSocketConfig
}>()

// Emits
const emit = defineEmits<{
  connect: []
  disconnect: []
  message: [message: WebSocketMessage]
  error: [error: Event]
  statusChange: [connected: boolean]
}>()

// 响应式数据
const isConnected = ref(false)
const reconnectAttempts = ref(0)

// WebSocket管理器实例
let wsManager: any = null

// 默认配置
const defaultConfig: Required<WebSocketConfig> = {
  url: 'ws://localhost:20914/ws',
  heartbeatInterval: 30000, // 30秒
  reconnectInterval: 5000, // 5秒
  maxReconnectAttempts: 5,
}

const finalConfig = { ...defaultConfig, ...props.config }

// WebSocket管理方法
const connect = () => {
  if (wsManager && wsManager.isConnected) {
    return
  }

  try {
    // 创建WebSocket管理器
    wsManager = createWebSocketManager(finalConfig.url, {
      heartbeatInterval: finalConfig.heartbeatInterval,
      reconnectInterval: finalConfig.reconnectInterval,
      maxReconnectAttempts: finalConfig.maxReconnectAttempts,
    })

    // 添加消息处理器
    const messageHandler = (message: WebSocketMessage) => {
      emit('message', message)
    }
    wsManager.addMessageHandler(messageHandler)

    // 添加连接状态处理器
    const connectionHandler = (connected: boolean) => {
      isConnected.value = connected
      if (connected) {
        reconnectAttempts.value = 0
        ElMessage.success('WebSocket连接成功')
      } else {
        ElMessage.warning('WebSocket连接断开')
      }
      emit('statusChange', connected)
    }
    wsManager.addConnectionHandler(connectionHandler)

    // 添加错误处理器
    const errorHandler = (error: Event) => {
      console.error('WebSocket错误:', error)
      emit('error', error)
    }
    wsManager.addErrorHandler(errorHandler)

    // 连接WebSocket
    wsManager.connect()

    // 保存处理器引用以便后续清理
    wsManager._messageHandler = messageHandler
    wsManager._connectionHandler = connectionHandler
    wsManager._errorHandler = errorHandler
  } catch (error) {
    console.error('创建WebSocket连接失败:', error)
    ElMessage.error('创建WebSocket连接失败')
  }
}

const disconnect = () => {
  if (wsManager) {
    // 清理处理器
    if (wsManager._messageHandler) {
      wsManager.removeMessageHandler(wsManager._messageHandler)
    }
    if (wsManager._connectionHandler) {
      wsManager.removeConnectionHandler(wsManager._connectionHandler)
    }
    if (wsManager._errorHandler) {
      wsManager.removeErrorHandler(wsManager._errorHandler)
    }

    // 断开连接
    wsManager.disconnect()
    wsManager = null
  }
  isConnected.value = false
  ElMessage.info('WebSocket连接已断开')
}

const sendMessage = (message: any) => {
  if (!wsManager || !wsManager.isConnected) {
    ElMessage.warning('WebSocket未连接，无法发送消息')
    return false
  }

  return wsManager.sendMessage(message)
}

// 心跳包已统一到WebSocket管理器中，不需要单独实现

// 暴露方法给父组件
defineExpose({
  connect,
  disconnect,
  sendMessage,
  get isConnected() {
    return isConnected.value
  },
})

// 清理资源
onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.websocket-manager {
  display: inline-block;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.connection-status.connected {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.connection-status.disconnected {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 500;
}
</style>
