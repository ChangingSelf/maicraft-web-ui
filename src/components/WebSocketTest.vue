<template>
  <div class="ws-test">
    <h3>WebSocket连接诊断</h3>

    <div class="test-section">
      <h4>端点状态</h4>
      <div class="endpoint-status">
        <div class="endpoint-item">
          <span class="endpoint-name">LOGS (20914):</span>
          <span
            :class="[
              'status',
              {
                connected: globalStatus.connectionStatus.LOGS,
                disconnected: !globalStatus.connectionStatus.LOGS,
              },
            ]"
          >
            {{ globalStatus.connectionStatus.LOGS ? '已连接' : '未连接' }}
          </span>
          <span class="message-count"
            >消息: {{ globalStatus.connectionDetails.LOGS.messageCount }}</span
          >
        </div>

        <div class="endpoint-item">
          <span class="endpoint-name">MCP_LOGS (20915):</span>
          <span
            :class="[
              'status',
              {
                connected: globalStatus.connectionStatus.MCP_LOGS,
                disconnected: !globalStatus.connectionStatus.MCP_LOGS,
              },
            ]"
          >
            {{ globalStatus.connectionStatus.MCP_LOGS ? '已连接' : '未连接' }}
          </span>
          <span class="message-count"
            >消息: {{ globalStatus.connectionDetails.MCP_LOGS.messageCount }}</span
          >
        </div>
      </div>
    </div>

    <div class="test-section">
      <h4>日志数据状态</h4>
      <div class="data-status">
        <div class="data-item">
          <span class="data-name">普通日志:</span>
          <span class="data-count">{{ logs.length }} 条</span>
        </div>
        <div class="data-item">
          <span class="data-name">MCP日志:</span>
          <span class="data-count">{{ mcpLogs.length }} 条</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h4>连接测试</h4>
      <el-button @click="testLogsConnection" :loading="testingLogs" type="primary">
        测试LOGS连接
      </el-button>
      <el-button @click="testMcpLogsConnection" :loading="testingMcpLogs" type="primary">
        测试MCP_LOGS连接
      </el-button>
      <el-button @click="connectAll" type="success"> 连接所有 </el-button>
      <el-button @click="disconnectAll" type="warning"> 断开所有 </el-button>
    </div>

    <div class="test-section">
      <h4>WebSocket URLs</h4>
      <div class="url-info">
        <div>LOGS URL: {{ getWsEndpointsValue().LOGS }}</div>
        <div>MCP_LOGS URL: {{ getWsEndpointsValue().MCP_LOGS }}</div>
      </div>
    </div>

    <div class="test-section">
      <h4>最新日志预览</h4>
      <div class="log-preview">
        <h5>普通日志 (最近5条)</h5>
        <div v-for="log in logs.slice(-5)" :key="log.timestamp" class="log-item">
          <span class="log-time">{{ log.formatted_timestamp }}</span>
          <span class="log-level" :class="`level-${log.level.toLowerCase()}`">{{ log.level }}</span>
          <span class="log-module">{{ log.module }}</span>
          <span class="log-message">{{ log.message.substring(0, 100) }}</span>
        </div>
        <div v-if="logs.length === 0" class="no-logs">暂无日志</div>
      </div>

      <div class="log-preview">
        <h5>MCP日志 (最近5条)</h5>
        <div v-for="log in mcpLogs.slice(-5)" :key="log.timestamp" class="log-item">
          <span class="log-time">{{ log.formatted_timestamp }}</span>
          <span class="log-level" :class="`level-${log.level.toLowerCase()}`">{{ log.level }}</span>
          <span class="log-module">{{ log.module }}</span>
          <span class="log-message">{{ log.message.substring(0, 100) }}</span>
        </div>
        <div v-if="mcpLogs.length === 0" class="no-logs">暂无日志</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useWebSocketDataStore } from '@/stores/websocketData'
import {
  getGlobalConnectionStatus,
  connectAllWebSockets,
  disconnectAllWebSockets,
  connectSingleEndpoint,
  disconnectSingleEndpoint,
} from '@/services/globalWebSocketService'
import { getWsEndpointsValue } from '@/services/websocket'

const store = useWebSocketDataStore()
const { logs, mcpLogs } = store
const globalStatus = getGlobalConnectionStatus()

const testingLogs = ref(false)
const testingMcpLogs = ref(false)

const testLogsConnection = async () => {
  testingLogs.value = true
  try {
    console.log('测试LOGS连接...')
    await connectSingleEndpoint('LOGS')
    ElMessage.success('LOGS连接测试完成')
  } catch (error) {
    console.error('LOGS连接测试失败:', error)
    ElMessage.error('LOGS连接测试失败')
  } finally {
    testingLogs.value = false
  }
}

const testMcpLogsConnection = async () => {
  testingMcpLogs.value = true
  try {
    console.log('测试MCP_LOGS连接...')
    await connectSingleEndpoint('MCP_LOGS')
    ElMessage.success('MCP_LOGS连接测试完成')
  } catch (error) {
    console.error('MCP_LOGS连接测试失败:', error)
    ElMessage.error('MCP_LOGS连接测试失败')
  } finally {
    testingMcpLogs.value = false
  }
}

const connectAll = async () => {
  try {
    await connectAllWebSockets()
    ElMessage.success('连接所有WebSocket完成')
  } catch (error) {
    console.error('连接所有WebSocket失败:', error)
    ElMessage.error('连接所有WebSocket失败')
  }
}

const disconnectAll = () => {
  disconnectAllWebSockets()
  ElMessage.success('已断开所有WebSocket连接')
}
</script>

<style scoped>
.ws-test {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.test-section {
  margin-bottom: 20px;
}

.test-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.endpoint-status,
.data-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.endpoint-item,
.data-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.endpoint-name,
.data-name {
  font-weight: 500;
  min-width: 120px;
}

.status {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
}

.status.connected {
  background: #f6ffed;
  color: #52c41a;
}

.status.disconnected {
  background: #fff2f0;
  color: #ff4d4f;
}

.message-count,
.data-count {
  font-size: 12px;
  color: #666;
}

.url-info {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.log-preview {
  margin-bottom: 15px;
}

.log-preview h5 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 3px;
  margin-bottom: 4px;
  font-size: 12px;
  font-family: monospace;
}

.log-time {
  color: #999;
  min-width: 140px;
}

.log-level {
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
}

.level-info {
  background: #e6f7ff;
  color: #1890ff;
}
.level-warning {
  background: #fffbe6;
  color: #faad14;
}
.level-error {
  background: #fff2f0;
  color: #ff4d4f;
}
.level-debug {
  background: #f0f0f0;
  color: #666;
}

.log-module {
  color: #666;
  min-width: 100px;
}

.log-message {
  flex: 1;
  color: #333;
}

.no-logs {
  color: #999;
  font-style: italic;
  padding: 10px;
  text-align: center;
}
</style>
