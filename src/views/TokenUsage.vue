<template>
  <div class="token-usage-page">
    <PageHeader title="Token 使用量监控">
      <template #actions>
        <el-button type="primary" :icon="Refresh" @click="refreshUsage" :loading="loading">
          刷新数据
        </el-button>
        <ConnectionStatus
          :is-connected="isConnected"
          :connecting="connecting"
          :disconnecting="disconnecting"
          connect-text="开始监控"
          disconnect-text="停止监控"
          @connect="startMonitoring"
          @disconnect="stopMonitoring"
        />
      </template>
    </PageHeader>

    <!-- 监控控制面板 -->
    <div class="control-panel">
      <el-card class="control-card" shadow="never">
        <div class="control-row">
          <div class="control-item">
            <label>更新间隔 (毫秒):</label>
            <el-input-number
              v-model="updateInterval"
              :min="0"
              :max="30000"
              :step="500"
              @change="updateMonitoring"
              :disabled="!isConnected"
              style="width: 120px"
            />
          </div>
          <div class="control-item">
            <label>模型过滤:</label>
            <el-input
              v-model="modelFilter"
              placeholder="输入模型名称关键词"
              @input="updateMonitoring"
              :disabled="!isConnected"
              style="width: 200px"
            />
          </div>
          <div class="control-item">
            <el-tag :type="connectionStatus.type" size="large">
              {{ connectionStatus.text }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 汇总统计 -->
    <div class="summary-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Coin /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ summary.total_cost?.toFixed(4) || '0.0000' }}</div>
                <div class="stat-label">总费用</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.total_prompt_tokens?.toLocaleString() || 0 }}
                </div>
                <div class="stat-label">输入Tokens</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.total_completion_tokens?.toLocaleString() || 0 }}
                </div>
                <div class="stat-label">输出Tokens</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ summary.model_count || 0 }}</div>
                <div class="stat-label">模型数量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 模型使用详情 -->
    <div class="models-section">
      <el-card class="models-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>模型使用详情</span>
            <el-button type="text" @click="toggleExpandAll">
              {{ allExpanded ? '全部折叠' : '全部展开' }}
            </el-button>
          </div>
        </template>

        <div class="models-list">
          <el-collapse v-model="activeModels" @change="handleCollapseChange">
            <el-collapse-item
              v-for="model in modelUsages"
              :key="model.model_name"
              :name="model.model_name"
              class="model-item"
            >
              <template #title>
                <div class="model-header">
                  <div class="model-name">{{ model.model_name }}</div>
                  <div class="model-stats">
                    <el-tag size="small" type="info"
                      >费用: ¥{{ model.usage.total_cost?.toFixed(4) }}</el-tag
                    >
                    <el-tag size="small" type="success">调用: {{ model.usage.total_calls }}</el-tag>
                    <el-tag size="small" type="warning">
                      Tokens: {{ model.usage.total_tokens?.toLocaleString() }}
                    </el-tag>
                  </div>
                </div>
              </template>

              <div class="model-details">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="detail-section">
                      <h4>Token 统计</h4>
                      <div class="stats-grid">
                        <div class="stat-item">
                          <span class="stat-label">输入 Tokens:</span>
                          <span class="stat-value">{{
                            model.usage.total_prompt_tokens?.toLocaleString()
                          }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">输出 Tokens:</span>
                          <span class="stat-value">{{
                            model.usage.total_completion_tokens?.toLocaleString()
                          }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">总 Tokens:</span>
                          <span class="stat-value">{{
                            model.usage.total_tokens?.toLocaleString()
                          }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">总费用:</span>
                          <span class="stat-value">¥{{ model.usage.total_cost?.toFixed(4) }}</span>
                        </div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="detail-section">
                      <h4>调用统计</h4>
                      <div class="stats-grid">
                        <div class="stat-item">
                          <span class="stat-label">总调用次数:</span>
                          <span class="stat-value">{{ model.usage.total_calls }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">首次调用:</span>
                          <span class="stat-value">{{
                            formatTime(model.usage.first_call_time)
                          }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">最后调用:</span>
                          <span class="stat-value">{{
                            formatTime(model.usage.last_call_time)
                          }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">最后更新:</span>
                          <span class="stat-value">{{ formatTime(model.usage.last_updated) }}</span>
                        </div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <div v-if="modelUsages.length === 0" class="no-data">
          <el-empty description="暂无使用数据">
            <el-button type="primary" @click="refreshUsage">刷新数据</el-button>
          </el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Refresh, Coin, Document, ChatDotRound, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { PageHeader, ConnectionStatus } from '@/components/common'
import { createWebSocketManager, getWebSocketManager } from '@/services/websocket'
import { useWebSocketDataStore } from '@/stores/websocketData'
import {
  getGlobalConnectionStatus,
  connectSingleEndpoint,
  disconnectSingleEndpoint,
} from '@/services/globalWebSocketService'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'TokenUsage',
})

// WebSocket连接状态
// 使用全局WebSocket数据存储
const store = useWebSocketDataStore()
const { tokenUsage: globalTokenUsage } = store
const globalConnectionStatus = getGlobalConnectionStatus()

const isConnected = computed(() => globalConnectionStatus.connectionStatus.TOKEN_USAGE || false)
const loading = ref(false)
const connecting = ref(false)
const disconnecting = ref(false)
const wsManager = ref<any>(null)

// 处理器引用（用于清理）
let currentMessageHandler: ((message: any) => void) | null = null
let currentConnectionHandler: ((connected: boolean) => void) | null = null
let currentErrorHandler: ((error: Event) => void) | null = null

// 监控参数
const updateInterval = ref(5000) // 默认5秒更新
const modelFilter = ref('') // 模型过滤器

// 使用全局状态中的Token使用量数据
const summary = computed(() => globalTokenUsage)

// 从全局状态获取模型使用详情
const modelUsages = computed(() => {
  const models = globalTokenUsage.models || {}
  return Object.values(models).map((modelData: any) => ({
    model_name: modelData.model_name,
    usage: modelData,
  }))
})

// UI 状态
const activeModels = ref<string[]>([])
const allExpanded = ref(false)

// 连接状态
const connectionStatus = computed(() => {
  if (isConnected.value) {
    return { type: 'success', text: '已连接' }
  }
  return { type: 'danger', text: '未连接' }
})

// 格式化时间
const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 建立WebSocket连接
const connectWebSocket = () => {
  if (wsManager.value && wsManager.value.isConnected) {
    return
  }

  try {
    const wsUrl = `ws://localhost:20914/ws/token-usage`
    wsManager.value = createWebSocketManager(wsUrl, {
      heartbeatInterval: 10000, // 10秒 - 匹配服务器清理间隔
      reconnectInterval: 3000,
      maxReconnectAttempts: 3,
      enableHeartbeat: true,
      autoReconnect: true,
    })

    // 添加消息处理器
    currentMessageHandler = (message: any) => {
      handleWebSocketMessage(message)
    }
    wsManager.value.addMessageHandler(currentMessageHandler)

    // 连接状态现在由全局管理器处理
    currentConnectionHandler = (connected: boolean) => {
      if (connected) {
        console.log('Token监控连接成功')
        // 发送订阅消息
        sendSubscribeMessage()
      } else {
        console.log('Token监控连接已断开')
      }
    }
    wsManager.value.addConnectionHandler(currentConnectionHandler)

    // 添加错误处理器
    currentErrorHandler = (error: Event) => {
      console.error('WebSocket连接错误:', error)
      ElMessage.error('Token监控连接失败')
    }
    wsManager.value.addErrorHandler(currentErrorHandler)

    // 连接WebSocket
    wsManager.value.connect()
  } catch (error) {
    console.error('创建WebSocket连接失败:', error)
    ElMessage.error('无法建立Token监控连接')
  }
}

// 断开WebSocket连接
const disconnectWebSocket = () => {
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
    // 连接状态现在由全局管理器处理
  }
}

// 发送订阅消息
const sendSubscribeMessage = () => {
  if (!wsManager.value || !wsManager.value.isConnected) {
    return
  }

  const subscribeData = {
    type: 'subscribe',
    update_interval: updateInterval.value,
    model_filter: modelFilter.value || undefined,
  }

  wsManager.value.sendMessage(subscribeData)
}

// 获取当前使用量
const getCurrentUsage = () => {
  if (!wsManager.value || !wsManager.value.isConnected) {
    return
  }

  const requestData = {
    type: 'get_usage',
  }

  wsManager.value.sendMessage(requestData)
}

// 处理WebSocket消息
const handleWebSocketMessage = (data: any) => {
  // 处理心跳响应
  if (data.type === 'pong') {
    console.log('Token监控：收到pong响应，连接活跃')
    return
  }

  // 处理服务端ping（双向心跳）
  if (data.type === 'ping') {
    console.log('Token监控：收到服务端ping，自动回复pong')
    return
  }

  // 处理业务消息（数据更新现在通过全局状态管理）
  if (data.type === 'token_usage_update') {
    console.log('Token监控：收到使用量更新')
  } else if (data.type === 'error') {
    ElMessage.error(`监控错误: ${data.message}`)
  } else if (data.type === 'welcome') {
    console.log('Token监控：连接已建立')
  } else if (data.type === 'subscribed') {
    console.log('Token监控：已订阅数据更新')
  }
}

// 数据更新现在通过全局状态管理，不需要本地处理函数

// 开始监控（使用全局连接管理）
const startMonitoring = async () => {
  try {
    connecting.value = true
    await connectSingleEndpoint('TOKEN_USAGE')

    // 连接成功后，发送获取当前使用量的消息
    setTimeout(() => {
      const manager = getWebSocketManager('TOKEN_USAGE')
      if (manager && manager.isConnected) {
        manager.sendMessage({ type: 'get_usage' })
      }
    }, 1000) // 延迟1秒确保连接稳定
  } catch (error) {
    console.error('Token监控连接失败:', error)
  } finally {
    connecting.value = false
  }
}

// 停止监控（使用全局连接管理）
const stopMonitoring = () => {
  try {
    disconnecting.value = true
    disconnectSingleEndpoint('TOKEN_USAGE')
  } catch (error) {
    console.error('Token监控断开失败:', error)
  } finally {
    disconnecting.value = false
  }
}

// 更新监控参数
const updateMonitoring = () => {
  if (isConnected.value) {
    sendSubscribeMessage()
  }
}

// 刷新数据
const refreshUsage = async () => {
  try {
    loading.value = true
    if (isConnected.value) {
      getCurrentUsage()
    } else {
      // 如果未连接，先连接然后获取数据
      connectWebSocket()
      // 等待连接建立后获取数据
      setTimeout(() => {
        if (isConnected.value) {
          getCurrentUsage()
        }
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('刷新数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 切换全部展开/折叠
const toggleExpandAll = () => {
  if (allExpanded.value) {
    activeModels.value = []
  } else {
    activeModels.value = modelUsages.value.map((m) => m.model_name)
  }
  allExpanded.value = !allExpanded.value
}

// 处理折叠面板变化
const handleCollapseChange = (activeNames: string[]) => {
  allExpanded.value = activeNames.length === modelUsages.value.length
}

// 组件挂载时初始化
onMounted(() => {
  // 可以选择自动连接，或者等待用户手动开始监控
  // connectWebSocket()
})

// 组件卸载时断开连接
onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
@import '@/styles/common.css';

.token-usage-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面头部样式已移至通用样式文件 */

/* 头部和控制面板样式已移至通用样式文件 */

/* 控制项样式已移至通用样式文件 */

.control-item label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.summary-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
  color: #409eff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.models-section {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.models-list {
  max-height: 600px;
  overflow-y: auto;
}

.model-item {
  margin-bottom: 8px;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.model-name {
  font-weight: 600;
  color: #333;
}

.model-stats {
  display: flex;
  gap: 8px;
}

.model-details {
  padding: 16px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

.no-data {
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

  .control-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .summary-section .el-col {
    margin-bottom: 16px;
  }

  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .model-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .model-stats {
    width: 100%;
    justify-content: flex-end;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
