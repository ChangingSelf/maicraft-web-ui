<template>
  <div class="call-detail" :class="{ compact: compact }">
    <div v-if="call" class="call-wrapper">
      <!-- 调用基本信息 -->
      <div class="call-header">
        <div class="call-info-row">
          <div class="info-item">
            <span class="label">工具名称:</span>
            <span class="value tool-name">{{ call.tool_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态:</span>
            <el-tag :type="getStatusType(call.status) as any" size="small">
              {{ getStatusText(call.status) }}
            </el-tag>
          </div>
        </div>

        <div v-if="!compact" class="call-info-row">
          <div class="info-item">
            <span class="label">调用ID:</span>
            <span class="value call-id">{{ call.call_id }}</span>
          </div>
          <div class="info-item">
            <span class="label">执行时间:</span>
            <span class="value">
              {{ call.execution_time ? `${call.execution_time.toFixed(2)}s` : '-' }}
            </span>
          </div>
        </div>

        <div v-if="!compact" class="call-info-row">
          <div class="info-item full-width">
            <span class="label">调用时间:</span>
            <span class="value">{{ formatTimestamp(call.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- 调用参数 -->
      <div class="call-section">
        <div class="section-header">
          <h5>调用参数</h5>
          <el-button
            v-if="!compact"
            size="small"
            type="primary"
            text
            @click="copyToClipboard(JSON.stringify(call.parameters, null, 2))"
          >
            复制参数
          </el-button>
        </div>
        <div class="code-container">
          <pre><code ref="parametersRef" class="json">{{ JSON.stringify(call.parameters, null, 2) }}</code></pre>
        </div>
      </div>

      <!-- 调用结果 -->
      <div v-if="call.result" class="call-section">
        <div class="section-header">
          <h5>调用结果</h5>
          <div class="result-actions" v-if="!compact">
            <el-tag
              :type="(call.result.is_error ? 'danger' : 'success') as any"
              size="small"
              class="result-status"
            >
              {{ call.result.is_error ? '执行失败' : '执行成功' }}
            </el-tag>
            <el-button
              size="small"
              type="primary"
              text
              @click="copyToClipboard(formatResultForCopy(call.result))"
            >
              复制结果
            </el-button>
          </div>
        </div>

        <!-- 结果内容：优先显示结构化数据 -->
        <div v-if="call.result.content && call.result.content.length > 0" class="result-content">
          <!-- 首先显示非文本类型的结构化数据 -->
          <div
            v-for="(content, index) in structuredContent"
            :key="`structured-${index}`"
            class="result-item priority-item"
          >
            <div class="json-result">
              <div class="result-type-label">{{ getContentTypeLabel(content.type) }}</div>
              <div class="code-container">
                <pre><code ref="jsonResultRefs" class="json">{{ JSON.stringify(content, null, 2) }}</code></pre>
              </div>
            </div>
          </div>

          <!-- 然后显示文本内容 -->
          <div v-for="(content, index) in textContent" :key="`text-${index}`" class="result-item">
            <div class="text-result">
              <div class="result-type-label">{{ getTextResultLabel(content.text) }}</div>
              <div class="code-container">
                <!-- 尝试解析JSON，如果是JSON则高亮显示 -->
                <pre
                  v-if="isValidJSON(content.text)"
                ><code ref="textResultRefs" class="json">{{ formatJSON(content.text) }}</code></pre>
                <pre
                  v-else
                ><code ref="textResultRefs" class="plaintext">{{ content.text }}</code></pre>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-result-content">
          <el-empty description="无结果内容" :image-size="60" />
        </div>

        <!-- 附加数据（仅在与content不重复时显示） -->
        <div v-if="call.result.data && !compact && !isDataDuplicate" class="additional-data">
          <div class="section-header">
            <h6>附加数据</h6>
          </div>
          <div class="code-container">
            <pre><code ref="additionalDataRef" class="json">{{ JSON.stringify(call.result.data, null, 2) }}</code></pre>
          </div>
        </div>

        <!-- 调试信息（开发环境显示） -->
        <div v-if="!compact && isDev" class="debug-info">
          <div class="section-header">
            <h6>调试信息</h6>
          </div>
          <div class="debug-content">
            <p><strong>Content长度:</strong> {{ call.result.content?.length || 0 }}</p>
            <p><strong>是否有Data:</strong> {{ !!call.result.data }}</p>
            <p><strong>Data是否重复:</strong> {{ isDataDuplicate }}</p>
            <details v-if="call.result.data">
              <summary>原始Data内容</summary>
              <div class="code-container">
                <pre><code class="json">{{ JSON.stringify(call.result.data, null, 2) }}</code></pre>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- 无结果状态 -->
      <div v-else class="no-result">
        <el-empty description="暂无执行结果" :image-size="80" />
      </div>
    </div>

    <!-- 无调用数据状态 -->
    <div v-else class="no-call">
      <el-empty
        :description="compact ? '无调用数据' : '请选择一个工具查看调用详情'"
        :image-size="compact ? 60 : 100"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, computed } from 'vue'
import { ElTag, ElButton, ElEmpty, ElMessage } from 'element-plus'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import plaintext from 'highlight.js/lib/languages/plaintext'
import 'highlight.js/styles/github.css'
import type { ToolCall } from '@/services/mcp'

// 注册需要的语言
hljs.registerLanguage('json', json)
hljs.registerLanguage('plaintext', plaintext)

interface Props {
  call?: ToolCall | null
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  call: null,
  compact: false,
})

// 模板引用
const parametersRef = ref<HTMLElement>()
const textResultRefs = ref<HTMLElement[]>([])
const jsonResultRefs = ref<HTMLElement[]>([])
const additionalDataRef = ref<HTMLElement>()

// 状态类型映射
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    success: 'success',
    error: 'danger',
    pending: 'warning',
  }
  return typeMap[status] || 'info'
}

// 状态文本映射
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    success: '成功',
    error: '失败',
    pending: '进行中',
  }
  return textMap[status] || status
}

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 格式化结果用于复制
const formatResultForCopy = (result: any) => {
  return JSON.stringify(result, null, 2)
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
    console.error('复制失败:', error)
  }
}

