<template>
  <div class="mcp-tool-detail">
    <div v-if="!tool" class="empty-state">
      <el-empty description="请从左侧选择一个工具查看详情" :image-size="120" />
    </div>

    <div v-else class="tool-content">
      <!-- 工具信息头部 -->
      <div class="tool-info-header">
        <div class="tool-title">
          <h3>{{ tool.name }}</h3>
          <el-tag :type="tool.enabled ? 'success' : 'info'" size="large">
            {{ tool.enabled ? '启用' : '禁用' }}
          </el-tag>
        </div>
        <!-- 移除头部的执行按钮，将在底部固定显示 -->
      </div>

      <!-- 主要内容区域：左右分栏 -->
      <div class="main-detail-content">
        <!-- 左侧：工具信息和参数配置 -->
        <div class="left-detail-panel">
          <!-- 工具描述 -->
          <div class="tool-section">
            <h4>描述</h4>
            <p class="tool-description">{{ tool.description }}</p>
          </div>

          <!-- 工具分类 -->
          <div class="tool-section">
            <h4>分类</h4>
            <el-tag type="primary">{{ getCategoryLabel(tool.category) }}</el-tag>
          </div>

          <!-- 参数配置 -->
          <div v-if="tool.inputSchema?.properties" class="tool-section parameters-section">
            <div class="parameters-header">
              <h4>参数配置</h4>
              <el-button @click="copyJsonParams" size="small" type="primary" plain>
                复制JSON参数
              </el-button>
            </div>
            <div class="parameters-form">
              <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="auto"
                size="default"
              >
                <el-form-item
                  v-for="[paramName, paramInfo] in Object.entries(tool.inputSchema.properties)"
                  :key="paramName"
                  :label="paramName"
                  :prop="paramName"
                  :required="isRequired(paramName)"
                >
                  <template #label>
                    <div class="param-label">
                      <span>{{ paramName }}</span>
                      <el-tag size="small" type="info">{{ paramInfo.type }}</el-tag>
                      <el-tag v-if="isRequired(paramName)" size="small" type="warning">
                        必需
                      </el-tag>
                    </div>
                  </template>

                  <!-- 字符串输入 -->
                  <el-input
                    v-if="paramInfo.type === 'string'"
                    v-model="formData[paramName]"
                    :placeholder="paramInfo.description"
                    clearable
                  />

                  <!-- 数字输入 -->
                  <el-input-number
                    v-else-if="paramInfo.type === 'number' || paramInfo.type === 'integer'"
                    v-model="formData[paramName]"
                    :placeholder="paramInfo.description"
                    style="width: 100%"
                    controls-position="right"
                  />

                  <!-- 布尔值开关 -->
                  <div v-else-if="paramInfo.type === 'boolean'" class="boolean-field">
                    <el-switch v-model="formData[paramName]" />
                    <span class="boolean-description">{{ paramInfo.description }}</span>
                  </div>

                  <!-- 枚举选择 -->
                  <el-select
                    v-else-if="paramInfo.enum"
                    v-model="formData[paramName]"
                    :placeholder="paramInfo.description"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="option in paramInfo.enum"
                      :key="option"
                      :label="option"
                      :value="option"
                    />
                  </el-select>

                  <!-- 对象类型（显示为JSON编辑器） -->
                  <el-input
                    v-else-if="paramInfo.type === 'object'"
                    v-model="formData[paramName]"
                    type="textarea"
                    :rows="4"
                    :placeholder="`请输入JSON格式的${paramInfo.description || paramName}`"
                  />

                  <!-- 数组类型 -->
                  <el-input
                    v-else-if="paramInfo.type === 'array'"
                    v-model="formData[paramName]"
                    type="textarea"
                    :rows="3"
                    :placeholder="`请输入数组格式的${paramInfo.description || paramName}`"
                  />

                  <!-- 其他类型默认为字符串输入 -->
                  <el-input
                    v-else
                    v-model="formData[paramName]"
                    :placeholder="paramInfo.description"
                    clearable
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>

        <!-- 右侧：调用详情 -->
        <div class="right-detail-panel">
          <div class="call-detail-title">
            <h4>调用详情</h4>
          </div>
          <div class="call-detail-container">
            <CallDetail :call="lastCall" />
          </div>
        </div>
      </div>

      <!-- 执行按钮区域 -->
      <div class="tool-footer">
        <div class="footer-left">
          <span class="timeout-label">超时时间：</span>
          <el-input-number
            v-model="formData._timeout"
            :min="1"
            :max="300"
            size="small"
            style="width: 100px"
            controls-position="right"
          />
          <span class="timeout-unit">秒</span>
          <el-button @click="resetForm" size="small">重置表单</el-button>
        </div>
        <el-button
          type="primary"
          :loading="executing"
          :disabled="!tool.enabled"
          @click="handleExecute"
        >
          {{ executing ? '执行中...' : '运行工具' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { MCPTool, ToolCall } from '@/services/mcp'
import { CallDetail } from '@/components/mcp'

interface Props {
  tool?: MCPTool | null
  executing?: boolean
  lastCall?: ToolCall | null
}

interface Emits {
  (e: 'run-tool', tool: MCPTool, params: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  tool: null,
  executing: false,
  lastCall: null,
})

const emit = defineEmits<Emits>()

// 表单引用和数据
const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({
  _timeout: 30,
})

// 工具分类标签映射
const categoryLabels: Record<string, string> = {
  basic_control: '基础控制',
  chat: '聊天',
  craft_item: '合成物品',
  craft_with_recipe: '合成配方',
  mine_block: '挖掘方块',
  movement: '移动',
  mining: '挖掘',
  crafting: '合成',
  combat: '战斗',
  interaction: '交互',
  inventory: '物品栏',
  observation: '观察',
}

// 表单验证规则
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}

  if (props.tool?.inputSchema?.required) {
    props.tool.inputSchema.required.forEach((param: string) => {
      rules[param] = [{ required: true, message: `${param}为必填参数`, trigger: 'blur' }]
    })
  }

  return rules
})

