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
          :model-value="getDisplaySelectedValues(filter)"
          @change="(values) => handleCheckboxChange(filter, values)"
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

// 计算实际用于显示的选中值（解决空数组全选显示问题）
const getDisplaySelectedValues = (filter: FilterConfig): string[] => {
  // 如果是空数组（表示全选），返回所有选项的值用于显示
  if (filter.selectedValues.length === 0) {
    return filter.options.map((option) => option.value)
  }
  // 如果是特殊的"不选择任何"值，返回空数组
  if (filter.selectedValues.length === 1 && filter.selectedValues[0] === '__NONE__') {
    return []
  }
  // 其他情况返回原值
  return filter.selectedValues
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

const handleCheckboxChange = (filter: FilterConfig, values: string[]) => {
  // 更新实际的选中值
  if (values.length === 0) {
    // 如果没有选中任何项，设置为特殊值表示不显示任何
    filter.selectedValues = ['__NONE__']
  } else if (values.length === filter.options.length) {
    // 如果选中了所有项，设置为空数组表示全选
    filter.selectedValues = []
  } else {
    // 选中了部分项，直接使用选中的值
    filter.selectedValues = values
  }
  emit('change', filter.key, filter.selectedValues)
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
  gap: 24px;
  align-items: flex-start;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: 500;
  color: #666;
  font-size: 13px;
  white-space: nowrap;
  min-width: 60px;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-all-btn {
  color: #409eff;
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #409eff;
  border-radius: 3px;
  background: white;
  transition: all 0.2s ease;
  height: 24px;
  line-height: 1;
}

.select-all-btn:hover {
  background-color: #409eff;
  color: white;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.checkbox-group :deep(.el-checkbox) {
  margin-right: 0;
}

.checkbox-group :deep(.el-checkbox__label) {
  padding-left: 4px;
  font-size: 12px;
}

.checkbox-group :deep(.el-checkbox__input) {
  margin-right: 4px;
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
