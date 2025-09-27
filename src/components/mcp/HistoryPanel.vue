<template>
  <div class="mcp-history-panel">
    <!-- 历史记录标题栏 -->
    <div class="history-header">
      <h4>历史记录</h4>
      <div class="history-actions">
        <el-button
          type="text"
          :icon="Refresh"
          @click="$emit('refresh')"
          :loading="loading"
          size="small"
        >
          刷新
        </el-button>
        <el-button type="text" :icon="Delete" @click="$emit('clear')" size="small">
          清空
        </el-button>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <el-scrollbar class="history-scrollbar">
      <div class="history-list">
        <div
          v-for="(call, index) in history"
          :key="call.call_id || index"
          class="history-item"
          @click="$emit('item-selected', call)"
        >
          <div class="history-item-header">
            <span class="call-index">{{ history.length - index }}</span>
            <span class="tool-name">{{ call.tool_name }}</span>
            <el-tag :type="getStatusType(call.status)" size="small">
              {{ call.status }}
            </el-tag>
          </div>

          <div class="history-item-content">
            <div class="call-params">
              <el-tooltip
                :content="JSON.stringify(call.parameters, null, 2)"
                placement="top"
                :disabled="!call.parameters"
              >
                <span class="params-preview">
                  {{ getParamsPreview(call.parameters) }}
                </span>
              </el-tooltip>
            </div>

            <div class="call-meta">
              <span class="execution-time">
                {{ call.execution_time ? `${call.execution_time.toFixed(2)}s` : '-' }}
              </span>
              <span class="call-time">
                {{ formatTime(call.timestamp) }}
              </span>
            </div>
          </div>

          <div v-if="call.result" class="history-item-result">
            <div class="result-preview">
              {{ getResultPreview(call.result) }}
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="history.length === 0 && !loading" class="empty-history">
          <el-empty description="暂无历史记录" :image-size="80" />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-history">
          <el-skeleton :rows="3" animated />
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Refresh, Delete } from '@element-plus/icons-vue'
import type { ToolCall } from '@/services/mcp'

interface Props {
  history: ToolCall[]
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
  (e: 'clear'): void
  (e: 'item-selected', call: ToolCall): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<Emits>()

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    success: 'success',
    error: 'danger',
    pending: 'warning',
    running: 'primary',
  }
  return typeMap[status] || 'info'
}

// 获取参数预览
const getParamsPreview = (parameters: Record<string, any>): string => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return '无参数'
  }

  const paramCount = Object.keys(parameters).length
  const firstParam = Object.entries(parameters)[0]

  if (paramCount === 1) {
    return `${firstParam[0]}: ${JSON.stringify(firstParam[1])}`
  } else {
    return `${firstParam[0]}: ${JSON.stringify(firstParam[1])} (+${paramCount - 1})`
  }
}

// 获取结果预览
const getResultPreview = (result: any): string => {
  if (!result) return '无结果'

  if (result.content && Array.isArray(result.content)) {
    const textContent = result.content.find((c: any) => c.type === 'text')
    if (textContent) {
      return textContent.text.slice(0, 50) + (textContent.text.length > 50 ? '...' : '')
    }
  }

  if (result.is_error) {
    return '执行出错'
  }

  return '执行完成'
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) {
    // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style scoped>
.mcp-history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e6e6e6;
  background: #fafafa;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
}

.history-header h4 {
  margin: 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.history-scrollbar {
  flex: 1;
}

.history-list {
  padding: 8px;
}

.history-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  border: 1px solid #f0f0f0;
}

.history-item:hover {
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.history-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.call-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.tool-name {
  font-weight: 600;
  color: #333;
  font-size: 13px;
  flex: 1;
}

.history-item-content {
  margin-bottom: 8px;
}

.call-params {
  margin-bottom: 4px;
}

.params-preview {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #666;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.call-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #999;
}

.execution-time {
  font-weight: 600;
}

.history-item-result {
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.result-preview {
  font-size: 11px;
  color: #666;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-history,
.loading-history {
  padding: 40px 20px;
  text-align: center;
}

/* 滚动条样式 */
.history-scrollbar :deep(.el-scrollbar__bar) {
  opacity: 0.6;
}

.history-scrollbar :deep(.el-scrollbar__thumb) {
  background-color: #c1c1c1;
}
</style>
