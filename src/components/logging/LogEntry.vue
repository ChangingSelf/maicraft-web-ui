<template>
  <div class="log-entry" :class="[getLogClass(log.level), { 'log-merged': log.merged }]">
    <!-- 展开/收起按钮 -->
    <div class="log-expand-btn">
      <el-button
        v-if="log.message.length > 200"
        :type="expanded ? 'primary' : 'info'"
        size="small"
        @click="$emit('toggleExpand')"
        :icon="expanded ? ArrowUp : ArrowDown"
        class="expand-toggle-btn"
        circle
      />
      <div v-else class="expand-placeholder"></div>
    </div>

    <div class="log-content">
      <div class="log-time">
        {{ formatTime(log.merged ? log.lastTimestamp! : log.timestamp) }}
      </div>
      <div class="log-level" :class="`level-${log.level.toLowerCase()}`">
        {{ log.level }}
        <span v-if="log.merged" class="merge-count">×{{ log.count }}</span>
      </div>
      <div class="log-module">{{ log.module }}</div>
      <div class="log-message">
        <span v-if="log.message.length > 200 && !expanded" class="message-preview">
          {{ truncateMessage(log.message) }}
        </span>
        <span v-else-if="log.message.length > 200 && expanded" class="message-expanded">
          <span class="message-full">{{ log.message }}</span>
        </span>
        <span v-else class="message-normal">{{ log.message }}</span>
        <span v-if="log.merged" class="merge-indicator">
          (合并显示，最后更新: {{ formatTime(log.lastTimestamp!) }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'

// Props定义
interface LogEntry {
  timestamp: number
  level: string
  module: string
  message: string
  count?: number
  lastTimestamp?: number
  merged?: boolean
}

interface Props {
  log: LogEntry
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
})

// 定义组件名称
defineOptions({
  name: 'LogEntry',
})

// 工具函数
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const timeString = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  return `${timeString}.${milliseconds}`
}

const getLogClass = (level: string): string => {
  return `log-${level.toLowerCase()}`
}

const truncateMessage = (message: string): string => {
  if (message.length <= 200) return message
  return message.substring(0, 200) + '...'
}

// 事件定义
defineEmits<{
  toggleExpand: []
}>()
</script>

<style scoped>
.log-entry {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  margin-bottom: 2px;
  border-radius: 4px;
  transition: background-color 0.2s;
  gap: 8px;
}

.log-entry:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.log-expand-btn {
  flex-shrink: 0;
  margin-top: 2px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-placeholder {
  width: 28px;
  height: 28px;
}

.expand-toggle-btn {
  opacity: 0.7;
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.expand-toggle-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.log-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.log-time {
  color: #999;
  font-size: 12px;
  min-width: 160px;
  margin-right: 12px;
}

.log-level {
  font-weight: bold;
  min-width: 80px;
  margin-right: 12px;
  text-align: center;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 12px;
}

.level-trace {
  background-color: #f0f0f0;
  color: #666;
}

.level-debug {
  background-color: #e6f7ff;
  color: #1890ff;
}

.level-info {
  background-color: #f6ffed;
  color: #52c41a;
}

.level-success {
  background-color: #f6ffed;
  color: #52c41a;
}

.level-warning {
  background-color: #fffbe6;
  color: #faad14;
}

.level-error {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.level-critical {
  background-color: #ffe6e6;
  color: #cf1322;
}

.log-module {
  color: #666;
  min-width: 100px;
  margin-right: 12px;
  font-weight: 500;
}

.log-message {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-preview,
.message-full,
.message-normal,
.message-expanded {
  white-space: pre-wrap;
  word-break: break-word;
}

.log-trace {
  border-left: 3px solid #d9d9d9;
}

.log-debug {
  border-left: 3px solid #1890ff;
}

.log-info {
  border-left: 3px solid #52c41a;
}

.log-success {
  border-left: 3px solid #52c41a;
}

.log-warning {
  border-left: 3px solid #faad14;
}

.log-error {
  border-left: 3px solid #ff4d4f;
}

.log-critical {
  border-left: 3px solid #cf1322;
}

.log-merged {
  border-left: 3px solid #722ed1;
  background-color: rgba(114, 46, 209, 0.05);
}

.merge-count {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 1px 4px;
  font-size: 10px;
  margin-left: 4px;
  font-weight: bold;
}

.merge-indicator {
  color: #722ed1;
  font-size: 11px;
  margin-left: 8px;
  font-style: italic;
}
</style>
