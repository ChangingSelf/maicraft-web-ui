<template>
  <el-dialog v-model="modelValue" title="连接设置" width="400px" @close="$emit('close')">
    <div class="settings-form">
      <el-form :model="settings" label-width="100px">
        <el-form-item label="WebSocket地址">
          <el-input v-model="settings.wsUrl" :placeholder="defaultWsUrl" />
        </el-form-item>
        <el-form-item label="自动滚动">
          <el-switch v-model="settings.autoScroll" />
        </el-form-item>
        <el-form-item label="最大显示条数">
          <el-input-number v-model="settings.maxLogs" :min="100" :max="10000" :step="100" />
        </el-form-item>
        <el-form-item label="启用日志合并">
          <el-switch v-model="settings.enableLogMerge" />
        </el-form-item>
        <el-form-item label="合并间隔(毫秒)">
          <el-input-number
            v-model="settings.mergeInterval"
            :min="100"
            :max="10000"
            :step="100"
            :disabled="!settings.enableLogMerge"
          />
        </el-form-item>
        <el-form-item label="启用频率限制">
          <el-switch v-model="settings.enableRateLimit" />
        </el-form-item>
        <el-form-item label="每秒最大日志数">
          <el-input-number
            v-model="settings.rateLimitPerSecond"
            :min="1"
            :max="1000"
            :step="1"
            :disabled="!settings.enableRateLimit"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleApply">应用</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// Props定义
interface Settings {
  wsUrl: string
  autoScroll: boolean
  maxLogs: number
  enableLogMerge: boolean
  mergeInterval: number
  enableRateLimit: boolean
  rateLimitPerSecond: number
}

interface Props {
  modelValue: boolean
  settings: Settings
  defaultWsUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultWsUrl: 'ws://localhost:20914/ws/logs',
})

// 定义组件名称
defineOptions({
  name: 'LogSettings',
})

// 事件定义
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [settings: Settings]
  'close': []
}>()

// 计算属性
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 事件处理
const handleCancel = () => {
  emit('close')
}

const handleApply = () => {
  emit('apply', { ...props.settings })
}
</script>

<style scoped>
.settings-form {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
