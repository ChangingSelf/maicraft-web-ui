<template>
  <div class="mcp-tool-list">
    <!-- 工具搜索 -->
    <div class="tool-filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索工具..."
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
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
          </div>

          <!-- 空状态 -->
          <div v-if="filteredTools.length === 0 && !loading" class="tools-empty-state">
            <EmptyState
              :title="searchQuery ? '未找到匹配的工具' : '暂无工具'"
              :description="searchQuery ? '请尝试调整搜索关键词' : '请检查MCP服务连接状态'"
              size="medium"
            >
              <template #actions>
                <el-button v-if="!searchQuery" type="primary" @click="$emit('refresh')">
                  刷新
                </el-button>
                <el-button v-else @click="clearSearch"> 清除搜索 </el-button>
              </template>
            </EmptyState>
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
import EmptyState from '@/components/common/EmptyState.vue'
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

// 搜索状态
const searchQuery = ref('')

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

  return filtered
})

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

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
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

.tools-empty-state {
  padding: 20px 16px;
}

.tools-actions {
  padding: 12px 16px;
  border-top: 1px solid #e6e6e6;
  background: #fff;
  text-align: center;
}
</style>
