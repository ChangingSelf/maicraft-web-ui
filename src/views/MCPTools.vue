<template>
  <div class="mcp-tools-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>MCP 工具管理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showToolCallDialog = true">
          调用工具
        </el-button>
        <el-button type="success" :icon="List" @click="showBatchCallDialog = true">
          批量调用
        </el-button>
        <el-button type="info" :icon="Refresh" @click="refreshTools" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 工具分类筛选 -->
    <div class="filters-section">
      <el-tabs v-model="activeCategory" @tab-click="handleCategoryChange">
        <el-tab-pane
          v-for="category in categories"
          :key="category"
          :label="categoryLabels[category] || category"
          :name="category"
        />
      </el-tabs>
    </div>

    <!-- 工具列表 -->
    <div class="tools-grid">
      <el-card v-for="tool in filteredTools" :key="tool.name" class="tool-card" shadow="hover">
        <div class="tool-header">
          <div class="tool-title">
            <el-icon class="tool-icon">
              <component :is="getToolIcon(tool.category)" />
            </el-icon>
            <h3>{{ tool.name }}</h3>
            <el-tag :type="tool.enabled ? 'success' : 'info'" size="small">
              {{ tool.enabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <el-tag size="small">{{ categoryLabels[tool.category] }}</el-tag>
        </div>

        <p class="tool-description">{{ tool.description }}</p>

        <div class="tool-actions">
          <el-button size="small" type="primary" @click="showToolDetail(tool)">
            查看详情
          </el-button>
          <el-button size="small" type="success" :disabled="!tool.enabled" @click="callTool(tool)">
            调用
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 工具详情对话框 -->
    <el-dialog
      v-model="showToolDetailDialog"
      title="工具详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedTool" class="tool-detail">
        <div class="detail-header">
          <h3>{{ selectedTool.name }}</h3>
          <el-tag :type="selectedTool.enabled ? 'success' : 'info'">
            {{ selectedTool.enabled ? '启用' : '禁用' }}
          </el-tag>
        </div>

        <div class="detail-section">
          <h4>描述</h4>
          <p>{{ selectedTool.description }}</p>
        </div>

        <div class="detail-section">
          <h4>分类</h4>
          <el-tag>{{ categoryLabels[selectedTool.category] }}</el-tag>
        </div>

        <div class="detail-section" v-if="selectedTool.parameters">
          <h4>参数</h4>
          <div class="parameters-list">
            <div
              v-for="[paramName, paramInfo] in Object.entries(selectedTool.parameters.properties)"
              :key="paramName"
              class="parameter-item"
            >
              <div class="param-header">
                <strong>{{ paramName }}</strong>
                <el-tag size="small" type="info">{{ paramInfo.type }}</el-tag>
                <el-tag
                  v-if="selectedTool.parameters.required?.includes(paramName)"
                  size="small"
                  type="warning"
                >
                  必需
                </el-tag>
              </div>
              <p class="param-description">{{ paramInfo.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showToolDetailDialog = false">关闭</el-button>
        <el-button
          type="primary"
          :disabled="!selectedTool?.enabled"
          @click="selectedTool && callTool(selectedTool)"
        >
          调用工具
        </el-button>
      </template>
    </el-dialog>

    <!-- 工具调用对话框 -->
    <el-dialog
      v-model="showToolCallDialog"
      title="调用工具"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="callingTool" class="call-form">
        <el-form ref="callFormRef" :model="callForm" :rules="callFormRules" label-width="120px">
          <el-form-item label="工具名称">
            <el-select
              v-model="callingTool.name"
              placeholder="选择工具"
              style="width: 100%"
              @change="handleToolChange"
            >
              <el-option
                v-for="tool in enabledTools"
                :key="tool.name"
                :label="tool.name"
                :value="tool.name"
              />
            </el-select>
          </el-form-item>

          <template v-if="callingTool.parameters">
            <el-form-item
              v-for="[paramName, paramInfo] in Object.entries(callingTool.parameters.properties)"
              :key="paramName"
              :label="paramName"
              :prop="paramName"
              :rules="getParamRules(paramName, paramInfo)"
            >
              <el-input
                v-if="paramInfo.type === 'string'"
                v-model="callForm[paramName]"
                :placeholder="paramInfo.description"
              />
              <el-input-number
                v-else-if="paramInfo.type === 'number' || paramInfo.type === 'integer'"
                v-model="callForm[paramName]"
                :placeholder="paramInfo.description"
                style="width: 100%"
              />
              <el-switch
                v-else-if="paramInfo.type === 'boolean'"
                v-model="callForm[paramName]"
                :active-text="paramInfo.description"
              />
              <el-select
                v-else-if="paramInfo.enum"
                v-model="callForm[paramName]"
                :placeholder="paramInfo.description"
              >
                <el-option
                  v-for="option in paramInfo.enum"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
            </el-form-item>
          </template>

          <el-form-item label="异步调用">
            <el-switch v-model="callForm.async" />
          </el-form-item>

          <el-form-item label="超时时间(秒)">
            <el-input-number v-model="callForm.timeout" :min="1" :max="300" style="width: 100%" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showToolCallDialog = false">取消</el-button>
        <el-button type="primary" :loading="calling" @click="executeToolCall"> 执行调用 </el-button>
      </template>
    </el-dialog>

    <!-- 批量调用对话框 -->
    <el-dialog
      v-model="showBatchCallDialog"
      title="批量调用工具"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="batch-call-form">
        <el-alert
          title="批量调用说明"
          description="可以同时调用多个工具，支持顺序或并行执行"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <div class="batch-calls-list">
          <div v-for="(call, index) in batchCalls" :key="index" class="batch-call-item">
            <div class="call-header">
              <span>调用 {{ index + 1 }}</span>
              <el-button type="danger" size="small" @click="removeBatchCall(index)">
                删除
              </el-button>
            </div>

            <el-form :model="call" label-width="80px">
              <el-form-item label="工具">
                <el-select
                  v-model="call.tool_name"
                  placeholder="选择工具"
                  style="width: 100%"
                  @change="handleBatchToolChange(index)"
                >
                  <el-option
                    v-for="tool in enabledTools"
                    :key="tool.name"
                    :label="tool.name"
                    :value="tool.name"
                  />
                </el-select>
              </el-form-item>

              <div v-if="call.parameters" class="batch-params">
                <el-form-item
                  v-for="[paramName, paramInfo] in Object.entries(call.parameters)"
                  :key="paramName"
                  :label="paramName"
                >
                  <el-input
                    v-if="paramInfo.type === 'string'"
                    v-model="call.params[paramName]"
                    :placeholder="paramInfo.description"
                    size="small"
                  />
                  <el-input-number
                    v-else-if="paramInfo.type === 'number' || paramInfo.type === 'integer'"
                    v-model="call.params[paramName]"
                    :placeholder="paramInfo.description"
                    size="small"
                    style="width: 100%"
                  />
                  <el-switch
                    v-else-if="paramInfo.type === 'boolean'"
                    v-model="call.params[paramName]"
                    :active-text="paramInfo.description"
                  />
                </el-form-item>
              </div>
            </el-form>
          </div>
        </div>

        <el-button type="primary" :icon="Plus" @click="addBatchCall" style="margin-bottom: 20px">
          添加调用
        </el-button>

        <el-form :model="batchForm" label-width="120px">
          <el-form-item label="执行方式">
            <el-radio-group v-model="batchForm.sequential">
              <el-radio :value="true">顺序执行</el-radio>
              <el-radio :value="false">并行执行</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showBatchCallDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="batchCalling"
          :disabled="batchCalls.length === 0"
          @click="executeBatchCall"
        >
          执行批量调用
        </el-button>
      </template>
    </el-dialog>

    <!-- 调用历史 -->
    <div class="call-history-section">
      <div class="section-header">
        <h3>调用历史</h3>
        <el-button type="text" @click="loadCallHistory" :loading="historyLoading">
          刷新历史
        </el-button>
      </div>

      <el-table :data="callHistory" style="width: 100%" :loading="historyLoading">
        <el-table-column prop="tool_name" label="工具名称" width="150" />
        <el-table-column label="参数" width="200">
          <template #default="{ row }">
            <el-tooltip :content="JSON.stringify(row.parameters, null, 2)" placement="top">
              <span class="param-preview">
                {{ JSON.stringify(row.parameters).slice(0, 50) }}...
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="200">
          <template #default="{ row }">
            <span v-if="row.result">
              {{ row.result.content ? row.result.content.slice(0, 50) : '无内容' }}...
            </span>
            <span v-else>无结果</span>
          </template>
        </el-table-column>
        <el-table-column prop="execution_time" label="执行时间" width="120">
          <template #default="{ row }">
            {{ row.execution_time ? `${row.execution_time.toFixed(2)}s` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="调用时间" width="180">
          <template #default="{ row }">
            {{ formatTimestamp(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="text" @click="showCallDetail(row)"> 详情 </el-button>
          </template>
        </el-table-column>
      </el-table>
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
import { ref, computed, onMounted, reactive } from 'vue'
import { Plus, List, Refresh, Pointer, Setting, Scissor, Star, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mcpApi, type MCPTool, type ToolCall } from '@/services/mcp'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'MCPTools',
})

interface BatchCall {
  tool_name: string
  parameters: Record<string, any>
  params: Record<string, any>
}

// 响应式数据
const loading = ref(false)
const historyLoading = ref(false)
const calling = ref(false)
const batchCalling = ref(false)

const tools = ref<MCPTool[]>([])
const callHistory = ref<ToolCall[]>([])
const activeCategory = ref('all')
const selectedTool = ref<MCPTool | null>(null)
const selectedCall = ref<ToolCall | null>(null)
const callingTool = ref<MCPTool | null>(null)

const showToolDetailDialog = ref(false)
const showToolCallDialog = ref(false)
const showBatchCallDialog = ref(false)
const showCallDetailDialog = ref(false)

const callForm = reactive<Record<string, any>>({
  async: false,
  timeout: 30,
})

const batchForm = reactive({
  sequential: true,
})

const batchCalls = ref<BatchCall[]>([])

// 工具分类标签
const categoryLabels: Record<string, string> = {
  movement: '移动',
  mining: '挖掘',
  crafting: '合成',
  combat: '战斗',
  interaction: '交互',
  inventory: '物品栏',
  observation: '观察',
}

// 分类列表
const categories = computed(() => {
  const cats = ['all', ...new Set(tools.value.map((tool) => tool.category))]
  return cats
})

// 过滤后的工具
const filteredTools = computed(() => {
  if (activeCategory.value === 'all') {
    return tools.value
  }
  return tools.value.filter((tool) => tool.category === activeCategory.value)
})

// 启用的工具
const enabledTools = computed(() => {
  return tools.value.filter((tool) => tool.enabled)
})

// 表单验证规则
const callFormRules = computed(() => {
  const rules: Record<string, any> = {}
  if (callingTool.value?.parameters?.required) {
    callingTool.value.parameters.required.forEach((param: string) => {
      rules[param] = [{ required: true, message: `${param}为必填参数` }]
    })
  }
  return rules
})

// 获取工具图标
const getToolIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    movement: Pointer,
    mining: Setting,
    crafting: Scissor,
    combat: Star,
    observation: View,
  }
  return iconMap[category] || Setting
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    success: 'success',
    error: 'danger',
    pending: 'warning',
  }
  return typeMap[status] || 'info'
}

// 获取参数验证规则
const getParamRules = (paramName: string, paramInfo: any) => {
  const rules = []
  if (callingTool.value?.parameters?.required?.includes(paramName)) {
    rules.push({ required: true, message: `${paramName}为必填参数` })
  }
  if (paramInfo.type === 'number' || paramInfo.type === 'integer') {
    rules.push({ type: 'number', message: `${paramName}必须为数字` })
  }
  return rules
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
    tools.value = response.tools
  } catch (error) {
    ElMessage.error('加载工具列表失败')
    console.error(error)
    // 如果API调用失败，使用模拟数据作为fallback
    tools.value = [
      {
        name: 'move',
        description: '移动到指定位置',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X坐标' },
            y: { type: 'number', description: 'Y坐标' },
            z: { type: 'number', description: 'Z坐标' },
          },
          required: ['x', 'y', 'z'],
        },
        category: 'movement',
        enabled: true,
      },
      {
        name: 'mine_block',
        description: '挖掘指定方块',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X坐标' },
            y: { type: 'number', description: 'Y坐标' },
            z: { type: 'number', description: 'Z坐标' },
            face: {
              type: 'string',
              enum: ['north', 'south', 'east', 'west', 'up', 'down'],
              description: '挖掘面',
            },
          },
          required: ['x', 'y', 'z'],
        },
        category: 'mining',
        enabled: true,
      },
    ]
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
        parameters: { x: 100, y: 64, z: 200 },
        status: 'success',
        timestamp: Date.now() - 3600000,
        execution_time: 2.5,
        result: {
          content: [{ type: 'text', text: '成功移动到位置 (100, 64, 200)' }],
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

// 处理分类变化
const handleCategoryChange = () => {
  // 分类变化时的处理逻辑
}

// 显示工具详情
const showToolDetail = (tool: MCPTool) => {
  selectedTool.value = tool
  showToolDetailDialog.value = true
}

// 调用工具
const callTool = (tool: MCPTool) => {
  callingTool.value = tool
  // 重置表单
  Object.keys(callForm).forEach((key) => {
    if (key !== 'async' && key !== 'timeout') {
      delete callForm[key]
    }
  })
  showToolCallDialog.value = true
}

// 处理工具选择变化
const handleToolChange = (toolName: string) => {
  const tool = tools.value.find((t) => t.name === toolName)
  if (tool) {
    callingTool.value = tool
    // 重置表单参数
    Object.keys(callForm).forEach((key) => {
      if (key !== 'async' && key !== 'timeout') {
        delete callForm[key]
      }
    })
  }
}

// 执行工具调用
const executeToolCall = async () => {
  if (!callingTool.value) return

  try {
    calling.value = true

    // 构建调用参数
    const params: Record<string, any> = {}
    if (callingTool.value.parameters?.properties) {
      Object.keys(callingTool.value.parameters.properties).forEach((key) => {
        if (callForm[key] !== undefined) {
          params[key] = callForm[key]
        }
      })
    }

    const result = await mcpApi.callTool(callingTool.value.name, {
      parameters: params,
      async: callForm.async,
      timeout: callForm.timeout,
    })

    ElMessage.success(`工具 ${callingTool.value.name} 调用成功`)
    showToolCallDialog.value = false
    loadCallHistory() // 刷新历史
  } catch (error) {
    ElMessage.error('工具调用失败')
    console.error(error)
  } finally {
    calling.value = false
  }
}

// 添加批量调用
const addBatchCall = () => {
  batchCalls.value.push({
    tool_name: '',
    parameters: {},
    params: {},
  })
}

// 移除批量调用
const removeBatchCall = (index: number) => {
  batchCalls.value.splice(index, 1)
}

// 处理批量工具变化
const handleBatchToolChange = (index: number) => {
  const call = batchCalls.value[index]
  const tool = tools.value.find((t) => t.name === call.tool_name)
  if (tool) {
    call.parameters = tool.parameters?.properties || {}
    call.params = {}
  }
}

// 执行批量调用
const executeBatchCall = async () => {
  if (batchCalls.value.length === 0) return

  try {
    batchCalling.value = true

    // 构建批量调用数据
    const calls = batchCalls.value.map((call) => ({
      tool_name: call.tool_name,
      parameters: call.params,
    }))

    const result = await mcpApi.batchCallTools({
      calls,
      sequential: batchForm.sequential,
    })

    ElMessage.success(
      `批量调用完成，成功 ${result.successful_calls} 个，失败 ${result.failed_calls} 个`,
    )
    showBatchCallDialog.value = false
    batchCalls.value = []
    loadCallHistory() // 刷新历史
  } catch (error) {
    ElMessage.error('批量调用失败')
    console.error(error)
  } finally {
    batchCalling.value = false
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

.filters-section {
  margin-bottom: 24px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.tool-card {
  transition: transform 0.2s ease;
}

.tool-card:hover {
  transform: translateY(-2px);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tool-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.tool-icon {
  color: #409eff;
}

.tool-description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.tool-actions {
  display: flex;
  gap: 8px;
}

.tool-detail .detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parameter-item {
  padding: 12px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  background: #fafafa;
}

.param-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.param-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.call-history-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.param-preview {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}

.call-detail .detail-row {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.call-detail .detail-section {
  margin-top: 20px;
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

.batch-call-item {
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafa;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.batch-params {
  margin-left: 20px;
  padding-left: 12px;
  border-left: 2px solid #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
