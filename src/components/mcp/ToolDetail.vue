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
        <h4>参数配置</h4>
        <div class="parameters-form">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="120px"
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
                  <el-tag v-if="isRequired(paramName)" size="small" type="warning"> 必需 </el-tag>
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

              <div v-if="paramInfo.description" class="param-description">
                {{ paramInfo.description }}
              </div>
            </el-form-item>

            <!-- 执行选项 -->
            <el-divider content-position="left">执行选项</el-divider>

            <el-form-item label="异步执行">
              <el-switch v-model="formData._async" />
              <span class="option-description">启用后工具将在后台异步执行</span>
            </el-form-item>

            <el-form-item label="超时时间">
              <el-input-number
                v-model="formData._timeout"
                :min="1"
                :max="300"
                style="width: 200px"
                controls-position="right"
              />
              <span class="option-description">秒</span>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 执行按钮区域 -->
      <div class="tool-footer">
        <el-button @click="resetForm">重置表单</el-button>
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
import type { FormInstance, FormRules } from 'element-plus'
import type { MCPTool } from '@/services/mcp'

interface Props {
  tool?: MCPTool | null
  executing?: boolean
}

interface Emits {
  (e: 'run-tool', tool: MCPTool, params: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  tool: null,
  executing: false,
})

const emit = defineEmits<Emits>()

// 表单引用和数据
const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({
  _async: false,
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
const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
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
    params._async = formData._async
    params._timeout = formData._timeout

    emit('run-tool', props.tool, params)
  } catch (error) {
    console.error('表单验证失败:', error)
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

.parameters-form {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 20px 24px;
  max-height: calc(100vh - 300px);
}

.param-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-description {
  margin-top: 4px;
  color: #999;
  font-size: 12px;
  line-height: 1.4;
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
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
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
