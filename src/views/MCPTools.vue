<template>
  <div class="mcp-tools-page">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧工具列表面板 -->
      <div class="left-panel">
        <ToolList
          :tools="tools"
          :loading="loading"
          :selected-tool="selectedTool"
          @tool-selected="handleToolSelected"
          @refresh="refreshTools"
        />
      </div>

      <!-- 右侧工具详情面板 -->
      <div class="right-panel">
        <ToolDetail :tool="selectedTool" :executing="executing" @run-tool="handleRunTool" />
      </div>
    </div>

    <!-- 底部面板 -->
    <div class="bottom-panel">
      <!-- 历史记录面板 -->
      <div class="history-section">
        <HistoryPanel
          :history="callHistory"
          :loading="historyLoading"
          @refresh="loadCallHistory"
          @clear="clearHistory"
          @item-selected="showCallDetail"
        />
      </div>

      <!-- 服务器通知面板 -->
      <div class="notification-section">
        <NotificationPanel
          :notifications="notifications"
          @clear="clearNotifications"
          @mark-read="markNotificationRead"
          @mark-all-read="markAllNotificationsRead"
        />
      </div>
    </div>

    <!-- 调用详情对话框 -->
    <el-dialog v-model="showCallDetailDialog" title="调用详情" width="700px">
      <div v-if="selectedCall" class="call-detail">
        <div class="detail-row"><strong>工具名称:</strong> {{ selectedCall.tool_name }}</div>
        <div class="detail-row">
          <strong>状态:</strong>
          <el-tag :type="getStatusType(selectedCall.status)">
            {{ selectedCall.status }}
          </el-tag>
        </div>
        <div class="detail-row"><strong>调用ID:</strong> {{ selectedCall.call_id }}</div>
        <div class="detail-row">
          <strong>执行时间:</strong>
          {{ selectedCall.execution_time ? `${selectedCall.execution_time.toFixed(2)}s` : '-' }}
        </div>
        <div class="detail-row">
          <strong>调用时间:</strong> {{ formatTimestamp(selectedCall.timestamp) }}
        </div>

        <div class="detail-section">
          <h4>调用参数</h4>
          <el-card>
            <pre>{{ JSON.stringify(selectedCall.parameters, null, 2) }}</pre>
          </el-card>
        </div>

        <div class="detail-section" v-if="selectedCall.result">
          <h4>调用结果</h4>
          <el-card>
            <div class="result-content">
              <div v-if="selectedCall.result.content">
                <div
                  v-for="content in selectedCall.result.content"
                  :key="content.type"
                  class="result-item"
                >
                  <template v-if="content.type === 'text'">
                    <pre>{{ content.text }}</pre>
                  </template>
                  <template v-else>
                    <span>{{ content.type }}: {{ JSON.stringify(content) }}</span>
                  </template>
                </div>
              </div>
              <div class="result-meta">
                <span>是否错误: {{ selectedCall.result.is_error ? '是' : '否' }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mcpApi, type MCPTool, type ToolCall } from '@/services/mcp'
import {
  ToolList,
  ToolDetail,
  HistoryPanel,
  NotificationPanel,
  type MCPNotification,
} from '@/components/mcp'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'MCPTools',
})

interface BatchCall {
  tool_name: string
  inputSchema: Record<string, any>
  params: Record<string, any>
}

// 响应式数据
const loading = ref(false)
const historyLoading = ref(false)
const executing = ref(false)

const tools = ref<MCPTool[]>([])
const callHistory = ref<ToolCall[]>([])
const selectedTool = ref<MCPTool | null>(null)
const selectedCall = ref<ToolCall | null>(null)
const notifications = ref<MCPNotification[]>([])

// 初始化一些模拟通知数据
notifications.value = [
  {
    id: '1',
    type: 'info',
    title: 'MCP服务器连接成功',
    message: '已成功连接到MCP服务器，所有工具已加载完成',
    timestamp: Date.now() - 300000,
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: '工具调用完成',
    message: '工具 "move" 执行成功，移动到目标位置',
    timestamp: Date.now() - 600000,
    read: true,
  },
]

const showCallDetailDialog = ref(false)

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    success: 'success',
    error: 'danger',
    pending: 'warning',
  }
  return typeMap[status] || 'info'
}

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 加载工具列表
const loadTools = async () => {
  try {
    loading.value = true
    const response = await mcpApi.getTools()
    // 为没有 enabled 字段的工具设置默认启用状态
    tools.value = response.tools.map((tool) => ({
      ...tool,
      enabled: tool.enabled !== false, // 如果没有 enabled 字段或不为 false，则默认为 true
    }))
  } catch (error) {
    ElMessage.error('加载工具列表失败')
    console.error(error)
    // 如果API调用失败，使用模拟数据作为fallback
    const fallbackTools = [
      {
        name: 'move',
        description: '移动到指定位置',
        inputSchema: {
          type: 'object',
          properties: {
            position: {
              type: 'object',
              properties: {
                x: { type: 'number', description: '目标X坐标' },
                y: { type: 'number', description: '目标Y坐标' },
                z: { type: 'number', description: '目标Z坐标' },
              },
              required: ['x', 'y', 'z'],
            },
          },
          required: ['position'],
        },
        category: 'movement',
        enabled: true,
      },
      {
        name: 'mine_block',
        description: '挖掘指定类型的方块',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: "方块名称，如 'stone', 'iron_ore'" },
            count: { type: 'integer', description: '挖掘数量', default: 1 },
            digOnly: { type: 'boolean', description: '是否只挖掘不收集', default: false },
          },
          required: ['name'],
        },
        category: 'mining',
        enabled: true,
      },
    ]
    // 为模拟数据也应用同样的处理逻辑
    tools.value = fallbackTools.map((tool) => ({
      ...tool,
      enabled: tool.enabled !== false,
    }))
  } finally {
    loading.value = false
  }
}

