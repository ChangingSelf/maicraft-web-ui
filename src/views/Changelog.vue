<template>
  <div class="changelog-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><InfoFilled /></el-icon>
        版本信息与更新日志
      </h1>
      <div class="version-info">
        <el-tag type="primary" size="large">当前版本: {{ currentVersion }}</el-tag>
        <el-tag type="info" size="small">最后更新: {{ lastUpdated }}</el-tag>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 当前版本卡片 -->
      <el-card class="current-version-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><Star /></el-icon>
            <span>当前版本详情</span>
          </div>
        </template>
        <div class="version-details">
          <div class="version-meta">
            <div class="meta-item">
              <span class="label">版本号:</span>
              <span class="value">{{ currentVersion }}</span>
            </div>
            <div class="meta-item">
              <span class="label">发布日期:</span>
              <span class="value">{{ currentVersionDate }}</span>
            </div>
            <div class="meta-item">
              <span class="label">构建环境:</span>
              <span class="value">{{ buildInfo }}</span>
            </div>
          </div>
          <div class="version-description">
            <h3>主要特性</h3>
            <ul>
              <li>🎮 完整的 Minecraft 服务器监控界面</li>
              <li>📊 实时日志查看和过滤</li>
              <li>🔧 MCP 协议集成支持</li>
              <li>📈 玩家状态和世界信息监控</li>
              <li>🎨 现代化的响应式设计</li>
            </ul>
          </div>
        </div>
      </el-card>

      <!-- 更新日志 -->
      <el-card class="changelog-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><DocumentChecked /></el-icon>
            <span>更新日志</span>
            <el-button
              type="primary"
              size="small"
              @click="refreshChangelog"
              :loading="loading"
              class="refresh-btn"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="info" size="small" @click="checkForUpdates" class="update-btn">
              <el-icon><InfoFilled /></el-icon>
              检查更新
            </el-button>
          </div>
        </template>

        <div v-if="loading" class="loading-container">
          <el-skeleton :loading="loading" animated :count="3" :rows="4" :throttle="500" />
        </div>

        <div v-else-if="changelogContent" class="changelog-content">
          <div class="changelog-markdown" v-html="parsedChangelog"></div>

          <!-- 版本分析面板 -->
          <div class="version-analysis" v-if="versionAnalysis">
            <el-divider>📊 版本分析</el-divider>
            <div class="analysis-grid">
              <div class="analysis-item">
                <div class="analysis-label">总版本数</div>
                <div class="analysis-value">{{ versionAnalysis.totalVersions }}</div>
              </div>
              <div class="analysis-item">
                <div class="analysis-label">平均变更数</div>
                <div class="analysis-value">{{ versionAnalysis.avgChangesPerVersion }}</div>
              </div>
              <div class="analysis-item">
                <div class="analysis-label">最常变更类型</div>
                <div class="analysis-value">
                  {{ getCommitTypeLabel(versionAnalysis.mostCommonChangeType) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-content">
          <el-empty description="无法加载更新日志内容">
            <el-button @click="refreshChangelog">重试</el-button>
          </el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { InfoFilled, Star, DocumentChecked, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import markdownItHighlightjs from 'markdown-it-highlightjs'
import markdownItAnchor from 'markdown-it-anchor'
import hljs from 'highlight.js'
import {
  versionService,
  getCurrentVersion,
  getVersionInfo,
  formatVersion,
  formatDate,
  analyzeVersionTrends,
} from '../services/versionService'

// 配置markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})
  .use(markdownItHighlightjs, {
    hljs,
    auto: true,
    code: true,
  })
  .use(markdownItAnchor, {
    permalink: true,
    permalinkBefore: true,
    permalinkSymbol: '§',
  })

// 响应式数据
const loading = ref(false)
const changelogContent = ref('')
const versionInfo = ref(getVersionInfo())
const versionAnalysis = ref(analyzeVersionTrends())

// 计算属性
const currentVersion = computed(() => formatVersion(versionInfo.value.version))
const lastUpdated = computed(() => versionInfo.value.lastUpdated)
const currentVersionDate = computed(() => formatDate(versionInfo.value.buildDate))
const buildInfo = computed(() => versionInfo.value.buildInfo)

// 解析后的更新日志HTML
const parsedChangelog = computed(() => {
  if (!changelogContent.value) return ''

  try {
    return md.render(changelogContent.value)
  } catch (error) {
    console.error('Markdown解析错误:', error)
    ElMessage.error('Markdown解析失败')
    return '<p>Markdown解析失败，请检查内容格式</p>'
  }
})

// 获取更新日志内容
const fetchChangelog = async () => {
  try {
    loading.value = true
    const response = await fetch('/CHANGELOG.md')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const content = await response.text()
    changelogContent.value = content
  } catch (error) {
    console.error('获取更新日志失败:', error)
    ElMessage.error('获取更新日志失败，请稍后重试')
    changelogContent.value = ''
  } finally {
    loading.value = false
  }
}

// 获取提交类型的显示标签
const getCommitTypeLabel = (type: string | null) => {
  if (!type) return '无'

  const labels: Record<string, string> = {
    feat: '新功能',
    fix: '修复',
    docs: '文档',
    style: '样式',
    refactor: '重构',
    perf: '性能',
    test: '测试',
    chore: '构建',
    ci: 'CI',
    build: '构建',
  }

  return labels[type] || type
}

// 刷新更新日志
const refreshChangelog = () => {
  fetchChangelog()
  // 重新获取版本信息
  versionInfo.value = getVersionInfo()
  versionAnalysis.value = analyzeVersionTrends()
}

// 检查版本更新
const checkForUpdates = async () => {
  try {
    const updateInfo = await versionService.checkForUpdates()
    if (updateInfo.hasUpdate) {
      ElMessage.info(`发现新版本 ${formatVersion(updateInfo.latestVersion!)}，请及时更新`)
    } else {
      ElMessage.success('当前已是最新版本')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    ElMessage.warning('检查更新失败')
  }
}

// 组件挂载时获取更新日志
onMounted(() => {
  fetchChangelog()
})
</script>

<style scoped>
.changelog-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.title-icon {
  font-size: 32px;
  color: #409eff;
}

.version-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.current-version-card,
.changelog-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.card-icon {
  font-size: 18px;
  color: #409eff;
}

.refresh-btn {
  margin-left: auto;
}

.update-btn {
  margin-left: 8px;
}

.version-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.version-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.value {
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.version-description h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
}

.version-description ul {
  margin: 0;
  padding-left: 20px;
}

.version-description li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.loading-container {
  padding: 20px;
}

.no-content {
  padding: 40px;
  text-align: center;
}

.changelog-content {
  max-height: 600px;
  overflow-y: auto;
}

/* Markdown 样式 */
.changelog-markdown {
  line-height: 1.6;
  color: #333;
}

.changelog-markdown h1,
.changelog-markdown h2,
.changelog-markdown h3,
.changelog-markdown h4,
.changelog-markdown h5,
.changelog-markdown h6 {
  margin-top: 24px;
  margin-bottom: 12px;
  color: #333;
  font-weight: 600;
  position: relative;
}

.changelog-markdown h1 {
  font-size: 24px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.changelog-markdown h2 {
  font-size: 20px;
  border-bottom: 1px solid #e6e6e6;
  padding-bottom: 6px;
}

.changelog-markdown h3 {
  font-size: 18px;
  color: #409eff;
}

.changelog-markdown h4 {
  font-size: 16px;
  color: #666;
}

.changelog-markdown p {
  margin-bottom: 12px;
  line-height: 1.7;
}

.changelog-markdown ul,
.changelog-markdown ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.changelog-markdown li {
  margin-bottom: 6px;
  line-height: 1.6;
}

.changelog-markdown li > p {
  margin-bottom: 6px;
}

.changelog-markdown code {
  background-color: #f6f8fa;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #d73a49;
  border: 1px solid #e1e4e8;
}

.changelog-markdown pre {
  background-color: #f6f8fa;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid #e1e4e8;
  position: relative;
}

.changelog-markdown pre code {
  background-color: transparent;
  padding: 0;
  color: inherit;
  border: none;
  font-size: 14px;
  line-height: 1.45;
}

/* 代码块语法高亮 */
.changelog-markdown pre.hljs {
  background-color: #2d3748;
  color: #e2e8f0;
  border: none;
}

.changelog-markdown pre.hljs code {
  color: inherit;
}

.changelog-markdown a {
  color: #409eff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.changelog-markdown a:hover {
  text-decoration: underline;
  color: #66b1ff;
}

.changelog-markdown blockquote {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 16px 0;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
  margin-left: 0;
}

.changelog-markdown blockquote p {
  margin-bottom: 0;
  font-style: italic;
  color: #555;
}

/* 表格样式 */
.changelog-markdown table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  background-color: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  overflow: hidden;
}

.changelog-markdown thead {
  background-color: #f6f8fa;
}

.changelog-markdown th,
.changelog-markdown td {
  border: 1px solid #e1e4e8;
  padding: 8px 12px;
  text-align: left;
}

.changelog-markdown th {
  font-weight: 600;
  color: #333;
}

.changelog-markdown tbody tr:hover {
  background-color: #f8f9fa;
}

/* 标题锚点样式 */
.changelog-markdown .header-anchor {
  color: #409eff;
  text-decoration: none;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 14px;
}

.changelog-markdown h1:hover .header-anchor,
.changelog-markdown h2:hover .header-anchor,
.changelog-markdown h3:hover .header-anchor,
.changelog-markdown h4:hover .header-anchor,
.changelog-markdown h5:hover .header-anchor,
.changelog-markdown h6:hover .header-anchor {
  opacity: 1;
}

.changelog-markdown .header-anchor:hover {
  text-decoration: none;
}

/* 表情符号样式 */
.changelog-markdown .emoji {
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
}

/* 水平线样式 */
.changelog-markdown hr {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #e1e4e8, transparent);
  margin: 24px 0;
}

/* 任务列表样式 */
.changelog-markdown input[type='checkbox'] {
  margin-right: 8px;
  accent-color: #409eff;
}

/* 内联元素间距 */
.changelog-markdown strong {
  font-weight: 600;
  color: #333;
}

.changelog-markdown em {
  font-style: italic;
  color: #666;
}

/* 键盘快捷键样式 */
.changelog-markdown kbd {
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
  color: #333;
  display: inline-block;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1;
  padding: 2px 4px;
  margin: 0 2px;
}

/* 滚动条样式 */
.changelog-content::-webkit-scrollbar {
  width: 6px;
}

.changelog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.changelog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.changelog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 版本分析面板样式 */
.version-analysis {
  margin-top: 24px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.analysis-item {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.analysis-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.analysis-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .changelog-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 24px;
  }

  .version-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .version-meta {
    grid-template-columns: 1fr;
  }

  .changelog-content {
    max-height: 400px;
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .analysis-item {
    padding: 12px;
  }

  .analysis-value {
    font-size: 20px;
  }
}
</style>
