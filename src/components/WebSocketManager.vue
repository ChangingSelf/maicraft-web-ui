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

// WebSocket实例
let ws: WebSocket | null = null
let heartbeatTimer: number | null = null
let reconnectTimer: number | null = null

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
  if (ws && ws.readyState === WebSocket.OPEN) {
    return
  }

  try {
    ws = new WebSocket(finalConfig.url)

    ws.onopen = () => {
      isConnected.value = true
      reconnectAttempts.value = 0
      ElMessage.success('WebSocket连接成功')
      emit('statusChange', true)
      startHeartbeat()
    }

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        emit('message', data)
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    }

    ws.onclose = () => {
      isConnected.value = false
      ElMessage.warning('WebSocket连接断开')
      emit('statusChange', false)
      stopHeartbeat()
    }

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
      emit('error', error)
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

const sendMessage = (message: any) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ElMessage.warning('WebSocket未连接，无法发送消息')
    return false
  }

  try {
    ws.send(JSON.stringify(message))
    return true
  } catch (error) {
    console.error('发送WebSocket消息失败:', error)
    ElMessage.error('发送消息失败')
    return false
  }
}

const startHeartbeat = () => {
  heartbeatTimer = window.setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'ping',
        timestamp: Date.now(),
      })
    }
  }, finalConfig.heartbeatInterval)
}

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

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
