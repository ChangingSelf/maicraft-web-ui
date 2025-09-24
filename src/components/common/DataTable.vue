<template>
  <div class="data-table">
    <!-- 表格头部 -->
    <div v-if="showHeader" class="table-header">
      <div class="table-title">
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="description" class="table-description">{{ description }}</p>
      </div>
      <div class="table-actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div v-if="showFilters" class="table-filters">
      <el-input
        v-if="searchable"
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        :prefix-icon="Search"
        clearable
        style="width: 200px"
      />
      <slot name="filters" />
    </div>

    <!-- 表格内容 -->
    <el-table
      :data="filteredData"
      :loading="loading"
      :empty-text="emptyText"
      :height="height"
      :max-height="maxHeight"
      v-bind="$attrs"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <slot />
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination && filteredData.length > 0" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredData.length"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

interface Props {
  data: any[]
  loading?: boolean
  title?: string
  description?: string
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string[]
  showHeader?: boolean
  showFilters?: boolean
  showPagination?: boolean
  emptyText?: string
  height?: string | number
  maxHeight?: string | number
  pageSizes?: number[]
  defaultPageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: '',
  description: '',
  searchable: false,
  searchPlaceholder: '搜索...',
  searchFields: () => [],
  showHeader: true,
  showFilters: true,
  showPagination: true,
  emptyText: '暂无数据',
  height: undefined,
  maxHeight: undefined,
  pageSizes: () => [10, 20, 50, 100],
  defaultPageSize: 20,
})

const emit = defineEmits<{
  selectionChange: [selection: any[]]
  sortChange: [sortInfo: { column: any; prop: string; order: string | null }]
  currentChange: [page: number]
  sizeChange: [size: number]
}>()

// 搜索相关
const searchQuery = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)

// 过滤后的数据
const filteredData = computed(() => {
  let result = [...props.data]

  // 搜索过滤
  if (searchQuery.value && props.searchable) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((item) => {
      if (props.searchFields.length > 0) {
        return props.searchFields.some((field) => {
          const value = getNestedValue(item, field)
          return String(value).toLowerCase().includes(query)
        })
      } else {
        return Object.values(item).some((value) => String(value).toLowerCase().includes(query))
      }
    })
  }

  // 分页处理
  if (props.showPagination) {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    result = result.slice(start, end)
  }

  return result
})

// 获取嵌套属性值
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// 事件处理
const handleSelectionChange = (selection: any[]) => {
  emit('selectionChange', selection)
}

const handleSortChange = (sortInfo: { column: any; prop: string; order: string | null }) => {
  emit('sortChange', sortInfo)
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  emit('currentChange', page)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
  emit('sizeChange', size)
}

// 监听数据变化，重置分页
watch(
  () => props.data,
  () => {
    currentPage.value = 1
  },
)

defineOptions({
  name: 'DataTable',
  inheritAttrs: false,
})
</script>

<style scoped>
@import '@/styles/common.css';

.data-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.table-title h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.table-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
}

.table-pagination {
  display: flex;
  justify-content: center;
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .table-actions {
    justify-content: flex-start;
  }

  .table-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .table-pagination :deep(.el-pagination) {
    justify-content: center;
  }
}
</style>