// 检查附加数据是否与content重复
const isDataDuplicate = computed(() => {
  if (!props.call?.result?.data || !props.call?.result?.content) {
    return false
  }

  // 将content转换为字符串进行比较
  const contentStr = props.call.result.content
    .map((item) => {
      if (item.type === 'text') {
        return item.text
      } else {
        return JSON.stringify(item)
      }
    })
    .join('')

  const dataStr = JSON.stringify(props.call.result.data)

  // 检查data是否已经包含在content中
  return contentStr.includes(dataStr) || dataStr.includes(contentStr)
})

// 检查字符串是否为有效JSON
const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// 格式化JSON字符串
const formatJSON = (str: string): string => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

// 获取内容类型标签
const getContentTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    text: '文本结果',
    json: 'JSON数据',
    object: '对象数据',
    array: '数组数据',
    error: '错误信息',
    success: '成功信息',
  }
  return typeLabels[type] || `${type}数据`
}

// 检查是否为开发环境
const isDev = computed(() => {
  return import.meta.env.DEV
})

// 分离结构化数据和文本数据
const structuredContent = computed(() => {
  if (!props.call?.result?.content) return []
  return props.call.result.content.filter((item) => item.type !== 'text')
})

const textContent = computed(() => {
  if (!props.call?.result?.content) return []
  return props.call.result.content.filter((item) => item.type === 'text')
})

// 获取文本结果标签（根据内容智能判断）
const getTextResultLabel = (text: string): string => {
  if (isValidJSON(text)) {
    return 'JSON数据'
  }
  if (text.length > 200) {
    return '详细结果'
  }
  return '文本结果'
}

