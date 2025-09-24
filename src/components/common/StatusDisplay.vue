<template>
  <div class="status-display" :class="size">
    <div v-for="item in items" :key="item.key" class="status-item" :class="item.class">
      <div class="status-label">{{ item.label }}</div>
      <div class="status-value" :style="item.valueStyle">{{ item.value }}</div>
      <div v-if="item.description" class="status-description">{{ item.description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StatusItem {
  key: string
  label: string
  value: string | number
  description?: string
  class?: string
  valueStyle?: Record<string, string>
}

interface Props {
  items: StatusItem[]
  size?: 'small' | 'medium' | 'large'
  columns?: number
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
  columns: 0, // 0 表示自动适应
})

defineOptions({
  name: 'StatusDisplay',
})
</script>

<style scoped>
@import '@/styles/common.css';

.status-display {
  display: grid;
  gap: 16px;
}

.status-display.small {
  gap: 12px;
}

.status-display.large {
  gap: 24px;
}

.status-display {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.status-display.small .status-item {
  padding: 12px;
}

.status-display.large .status-item {
  padding: 24px;
}

.status-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}
</style>