// 加载调用历史
const loadCallHistory = async () => {
  try {
    historyLoading.value = true
    const response = await mcpApi.getToolCalls({ limit: 20 })
    callHistory.value = response.calls
  } catch (error) {
    ElMessage.error('加载调用历史失败')
    console.error(error)
    // 如果API调用失败，使用模拟数据作为fallback
    callHistory.value = [
      {
        call_id: 'call_001',
        tool_name: 'move',
        parameters: { position: { x: 123.5, y: 64.0, z: -456.8 } },
        status: 'success',
        timestamp: Date.now() - 3600000,
        execution_time: 2.5,
        result: {
          content: [{ type: 'text', text: '成功移动到位置 (123.5, 64.0, -456.8)' }],
          is_error: false,
        },
      },
    ]
  } finally {
    historyLoading.value = false
  }
}

// 刷新工具列表
const refreshTools = () => {
  loadTools()
}

// 处理工具选择
const handleToolSelected = (tool: MCPTool | null) => {
  selectedTool.value = tool
}

// 处理工具执行
const handleRunTool = async (tool: MCPTool, params: Record<string, any>) => {
  try {
    executing.value = true

    // 提取执行选项
    const { _async, _timeout, ...toolParams } = params

    const result = await mcpApi.callTool(tool.name, toolParams)

    ElMessage.success(`工具 ${tool.name} 执行成功`)

    // 添加成功通知
    addNotification({
      type: 'success',
      title: '工具执行成功',
      message: `工具 "${tool.name}" 执行完成`,
      timestamp: Date.now(),
      read: false,
    })

    loadCallHistory() // 刷新历史
  } catch (error) {
    ElMessage.error(`工具 ${tool.name} 执行失败`)
    console.error('工具执行失败:', error)

    // 添加错误通知
    addNotification({
      type: 'error',
      title: '工具执行失败',
      message: `工具 "${tool.name}" 执行出错: ${error}`,
      timestamp: Date.now(),
      read: false,
    })
  } finally {
    executing.value = false
  }
}

// 清空历史记录
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有历史记录吗？', '确认操作', {
      type: 'warning',
    })
    callHistory.value = []
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消操作
  }
}

// 清空通知
const clearNotifications = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有通知吗？', '确认操作', {
      type: 'warning',
    })
    notifications.value = []
    ElMessage.success('通知已清空')
  } catch {
    // 用户取消操作
  }
}

// 标记通知为已读
const markNotificationRead = (notification: MCPNotification) => {
  const index = notifications.value.findIndex((n) => n.id === notification.id)
  if (index !== -1) {
    notifications.value[index].read = true
  }
}

// 标记所有通知为已读
const markAllNotificationsRead = () => {
  notifications.value.forEach((notification) => {
    notification.read = true
  })
  ElMessage.success('所有通知已标记为已读')
}

// 添加通知
const addNotification = (notification: Omit<MCPNotification, 'id'>) => {
  const newNotification: MCPNotification = {
    ...notification,
    id: Date.now().toString(),
  }
  notifications.value.unshift(newNotification)

  // 限制通知数量，最多保留50条
  if (notifications.value.length > 50) {
    notifications.value = notifications.value.slice(0, 50)
  }
}

// 显示调用详情
const showCallDetail = (call: ToolCall) => {
  selectedCall.value = call
  showCallDetailDialog.value = true
}

// 组件挂载时加载数据
onMounted(() => {
  loadTools()
  loadCallHistory()
})
</script>

<style scoped>
.mcp-tools-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.left-panel {
  width: 350px;
  min-width: 300px;
  max-width: 500px;
  border-right: 1px solid #e6e6e6;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bottom-panel {
  height: 300px;
  min-height: 200px;
  max-height: 400px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  background: #fff;
}

.history-section {
  flex: 1;
  min-width: 0;
}

.notification-section {
  width: 350px;
  min-width: 300px;
  max-width: 500px;
  border-left: 1px solid #e6e6e6;
}

/* 调用详情对话框样式 */
.call-detail .detail-row {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.call-detail .detail-section {
  margin-top: 20px;
}

.call-detail .detail-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.call-detail pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.result-content {
  font-family: monospace;
  font-size: 14px;
}

.result-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.result-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e6e6e6;
  color: #666;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mcp-tools-page {
    height: 100vh;
  }

  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #e6e6e6;
  }

  .right-panel {
    flex: 1;
  }

  .bottom-panel {
    flex-direction: column;
    height: auto;
    min-height: 200px;
  }

  .notification-section {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e6e6e6;
  }
}
</style>
