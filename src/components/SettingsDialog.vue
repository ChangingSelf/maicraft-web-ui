<template>
  <el-dialog v-model="visible" :title="title" width="400px" @close="handleCancel">
    <div class="settings-form">
      <el-form :model="formData" label-width="120px" ref="formRef">
        <el-form-item
          v-for="setting in settings"
          :key="setting.key"
          :label="setting.label"
          :prop="setting.key"
          :rules="setting.rules"
        >
          <!-- 输入框 -->
          <el-input
            v-if="setting.type === 'input'"
            v-model="formData[setting.key]"
            :placeholder="setting.placeholder"
            :disabled="setting.disabled"
          />

          <!-- 数字输入框 -->
          <el-input-number
            v-else-if="setting.type === 'number'"
            v-model="formData[setting.key]"
            :min="setting.min"
            :max="setting.max"
            :step="setting.step"
            :disabled="setting.disabled"
          />

          <!-- 开关 -->
          <el-switch
            v-else-if="setting.type === 'switch'"
            v-model="formData[setting.key]"
            :disabled="setting.disabled"
          />

          <!-- 选择器 -->
          <el-select
            v-else-if="setting.type === 'select'"
            v-model="formData[setting.key]"
            :placeholder="setting.placeholder"
            :disabled="setting.disabled"
          >
            <el-option
              v-for="option in setting.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <!-- 日期时间选择器 -->
          <el-date-picker
            v-else-if="setting.type === 'datetime'"
            v-model="formData[setting.key]"
            type="datetime"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="x"
            :placeholder="setting.placeholder"
            :disabled="setting.disabled"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading"> 应用 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'

// 类型定义
interface SettingOption {
  value: any
  label: string
}

interface SettingConfig {
  key: string
  label: string
  type: 'input' | 'number' | 'switch' | 'select' | 'datetime'
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  options?: SettingOption[]
  rules?: any[]
}

// Props
const props = defineProps<{
  modelValue: boolean
  title?: string
  settings: SettingConfig[]
  initialData?: Record<string, any>
  loading?: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [data: Record<string, any>]
  cancel: []
}>()

// 响应式数据
const visible = ref(false)
const formData = ref<Record<string, any>>({})
const formRef = ref<FormInstance>()

// 监听外部visible变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal) {
      // 打开对话框时初始化表单数据
      formData.value = { ...props.initialData }
    }
  },
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 事件处理
const handleConfirm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    emit('confirm', { ...formData.value })
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}

// 暴露方法给父组件
defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
})
</script>

<style scoped>
.settings-form {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
