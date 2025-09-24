<template>
  <div class="websocket-monitor">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>WebSocket 连接监控</h2>
      <div class="header-actions">
        <el-button
          :type="allConnected ? 'danger' : 'primary'"
          :loading="isConnecting"
          @click="handleGlobalToggle"
        >
          {{ allConnected ? '断开全部' : '连接全部' }}
        </el-button>
        <el-button @click="refreshStatus" :icon="RefreshRight"> 刷新状态 </el-button>
      </div>
    </div>

    <!-- 全局状态概览 -->
    <el-card class="overview-card" shadow="never">
      <template #header>
        <span>连接概览</span>
      </template>
      <div class="overview-content">
        <div class="status-item">
          <div class="status-label">总连接数</div>
          <div class="status-value">{{ connectionCount }}/{{ totalEndpoints }}</div>
        </div>
        <div class="status-item">
          <div class="status-label">连接率</div>
          <div class="status-value">{{ connectionRate }}%</div>
        </div>
        <div class="status-item">
          <div class="status-label">总消息数</div>
          <div class="status-value">{{ totalMessages }}</div>
        </div>
        <div class="status-item">
          <div class="status-label">总错误数</div>
          <div class="status-value error-count">{{ totalErrors }}</div>
        </div>
      </div>
    </el-card>

    <!-- 连接详情列表 -->
    <el-card class="connections-card" shadow="never">
      <template #header>
        <span>连接详情</span>
      </template>

      <el-table :data="connectionList" stripe style="width: 100%">
        <el-table-column prop="endpoint" label="端点" width="120">
          <template #default="{ row }">
            <el-tag :type="getEndpointTagType(row.endpoint)">
              {{ row.endpoint }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.connected ? 'success' : 'danger'">
              <el-icon><CircleCheck v-if="row.connected" /><CircleClose v-else /></el-icon>
              {{ row.connected ? '已连接' : '未连接' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="lastConnected" label="最后连接时间" width="180">
          <template #default="{ row }">
            <span v-if="row.lastConnected" class="time-text">
              {{ formatTime(row.lastConnected) }}
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="lastDisconnected" label="最后断开时间" width="180">
          <template #default="{ row }">
            <span v-if="row.lastDisconnected" class="time-text">
              {{ formatTime(row.lastDisconnected) }}
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="messageCount" label="消息数" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ messageCount[row.endpoint as WSEndpointType] || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="errorCount" label="错误数" width="100">
          <template #default="{ row }">
            <el-tag :type="row.errorCount > 0 ? 'danger' : 'success'">
              {{ row.errorCount }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最后错误" width="200">
          <template #default="{ row }">
            <el-tooltip v-if="row.lastError" :content="row.lastError" placement="top">
              <span class="error-text">{{ truncateError(row.lastError) }}</span>
            </el-tooltip>
            <span v-else class="no-data">无错误</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="!row.connected"
                type="primary"
                size="small"
                @click="connectEndpoint(row.endpoint)"
              >
                连接
              </el-button>
              <el-button
                v-else
                type="danger"
                size="small"
                @click="disconnectEndpoint(row.endpoint)"
              >
                断开
              </el-button>
              <el-button
                v-if="row.connected"
                type="success"
                size="small"
                @click="subscribeEndpoint(row.endpoint)"
              >
                订阅
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 数据预览 -->
    <el-card class="data-preview-card" shadow="never">
      <template #header>
        <span>数据预览</span>
      </template>

      <div class="data-preview-grid">
        <div class="data-item">
          <h4>玩家数据</h4>
          <div class="data-content">
            <p><strong>姓名:</strong> {{ dataStore.player.name || '未知' }}</p>
            <p>
              <strong>生命值:</strong> {{ dataStore.player.health }}/{{
                dataStore.player.max_health
              }}
            </p>
            <p>
              <strong>位置:</strong> ({{ dataStore.player.position.x.toFixed(1) }},
              {{ dataStore.player.position.y.toFixed(1) }},
              {{ dataStore.player.position.z.toFixed(1) }})
            </p>
            <p><strong>最后更新:</strong> {{ formatTime(lastUpdated.PLAYER || 0) }}</p>
          </div>
        </div>

        <div class="data-item">
          <h4>世界数据</h4>
          <div class="data-content">
            <p><strong>时间:</strong> {{ dataStore.world.time.formatted_time || '未知' }}</p>
            <p><strong>天气:</strong> {{ dataStore.world.weather.formatted_weather || '未知' }}</p>
            <p><strong>维度:</strong> {{ dataStore.world.location.dimension || '未知' }}</p>
            <p><strong>最后更新:</strong> {{ formatTime(lastUpdated.WORLD || 0) }}</p>
          </div>
        </div>

        <div class="data-item">
          <h4>日志数据</h4>
          <div class="data-content">
            <p><strong>日志条数:</strong> {{ dataStore.logs.length }}</p>
            <p>
              <strong>最新日志:</strong>
              {{ dataStore.logs[0]?.message?.substring(0, 50) || '无' }}...
            </p>
            <p><strong>最后更新:</strong> {{ formatTime(lastUpdated.LOGS || 0) }}</p>
          </div>
        </div>

        <div class="data-item">
          <h4>事件数据</h4>
          <div class="data-content">
            <p><strong>事件条数:</strong> {{ dataStore.events.length }}</p>
            <p><strong>最新事件:</strong> {{ dataStore.events[0]?.type || '无' }}</p>
            <p><strong>最后更新:</strong> {{ formatTime(lastUpdated.EVENTS || 0) }}</p>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 实时日志 -->
    <el-card class="logs-card" shadow="never">
      <template #header>
        <div class="logs-header">
          <span>实时连接日志</span>
          <el-button size="small" @click="clearLogs">清空日志</el-button>
        </div>
      </template>

      <div class="logs-container">
        <div
          v-for="(log, index) in connectionLogs"
          :key="index"
          class="log-entry"
          :class="log.type"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-endpoint">[{{ log.endpoint }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="connectionLogs.length === 0" class="no-logs">暂无日志记录</div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose, RefreshRight } from '@element-plus/icons-vue'
import {
  getGlobalConnectionStatus,
  connectAllWebSockets,
  disconnectAllWebSockets,
  connectSingleEndpoint,
  disconnectSingleEndpoint,
  subscribeSingleEndpoint,
  getAllEndpoints,
  syncConnectionStatus,
  type GlobalConnectionStatus,
} from '../services/globalWebSocketService'
import { type WSEndpointType } from '../services/websocket'
import { useWebSocketData, getWebSocketDataStore } from '../stores/websocketData'

// 连接日志类型
interface ConnectionLog {
  timestamp: number
  endpoint: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
}

// 响应式数据
const globalStatus = getGlobalConnectionStatus()
const connectionLogs = ref<ConnectionLog[]>([])
const refreshTimer = ref<number | null>(null)

// 使用全局数据存储
const { messageCount, lastUpdated } = useWebSocketData()
const dataStore = getWebSocketDataStore()

// 计算属性
const isConnecting = computed(() => globalStatus.isConnecting)
const allConnected = computed(() => globalStatus.allConnected)
const connectionCount = computed(() => globalStatus.connectionCount)
const totalEndpoints = computed(() => globalStatus.totalEndpoints)

const connectionRate = computed(() => {
  if (totalEndpoints.value === 0) return 0
  return Math.round((connectionCount.value / totalEndpoints.value) * 100)
})

const totalMessages = computed(() => {
  return Object.values(globalStatus.connectionDetails).reduce(
    (sum, detail) => sum + detail.messageCount,
    0,
  )
})

const totalErrors = computed(() => {
  return Object.values(globalStatus.connectionDetails).reduce(
    (sum, detail) => sum + detail.errorCount,
    0,
  )
})

const connectionList = computed(() => {
  return getAllEndpoints().map((endpoint) => {
    const detail = globalStatus.connectionDetails[endpoint]
    return {
      endpoint,
      connected: globalStatus.connectionStatus[endpoint] || false,
      lastConnected: detail?.lastConnected,
      lastDisconnected: detail?.lastDisconnected,
      messageCount: detail?.messageCount || 0,
      errorCount: detail?.errorCount || 0,
      lastError: detail?.lastError,
    }
  })
})

// 方法
const handleGlobalToggle = async () => {
  try {
    if (allConnected.value) {
      disconnectAllWebSockets()
      addLog('GLOBAL', 'info', '开始断开所有连接')
    } else {
      await connectAllWebSockets()
      addLog('GLOBAL', 'info', '开始连接所有端点')
    }
  } catch (error) {
    console.error('全局连接操作失败:', error)
    ElMessage.error('操作失败')
    addLog('GLOBAL', 'error', `操作失败: ${error}`)
  }
}

const connectEndpoint = async (endpoint: WSEndpointType) => {
  try {
    addLog(endpoint, 'info', '开始连接')
    await connectSingleEndpoint(endpoint)
    addLog(endpoint, 'success', '连接成功')
  } catch (error) {
    addLog(endpoint, 'error', `连接失败: ${error}`)
  }
}

const disconnectEndpoint = (endpoint: WSEndpointType) => {
  try {
    addLog(endpoint, 'info', '开始断开连接')
    disconnectSingleEndpoint(endpoint)
    addLog(endpoint, 'warning', '连接已断开')
  } catch (error) {
    addLog(endpoint, 'error', `断开失败: ${error}`)
  }
}

const subscribeEndpoint = (endpoint: WSEndpointType) => {
  try {
    addLog(endpoint, 'info', '发送订阅消息')
    const success = subscribeSingleEndpoint(endpoint)
    if (success) {
      addLog(endpoint, 'success', '订阅消息发送成功')
      ElMessage.success(`${endpoint} 订阅成功`)
    } else {
      addLog(endpoint, 'warning', '订阅消息发送失败')
      ElMessage.warning(`${endpoint} 订阅失败`)
    }
  } catch (error) {
    addLog(endpoint, 'error', `订阅失败: ${error}`)
    ElMessage.error(`${endpoint} 订阅失败`)
  }
}

const refreshStatus = () => {
  ElMessage.success('状态已刷新')
  addLog('SYSTEM', 'info', '手动刷新状态')
}

const clearLogs = () => {
  connectionLogs.value = []
  ElMessage.success('日志已清空')
}

const addLog = (endpoint: string, type: ConnectionLog['type'], message: string) => {
  connectionLogs.value.unshift({
    timestamp: Date.now(),
    endpoint,
    type,
    message,
  })

  // 限制日志数量
  if (connectionLogs.value.length > 100) {
    connectionLogs.value = connectionLogs.value.slice(0, 100)
  }
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const truncateError = (error: string): string => {
  return error.length > 30 ? error.substring(0, 30) + '...' : error
}

const getEndpointTagType = (endpoint: string): string => {
  const typeMap: Record<string, string> = {
    PLAYER: 'success',
    WORLD: 'primary',
    LOGS: 'warning',
    EVENTS: 'info',
    TOKEN_USAGE: 'danger',
  }
  return typeMap[endpoint] || 'default'
}

// 生命周期
onMounted(() => {
  addLog('SYSTEM', 'info', 'WebSocket监控页面已加载')

  // 定期刷新状态和同步连接状态
  refreshTimer.value = window.setInterval(() => {
    // 同步连接状态，确保显示准确
    syncConnectionStatus()
    console.log('[WebSocketMonitor] 状态同步完成，当前连接数:', connectionCount.value)
  }, 3000) // 每3秒检查一次状态
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.websocket-monitor {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.overview-card {
  margin-bottom: 20px;
}

.overview-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.status-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.status-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.status-value.error-count {
  color: #f56c6c;
}

.connections-card {
  margin-bottom: 20px;
}

.data-preview-card {
  margin-bottom: 20px;
}

.data-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.data-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.data-item h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.data-content p {
  margin: 6px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.data-content strong {
  color: #333;
}

.time-text {
  font-size: 12px;
  color: #666;
}

.no-data {
  color: #999;
  font-style: italic;
}

.error-text {
  color: #f56c6c;
  font-size: 12px;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.logs-card {
  margin-bottom: 20px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 12px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.info {
  color: #409eff;
}

.log-entry.success {
  color: #67c23a;
}

.log-entry.warning {
  color: #e6a23c;
}

.log-entry.error {
  color: #f56c6c;
}

.log-time {
  color: #999;
  min-width: 120px;
}

.log-endpoint {
  color: #666;
  font-weight: bold;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.no-logs {
  text-align: center;
  color: #999;
  padding: 40px;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .overview-content {
    grid-template-columns: 1fr;
  }

  .log-entry {
    flex-direction: column;
    gap: 4px;
  }

  .log-time,
  .log-endpoint {
    min-width: auto;
  }
}
</style>
