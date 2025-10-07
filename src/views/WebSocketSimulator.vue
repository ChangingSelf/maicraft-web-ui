<template>
  <div class="websocket-simulator">
    <!-- 页面标题 -->
    <PageHeader
      title="WebSocket 模拟器"
      description="用于在没有真实服务端的情况下测试WebSocket功能和数据处理逻辑"
    >
      <template #actions>
        <div class="mode-switch-container">
          <span class="mode-label">{{ mockEnabled ? '模拟模式' : '真实模式' }}</span>
          <el-switch
            v-model="mockEnabled"
            active-text="模拟"
            inactive-text="真实"
            active-color="#67c23a"
            inactive-color="#409eff"
            @change="handleModeToggle"
          />
        </div>
        <el-button
          v-if="mockEnabled"
          :type="allConnected ? 'danger' : 'primary'"
          @click="handleGlobalToggle"
          size="default"
        >
          {{ allConnected ? '断开全部' : '连接全部' }}
        </el-button>
      </template>
    </PageHeader>

    <!-- 快速开始指南 -->
    <el-card v-if="!mockEnabled" class="quick-start-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><InfoFilled /></el-icon>
          <span>快速开始</span>
        </div>
      </template>
      <div class="quick-start-content">
        <div class="quick-start-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>启用模拟模式</h4>
              <p>点击右上角的开关切换到模拟模式</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>连接端点</h4>
              <p>使用"连接全部"按钮或单独连接特定端点</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>查看数据</h4>
              <p>在下方的数据预览区域查看实时模拟数据</p>
            </div>
          </div>
        </div>
        <div class="quick-start-action">
          <el-button type="primary" @click="handleQuickStart" size="large">
            <el-icon><VideoPlay /></el-icon>
            一键开始
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 服务状态概览 -->
    <el-card class="overview-card" shadow="never">
      <template #header>
        <span>{{ mockEnabled ? '模拟服务状态' : '连接状态' }}</span>
      </template>
      <div class="overview-content">
        <div class="status-item">
          <div class="status-label">服务状态</div>
          <div class="status-value">
            <el-tag :type="mockEnabled ? 'success' : 'info'">
              {{ mockEnabled ? '已启用' : '未启用' }}
            </el-tag>
          </div>
        </div>
        <div class="status-item">
          <div class="status-label">连接数</div>
          <div class="status-value">{{ connectedCount }}/{{ totalEndpoints }}</div>
        </div>
        <div class="status-item">
          <div class="status-label">总消息数</div>
          <div class="status-value">{{ mockState.totalMessages }}</div>
        </div>
        <div class="status-item">
          <div class="status-label">连接率</div>
          <div class="status-value">{{ connectionRate }}%</div>
        </div>
      </div>
    </el-card>

    <!-- 端点连接控制 -->
    <el-card class="connections-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>端点连接管理</span>
          <div class="header-actions">
            <el-button size="small" @click="resetStats">重置统计</el-button>
          </div>
        </div>
      </template>

      <el-table :data="endpointList" stripe style="width: 100%">
        <el-table-column prop="endpoint" label="端点" width="120">
          <template #default="{ row }">
            <el-tag :type="getEndpointTagType(row.endpoint)">
              {{ row.endpoint }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="connected" label="连接状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.connected ? 'success' : 'danger'">
              <el-icon><CircleCheck v-if="row.connected" /><CircleClose v-else /></el-icon>
              {{ row.connected ? '已连接' : '未连接' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="lastConnected" label="最后连接" width="180">
          <template #default="{ row }">
            <span v-if="row.lastConnected" class="time-text">
              {{ formatTime(row.lastConnected) }}
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="messageCount" label="消息数" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.messageCount }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="errorCount" label="错误数" width="100">
          <template #default="{ row }">
            <el-tag :type="row.errorCount > 0 ? 'danger' : 'success'">
              {{ row.errorCount }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="数据配置" width="280">
          <template #default="{ row }">
            <div class="config-controls">
              <div class="config-row">
                <el-switch
                  v-model="getConfig(row.endpoint).enabled"
                  size="small"
                  active-text="启用"
                  inactive-text="禁用"
                  @change="updateEndpointConfig(row.endpoint)"
                />
              </div>
              <div class="config-row">
                <span class="config-label">间隔:</span>
                <el-input-number
                  v-model="getConfig(row.endpoint).interval"
                  size="small"
                  :min="500"
                  :max="30000"
                  :step="500"
                  style="width: 80px"
                  @change="updateEndpointConfig(row.endpoint)"
                />
                <span class="interval-label">ms</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="!row.connected"
                type="primary"
                size="small"
                :disabled="!mockEnabled"
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
                @click="triggerPush(row.endpoint)"
              >
                推送数据
              </el-button>
              <el-button type="warning" size="small" @click="simulateError(row.endpoint)">
                模拟错误
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 数据预览 -->
    <el-card class="preview-card" shadow="never">
      <template #header>
        <span>实时数据预览</span>
      </template>
      <div class="preview-grid">
        <div class="preview-item">
          <h4>玩家数据</h4>
          <div class="preview-content">
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
            <p><strong>游戏模式:</strong> {{ dataStore.player.gamemode }}</p>
          </div>
        </div>

        <div class="preview-item">
          <h4>世界数据</h4>
          <div class="preview-content">
            <p><strong>时间:</strong> {{ dataStore.world.time.formatted_time || '未知' }}</p>
            <p><strong>天气:</strong> {{ dataStore.world.weather.formatted_weather || '未知' }}</p>
            <p><strong>维度:</strong> {{ dataStore.world.location.dimension || '未知' }}</p>
            <p><strong>生物群系:</strong> {{ dataStore.world.location.biome || '未知' }}</p>
          </div>
        </div>

        <div class="preview-item">
          <h4>日志数据</h4>
          <div class="preview-content">
            <p><strong>Minecraft日志:</strong> {{ dataStore.logs.length }} 条</p>
            <p><strong>MCP日志:</strong> {{ dataStore.mcpLogs.length }} 条</p>
            <p><strong>最新日志:</strong> {{ latestLogMessage }}</p>
          </div>
        </div>

        <div class="preview-item">
          <h4>其他数据</h4>
          <div class="preview-content">
            <p><strong>任务数:</strong> {{ dataStore.tasks.length }} 个</p>
            <p>
              <strong>Token使用:</strong> {{ dataStore.tokenUsage.current_usage }}/{{
                dataStore.tokenUsage.limit
              }}
            </p>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 批量操作 -->
    <el-card class="batch-operations-card" shadow="never">
      <template #header>
        <span>批量操作</span>
      </template>
      <div class="batch-operations">
        <el-button-group>
          <el-button @click="enableAllDataPush">启用所有数据推送</el-button>
          <el-button @click="disableAllDataPush">禁用所有数据推送</el-button>
          <el-button @click="triggerAllPush">触发所有数据推送</el-button>
        </el-button-group>
        <el-button-group style="margin-left: 16px">
          <el-button @click="setAllInterval(1000)">1秒间隔</el-button>
          <el-button @click="setAllInterval(3000)">3秒间隔</el-button>
          <el-button @click="setAllInterval(5000)">5秒间隔</el-button>
        </el-button-group>
      </div>
    </el-card>

    <!-- 使用说明 -->
    <el-card v-if="mockEnabled" class="help-card" shadow="never">
      <template #header>
        <span>功能说明</span>
      </template>
      <div class="help-content">
        <div class="help-grid">
          <div class="help-item">
            <el-icon class="help-icon"><Link /></el-icon>
            <h4>连接管理</h4>
            <p>单独控制每个端点的连接状态，支持批量连接和断开</p>
          </div>
          <div class="help-item">
            <el-icon class="help-icon"><Setting /></el-icon>
            <h4>数据配置</h4>
            <p>调整每个端点的数据推送频率(500ms-30s)和启用状态</p>
          </div>
          <div class="help-item">
            <el-icon class="help-icon"><TrendCharts /></el-icon>
            <h4>手动推送</h4>
            <p>手动触发单个或所有端点的数据推送，用于测试特定场景</p>
          </div>
          <div class="help-item">
            <el-icon class="help-icon"><Warning /></el-icon>
            <h4>错误模拟</h4>
            <p>模拟连接错误来测试应用的错误处理和恢复机制</p>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 任务操作测试 -->
    <el-card v-if="mockEnabled" class="task-operations-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon class="help-icon"><Setting /></el-icon>
          <span>任务操作测试</span>
        </div>
      </template>
      <div class="task-operations-content">
        <div class="operations-grid">
          <el-button type="success" size="small" @click="testAddTask">
            <el-icon><Plus /></el-icon>
            添加任务
          </el-button>
          <el-button type="primary" size="small" @click="testUpdateTask">
            <el-icon><Edit /></el-icon>
            更新任务
          </el-button>
          <el-button type="warning" size="small" @click="testCompleteTask">
            <el-icon><Check /></el-icon>
            完成任务
          </el-button>
          <el-button type="danger" size="small" @click="testDeleteTask">
            <el-icon><Delete /></el-icon>
            删除任务
          </el-button>
        </div>
        <p class="operations-desc">测试任务管理功能的增删改完成操作</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { PageHeader } from '@/components/common'
import {
  CircleCheck,
  CircleClose,
  InfoFilled,
  VideoPlay,
  Link,
  Setting,
  TrendCharts,
  Warning,
  Plus,
  Edit,
  Check,
  Delete,
} from '@element-plus/icons-vue'
import {
  enableMockService,
  disableMockService,
  getMockServiceState,
  getMockWebSocketManager,
  connectAllMockEndpoints,
  disconnectAllMockEndpoints,
  triggerManualPush,
  simulateConnectionError,
  simulateTaskOperation,
  resetMockStats,
  updateMockConfig,
} from '../services/mockWebSocketService'
import type { MockDataConfig } from '../utils/mockDataGenerators'
import type { WSEndpointType } from '../services/websocket'
import { useWebSocketDataStore } from '../stores/websocketData'

// 所有端点
const ALL_ENDPOINTS: WSEndpointType[] = [
  'PLAYER',
  'WORLD',
  'MARKER',
  'LOGS',
  'MCP_LOGS',
  'TOKEN_USAGE',
  'TASK_MANAGER',
]

// 响应式数据
const mockEnabled = ref(false)
const mockState = getMockServiceState()
const dataStore = useWebSocketDataStore()
const refreshTimer = ref<number | null>(null)

// 计算属性
const connectedCount = computed(() => {
  return Object.values(mockState.connections).filter((conn) => conn.connected).length
})

const totalEndpoints = computed(() => ALL_ENDPOINTS.length)

const allConnected = computed(() => {
  return connectedCount.value === totalEndpoints.value && connectedCount.value > 0
})

const connectionRate = computed(() => {
  if (totalEndpoints.value === 0) return 0
  return Math.round((connectedCount.value / totalEndpoints.value) * 100)
})

const endpointList = computed(() => {
  return ALL_ENDPOINTS.map((endpoint) => ({
    endpoint,
    connected: mockState.connections[endpoint].connected,
    lastConnected: mockState.connections[endpoint].lastConnected,
    messageCount: mockState.connections[endpoint].messageCount,
    errorCount: mockState.connections[endpoint].errorCount,
    lastError: mockState.connections[endpoint].lastError,
  }))
})

const latestLogMessage = computed(() => {
  const latestLog = dataStore.logs[0] || dataStore.mcpLogs[0]
  return latestLog ? latestLog.message.substring(0, 30) + '...' : '无'
})

// 方法
const handleModeToggle = (enabled: boolean) => {
  if (enabled) {
    enableMockService()
    mockEnabled.value = true
    ElMessage.success('模拟模式已启用！现在可以连接模拟端点了')
  } else {
    disableMockService()
    mockEnabled.value = false
    ElMessage.info('已切换回真实模式')
  }
}

const handleGlobalToggle = async () => {
  try {
    if (allConnected.value) {
      ElMessage.info('正在断开所有模拟连接...')
      disconnectAllMockEndpoints()
    } else {
      ElMessage.info('正在连接所有模拟端点...')
      await connectAllMockEndpoints()
      ElMessage.success('模拟连接已建立！数据将在1-2秒后开始推送')
    }
  } catch (error) {
    ElMessage.error('连接操作失败，请查看控制台')
    console.error('Mock connection error:', error)
  }
}

const handleQuickStart = async () => {
  try {
    // 1. 启用模拟模式
    if (!mockEnabled.value) {
      enableMockService()
      mockEnabled.value = true
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // 2. 连接所有端点
    await connectAllMockEndpoints()

    ElMessage.success('模拟器已启动！现在可以查看实时数据了')
  } catch (error) {
    ElMessage.error('启动失败，请检查控制台错误信息')
    console.error('Quick start failed:', error)
  }
}

const connectEndpoint = async (endpoint: WSEndpointType) => {
  try {
    const manager = getMockWebSocketManager(endpoint)
    await manager.connect()
    ElMessage.success(`${endpoint} 连接成功`)
  } catch (error) {
    ElMessage.error(`${endpoint} 连接失败`)
  }
}

const disconnectEndpoint = (endpoint: WSEndpointType) => {
  const manager = getMockWebSocketManager(endpoint)
  manager.disconnect()
  ElMessage.success(`${endpoint} 已断开连接`)
}

const triggerPush = (endpoint: WSEndpointType) => {
  triggerManualPush(endpoint)
}

const simulateError = (endpoint: WSEndpointType) => {
  simulateConnectionError(endpoint, `${endpoint} 模拟连接错误`)
}

const resetStats = () => {
  resetMockStats()
}

const getConfig = (endpoint: WSEndpointType): MockDataConfig => {
  const configKey = endpoint.toLowerCase()
  return mockState.configs[configKey] || { interval: 3000, enabled: true }
}

const updateEndpointConfig = (endpoint: WSEndpointType) => {
  const configKey = endpoint.toLowerCase()
  const config = getConfig(endpoint)
  updateMockConfig(configKey, config)
  ElMessage.success(`${endpoint} 配置已更新`)
}

// 任务操作测试方法
const testAddTask = () => {
  simulateTaskOperation('add', {
    details: '测试添加任务：收集64个钻石',
    done_criteria: '背包中有64个钻石',
    priority: 'high',
    category: 'collection',
    difficulty: 'hard',
    estimated_time: 60,
  })
}

const testUpdateTask = () => {
  simulateTaskOperation('update', {
    id: `task_${Date.now()}_test`,
    details: '更新任务：收集128个钻石',
    progress: '进行中',
    priority: 'high',
  })
}

const testCompleteTask = () => {
  simulateTaskOperation('complete', {
    id: `task_${Date.now()}_test`,
    details: '完成任务：收集钻石',
    done: true,
  })
}

const testDeleteTask = () => {
  simulateTaskOperation('delete', {
    id: `task_${Date.now()}_test`,
  })
}

const enableAllDataPush = () => {
  ALL_ENDPOINTS.forEach((endpoint) => {
    const configKey = endpoint.toLowerCase()
    updateMockConfig(configKey, { enabled: true })
  })
  ElMessage.success('已启用所有数据推送')
}

const disableAllDataPush = () => {
  ALL_ENDPOINTS.forEach((endpoint) => {
    const configKey = endpoint.toLowerCase()
    updateMockConfig(configKey, { enabled: false })
  })
  ElMessage.success('已禁用所有数据推送')
}

const triggerAllPush = () => {
  ALL_ENDPOINTS.forEach((endpoint) => {
    if (mockState.connections[endpoint].connected) {
      triggerManualPush(endpoint)
    }
  })
  ElMessage.success('已触发所有连接端点的数据推送')
}

const setAllInterval = (interval: number) => {
  ALL_ENDPOINTS.forEach((endpoint) => {
    const configKey = endpoint.toLowerCase()
    updateMockConfig(configKey, { interval })
  })
  ElMessage.success(`已设置所有端点推送间隔为 ${interval}ms`)
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

const getEndpointTagType = (endpoint: string): string => {
  const typeMap: Record<string, string> = {
    PLAYER: 'success',
    WORLD: 'primary',
    MARKER: 'warning',
    LOGS: 'info',
    MCP_LOGS: 'info',
    TOKEN_USAGE: 'danger',
    TASK_MANAGER: 'primary',
  }
  return typeMap[endpoint] || 'default'
}

// 生命周期
onMounted(() => {
  mockEnabled.value = mockState.isEnabled

  // 定期刷新状态
  refreshTimer.value = window.setInterval(() => {
    // 强制更新响应式数据
  }, 1000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.websocket-simulator {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.mode-switch-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mode-label {
  font-weight: 500;
  color: #333;
  min-width: 60px;
  text-align: right;
}

.quick-start-card,
.overview-card,
.connections-card,
.preview-card,
.batch-operations-card,
.help-card {
  margin-bottom: 20px;
}

.quick-start-card {
  border: 2px dashed #409eff;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
}

.quick-start-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.quick-start-steps {
  display: flex;
  gap: 20px;
  flex: 1;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.step-content p {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.quick-start-action {
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.config-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 240px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-label {
  font-size: 12px;
  color: #666;
  min-width: 32px;
}

.interval-label {
  font-size: 12px;
  color: #666;
  min-width: 20px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.preview-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.preview-item h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.preview-content p {
  margin: 6px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.preview-content strong {
  color: #333;
}

.batch-operations {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.help-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

/* 任务操作测试 */
.task-operations-card {
  margin-bottom: 20px;
}

.task-operations-content {
  text-align: center;
}

.operations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.operations-desc {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.help-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.help-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.help-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 8px;
}

.help-item h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.help-item p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.time-text {
  font-size: 12px;
  color: #666;
}

.no-data {
  color: #999;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    align-items: stretch;
  }

  .mode-switch-container {
    justify-content: center;
  }

  .quick-start-content {
    flex-direction: column;
    gap: 16px;
  }

  .quick-start-steps {
    flex-direction: column;
    gap: 12px;
  }

  .step {
    flex-direction: row;
    align-items: flex-start;
  }

  .overview-content {
    grid-template-columns: 1fr;
  }

  .preview-grid {
    grid-template-columns: 1fr;
  }

  .batch-operations {
    flex-direction: column;
    align-items: stretch;
  }

  .config-controls {
    min-width: auto;
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }

  .websocket-simulator {
    padding: 12px;
  }
}
</style>
