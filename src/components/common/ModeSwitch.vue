<template>
  <div class="mode-switch-container">
    <span class="mode-label">{{ currentModeText }}</span>
    <el-switch
      :model-value="modelValue"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :disabled="disabled"
      :loading="loading"
      @change="handleChange"
    />
    <span v-if="showStatus" class="mode-status" :class="statusClass">
      {{ statusText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  activeText?: string
  inactiveText?: string
  activeColor?: string
  inactiveColor?: string
  disabled?: boolean
  loading?: boolean
  showStatus?: boolean
  activeLabel?: string
  inactiveLabel?: string
  statusText?: string
}

const props = withDefaults(defineProps<Props>(), {
  activeText: '开',
  inactiveText: '关',
  activeColor: '#67c23a',
  inactiveColor: '#409eff',
  disabled: false,
  loading: false,
  showStatus: false,
  activeLabel: '已启用',
  inactiveLabel: '已禁用',
  statusText: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const currentModeText = computed(() => {
  return props.modelValue ? props.activeLabel : props.inactiveLabel
})

const statusClass = computed(() => {
  return {
    'status-active': props.modelValue,
    'status-inactive': !props.modelValue,
  }
})

const handleChange = (value: boolean) => {
  emit('update:modelValue', value)
  emit('change', value)
}

defineOptions({
  name: 'ModeSwitch',
})
</script>

<style scoped>
@import '@/styles/common.css';

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
  font-size: 14px;
}

.mode-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-active {
  background: #f0f9ff;
  color: #67c23a;
  border: 1px solid #67c23a;
}

.status-inactive {
  background: #f5f5f5;
  color: #909399;
  border: 1px solid #dcdfe6;
}

@media (max-width: 768px) {
  .mode-switch-container {
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
  }

  .mode-label {
    text-align: center;
    min-width: auto;
  }
}
</style>