// 判断参数是否必需
const isRequired = (paramName: string): boolean => {
  return props.tool?.inputSchema?.required?.includes(paramName) || false
}

// 获取分类标签
const getCategoryLabel = (category: string | undefined): string => {
  return category ? categoryLabels[category] || category : '未分类'
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }

  // 重置为默认值
  Object.keys(formData).forEach((key) => {
    if (key.startsWith('_')) return // 保留执行选项
    delete formData[key]
  })

  // 设置参数默认值
  if (props.tool?.inputSchema?.properties) {
    Object.entries(props.tool.inputSchema.properties).forEach(
      ([paramName, paramInfo]: [string, any]) => {
        if (paramInfo.default !== undefined) {
          formData[paramName] = paramInfo.default
        } else if (paramInfo.type === 'boolean') {
          formData[paramName] = false
        } else if (paramInfo.type === 'number' || paramInfo.type === 'integer') {
          formData[paramName] = undefined
        } else {
          formData[paramName] = ''
        }
      },
    )
  }
}

// 处理执行
const handleExecute = async () => {
  if (!props.tool || !formRef.value) return

  try {
    await formRef.value.validate()

    // 构建执行参数
    const params: Record<string, any> = {}

    if (props.tool.inputSchema?.properties) {
      Object.keys(props.tool.inputSchema.properties).forEach((paramName) => {
        const value = formData[paramName]
        if (value !== undefined && value !== '') {
          // 处理对象和数组类型的JSON字符串
          const paramInfo = props.tool!.inputSchema!.properties[paramName]
          if (
            (paramInfo.type === 'object' || paramInfo.type === 'array') &&
            typeof value === 'string'
          ) {
            try {
              params[paramName] = JSON.parse(value)
            } catch {
              params[paramName] = value
            }
          } else {
            params[paramName] = value
          }
        }
      })
    }

    // 添加执行选项
    params._timeout = formData._timeout

    emit('run-tool', props.tool, params)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 复制JSON参数到剪贴板
const copyJsonParams = async () => {
  if (!props.tool?.inputSchema?.properties) return

  try {
    // 获取当前有效的参数
    const validParams: Record<string, any> = {}

    Object.keys(props.tool.inputSchema.properties).forEach((paramName) => {
      const value = formData[paramName]
      if (value !== undefined && value !== '' && value !== null) {
        // 处理对象和数组类型的JSON字符串
        const paramInfo = props.tool!.inputSchema!.properties[paramName]
        if (
          (paramInfo.type === 'object' || paramInfo.type === 'array') &&
          typeof value === 'string'
        ) {
          try {
            validParams[paramName] = JSON.parse(value)
          } catch {
            validParams[paramName] = value
          }
        } else {
          validParams[paramName] = value
        }
      }
    })

    // 格式化为JSON字符串
    const jsonString = JSON.stringify(validParams, null, 2)

    // 复制到剪贴板
    await navigator.clipboard.writeText(jsonString)

    // 显示成功消息
    ElMessage.success(`参数JSON已复制到剪贴板 (${Object.keys(validParams).length}个参数)`)
  } catch (error) {
    console.error('复制JSON参数失败:', error)
    ElMessage.error('复制参数失败')
  }
}

// 监听工具变化，重置表单
watch(
  () => props.tool,
  (newTool) => {
    if (newTool) {
      resetForm()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.mcp-tool-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.tool-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-detail-content {
  flex: 1;
  display: flex;
  min-height: 0;
  gap: 24px;
  padding: 0 16px;
}

.left-detail-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.right-detail-panel {
  width: 50%;
  min-width: 500px;
  max-width: 800px;
  border-left: 2px solid #e9ecef;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
  border-radius: 8px;
  margin: -8px -16px -8px 0;
  padding: 20px 24px;
}

.call-detail-title {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6e6e6;
}

.call-detail-title h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.call-detail-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tool-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
}

.tool-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-title h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.tool-section {
  padding: 16px 24px;
  border-bottom: 1px solid #f5f5f5;
}

.parameters-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tool-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.tool-description {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.parameters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.parameters-form {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 20px 24px;
  max-height: calc(100vh - 400px);
}

.param-label {
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-word;
  white-space: normal;
  min-width: 0;
  flex-shrink: 1;
  max-width: 200px;
}

.boolean-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.boolean-description {
  color: #666;
  font-size: 14px;
}

.option-description {
  margin-left: 12px;
  color: #999;
  font-size: 12px;
}

.tool-footer {
  padding: 20px 24px;
  border-top: 1px solid #e6e6e6;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeout-label {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.timeout-unit {
  color: #999;
  font-size: 12px;
}

/* 滚动条样式 */
.parameters-form::-webkit-scrollbar {
  width: 6px;
}

.parameters-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.parameters-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.parameters-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
