<template>
  <div class="mcp-tool-list">
    <!-- 工具搜索和筛选 -->
    <div class="tool-filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索工具..."
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
      <el-select
        v-model="selectedCategory"
        placeholder="选择分类"
        clearable
        @change="handleCategoryChange"
      >
        <el-option
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
        />
      </el-select>
    </div>

    <!-- 工具列表 -->
    <div class="tools-container">
      <div class="tools-header">
        <span class="tools-title">工具列表</span>
        <el-button type="text" :icon="Refresh" @click="$emit('refresh')" :loading="loading">
          刷新
        </el-button>
      </div>

      <el-scrollbar class="tools-scrollbar">
        <div class="tools-list">
          <div
            v-for="tool in filteredTools"
            :key="tool.name"
            class="tool-item"
            :class="{ active: selectedTool?.name === tool.name }"
            @click="selectTool(tool)"
          >
            <div class="tool-header">
              <div class="tool-name">{{ tool.name }}</div>
              <el-tag :type="tool.enabled ? 'success' : 'info'" size="small">
                {{ tool.enabled ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div class="tool-description">{{ tool.description }}</div>
            <div class="tool-category">
              <el-tag size="small" type="primary">
                {{ getCategoryLabel(tool.category) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-scrollbar>

      <!-- 清除按钮 -->
      <div class="tools-actions">
        <el-button type="text" @click="clearSelection" :disabled="!selectedTool">
          清除选择
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import type { MCPTool } from '@/services/mcp'

interface Props {
  tools: MCPTool[]
  loading?: boolean
  selectedTool?: MCPTool | null
}

interface Emits {
  (e: 'tool-selected', tool: MCPTool): void
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectedTool: null,
})

const emit = defineEmits<Emits>()

// 搜索和筛选状态
const searchQuery = ref('')
const selectedCategory = ref('')

// 工具分类
const categories = [
  { label: '全部', value: '' },
  { label: '基础控制', value: 'basic_control' },
  { label: '聊天', value: 'chat' },
  { label: '合成物品', value: 'craft_item' },
  { label: '合成配方', value: 'craft_with_recipe' },
  { label: '挖掘方块', value: 'mine_block' },
  { label: '移动', value: 'movement' },
  { label: '挖掘', value: 'mining' },
  { label: '合成', value: 'crafting' },
  { label: '战斗', value: 'combat' },
  { label: '交互', value: 'interaction' },
  { label: '物品栏', value: 'inventory' },
  { label: '观察', value: 'observation' },
]

// 过滤后的工具列表
const filteredTools = computed(() => {
  let filtered = props.tools

  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query),
    )
  }

  // 按分类过滤
  if (selectedCategory.value) {
    filtered = filtered.filter((tool) => tool.category === selectedCategory.value)
  }

  return filtered
})

// 获取分类标签
const getCategoryLabel = (category: string): string => {
  const categoryItem = categories.find((cat) => cat.value === category)
  return categoryItem?.label || category
}

// 选择工具
const selectTool = (tool: MCPTool) => {
  emit('tool-selected', tool)
}

// 清除选择
const clearSelection = () => {
  emit('tool-selected', null as any)
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

// 处理分类变化
const handleCategoryChange = () => {
  // 分类变化逻辑已在计算属性中处理
}
</script>

<style scoped>
.mcp-tool-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e6e6e6;
  background: #fafafa;
}

.tool-filters {
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tools-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
}

.tools-title {
  font-weight: 600;
  color: #333;
}

.tools-scrollbar {
  flex: 1;
}

.tools-list {
  padding: 8px;
}

.tool-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background: #fff;
}

.tool-item:hover {
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.tool-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.12);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tool-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.tool-description {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.tool-category {
  display: flex;
  justify-content: flex-end;
}

.tools-actions {
  padding: 12px 16px;
  border-top: 1px solid #e6e6e6;
  background: #fff;
  text-align: center;
}
</style>