// 应用语法高亮
const applyHighlight = () => {
  nextTick(() => {
    // 高亮参数
    if (parametersRef.value) {
      hljs.highlightElement(parametersRef.value)
    }

    // 高亮文本结果
    if (textResultRefs.value) {
      textResultRefs.value.forEach((el) => {
        if (el) hljs.highlightElement(el)
      })
    }

    // 高亮JSON结果
    if (jsonResultRefs.value) {
      jsonResultRefs.value.forEach((el) => {
        if (el) hljs.highlightElement(el)
      })
    }

    // 高亮附加数据
    if (additionalDataRef.value) {
      hljs.highlightElement(additionalDataRef.value)
    }
  })
}

// 监听调用数据变化
watch(
  () => props.call,
  () => {
    applyHighlight()
  },
  { immediate: true },
)

onMounted(() => {
  applyHighlight()
})
</script>

<style scoped>
.call-detail {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.call-detail.compact {
  padding: 12px;
}

.call-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 调用头部信息 */
.call-header {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.call-info-row {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.call-info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.info-item.full-width {
  flex: none;
  width: 100%;
}

.label {
  color: #6c757d;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.value {
  color: #495057;
  font-size: 14px;
  word-break: break-all;
}

.tool-name {
  font-weight: 600;
  color: #0d6efd;
}

.call-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #6c757d;
}

/* 调用节 */
.call-section {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.section-header h5 {
  margin: 0;
  color: #495057;
  font-size: 15px;
  font-weight: 600;
}

.section-header h6 {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-status {
  margin-right: 8px;
}

/* 代码容器 */
.code-container {
  background: #f8f9fa;
  border-radius: 6px;
  overflow: hidden;
}

.code-container pre {
  margin: 0;
  padding: 16px;
  background: none;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.code-container code {
  background: none !important;
  padding: 0 !important;
}

/* 结果内容 */
.result-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.result-item.priority-item {
  border: 2px solid #0d6efd;
  box-shadow: 0 2px 4px rgba(13, 110, 253, 0.1);
  margin-bottom: 20px;
}

.result-type-label {
  padding: 8px 12px;
  background: #e9ecef;
  color: #495057;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-item .result-type-label {
  background: #0d6efd;
  color: #ffffff;
}

.text-result .code-container,
.json-result .code-container {
  border-top: 1px solid #e9ecef;
}

/* 无内容状态 */
.no-result-content,
.no-result,
.no-call {
  padding: 40px 20px;
  text-align: center;
}

.additional-data {
  margin-top: 16px;
  border-top: 1px solid #e9ecef;
  padding-top: 16px;
}

/* 调试信息样式 */
.debug-info {
  margin-top: 16px;
  border-top: 2px solid #ffc107;
  padding-top: 16px;
  background: #fff8dc;
  border-radius: 4px;
  padding: 12px;
}

.debug-content {
  font-size: 12px;
  color: #6c757d;
}

.debug-content p {
  margin: 4px 0;
}

.debug-content details {
  margin-top: 8px;
}

.debug-content summary {
  cursor: pointer;
  font-weight: 600;
  color: #495057;
}

/* 紧凑模式样式调整 */
.compact .call-header {
  padding: 12px;
}

.compact .call-info-row {
  margin-bottom: 8px;
}

.compact .section-header {
  padding: 8px 12px;
}

.compact .result-content {
  padding: 12px;
  gap: 12px;
}

.compact .code-container pre {
  padding: 12px;
  font-size: 12px;
}

/* 滚动条样式 */
.call-detail::-webkit-scrollbar {
  width: 6px;
}

.call-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.call-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.call-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .call-info-row {
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .result-actions {
    width: 100%;
    justify-content: space-between;
  }

  .code-container pre {
    font-size: 12px;
    padding: 12px;
  }
}
</style>
