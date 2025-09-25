<template>
  <!-- 进度条卡片组件，用于显示带有进度条的数值信息 -->
  <div class="progress-card">
    <div class="progress-header">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-text" v-if="!showLevel">{{ currentValue }}/{{ maxValue }}</span>
      <span class="progress-text" v-else>Lv.{{ level }}</span>
    </div>
    <el-progress
      :percentage="percentage"
      :stroke-width="strokeWidth"
      :color="progressColor"
      :show-text="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义组件属性
interface Props {
  label: string
  currentValue: number
  maxValue: number
  strokeWidth?: number
  color?: string
  showLevel?: boolean
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  strokeWidth: 12,
  color: undefined,
  showLevel: false,
  level: 0,
})

// 计算进度百分比
const percentage = computed(() => {
  if (!props.maxValue) return 0
  return Math.min((props.currentValue / props.maxValue) * 100, 100)
})

// 计算进度条颜色
const progressColor = computed(() => {
  if (props.color) return props.color

  const percentageValue = percentage.value
  if (percentageValue > 60) return '#67C23A'
  if (percentageValue > 30) return '#E6A23C'
  return '#F56C6C'
})
</script>

<style scoped>
.progress-card {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.progress-label {
  font-size: 14px;
}

.progress-text {
  font-size: 14px;
  color: #666;
}
</style>
