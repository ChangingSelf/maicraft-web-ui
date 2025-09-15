<template>
  <div class="filter-panel">
    <div class="filter-section" v-for="filter in filters" :key="filter.key">
      <label class="filter-label">{{ filter.label }}：</label>
      <div class="filter-content">
        <!-- 全选按钮 -->
        <el-button
          v-if="filter.showSelectAll && filter.options.length > 1"
          type="text"
          size="small"
          @click="toggleAllSelection(filter)"
          class="select-all-btn"
        >
          {{ isAllSelected(filter) && !isNoneSelected(filter) ? '取消全选' : '全选' }}
        </el-button>

        <!-- 复选框组 -->
        <el-checkbox-group
          v-model="filter.selectedValues"
          @change="handleSelectionChange(filter)"
          size="small"
          class="checkbox-group"
        >
          <el-checkbox
            v-for="option in filter.options"
            :key="option.value"
            :label="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 类型定义
interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
  selectedValues: string[]
  showSelectAll?: boolean
}

// Props
const props = defineProps<{
  filters: FilterConfig[]
}>()

// Emits
const emit = defineEmits<{
  change: [filterKey: string, selectedValues: string[]]
  selectAll: [filterKey: string, selected: boolean]
}>()

// 工具方法
const isAllSelected = (filter: FilterConfig): boolean => {
  // 空数组表示全选，选择所有选项也表示全选
  return (
    filter.selectedValues.length === 0 || filter.selectedValues.length === filter.options.length
  )
}

const isNoneSelected = (filter: FilterConfig): boolean => {
  // 使用特殊字符串表示不显示任何
  return filter.selectedValues.length === 1 && filter.selectedValues[0] === '__NONE__'
}

const toggleAllSelection = (filter: FilterConfig) => {
  const isSelected = isAllSelected(filter) && !isNoneSelected(filter)
  if (isSelected) {
    // 取消全选：设置特殊值表示不显示任何
    filter.selectedValues = ['__NONE__']
  } else {
    // 全选：设置为空数组表示显示所有
    filter.selectedValues = []
  }
  handleSelectionChange(filter)
}

const handleSelectionChange = (filter: FilterConfig) => {
  emit('change', filter.key, filter.selectedValues)
}

// 暴露方法给父组件
defineExpose({
  isAllSelected,
  toggleAllSelection,
})
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.filter-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
  margin-top: 4px;
  white-space: nowrap;
}

.filter-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-all-btn {
  align-self: flex-start;
  color: #409eff;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  transition: all 0.2s;
}

.select-all-btn:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.checkbox-group :deep(.el-checkbox) {
  margin-right: 0;
}

.checkbox-group :deep(.el-checkbox__label) {
  padding-left: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .filter-label {
    min-width: auto;
    margin-top: 0;
    margin-bottom: 4px;
  }

  .checkbox-group {
    gap: 8px 12px;
  }
}
</style>
