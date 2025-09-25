<template>
  <!-- 数据网格组件，用于显示键值对数据 -->
  <div class="data-grid">
    <div v-for="item in items" :key="item.key" class="data-item">
      <div class="item-label">{{ item.label }}</div>
      <div class="item-value">{{ item.value }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义数据项接口
export interface DataGridItem {
  key: string
  label: string
  value: string
}

// 定义组件属性
interface Props {
  items: DataGridItem[]
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  columns: 1,
})
</script>

<style scoped>
.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.data-item {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.item-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.item-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>
