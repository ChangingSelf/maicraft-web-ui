<template>
  <div class="changelog-page">
    <PageHeader>
      <template #default>
        <h1 class="page-title">
          <el-icon class="title-icon"><InfoFilled /></el-icon>
          版本信息与更新日志 ✨
        </h1>
      </template>
      <template #actions>
        <div class="version-info">
          <el-tag type="primary" size="large">🚀 当前版本: {{ currentVersion }}</el-tag>
          <el-tag type="info" size="small">最后更新: {{ lastUpdated }}</el-tag>
        </div>
      </template>
    </PageHeader>

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
          </div>
        </template>

        <div v-if="loading" class="loading-container">
          <el-skeleton :loading="loading" animated :count="3" :rows="4" :throttle="500" />
        </div>

        <div v-else-if="versionHistory.length > 0" class="changelog-content-wrapper">
          <div class="changelog-content">
            <!-- 版本历史列表 -->
            <div class="version-list">
              <div
                v-for="(version, index) in versionHistory"
                :key="version.version"
                class="version-item"
              >
                <div class="version-header">
                  <div class="version-badge">
                    <el-tag :type="getVersionTypeColor(version.type)">
                      {{ getVersionTypeIcon(version.type) }}
                      {{ version.version }}
                    </el-tag>
                  </div>
                  <div class="version-date">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(version.date) }}
                  </div>
                </div>

                <div class="version-summary" v-if="version.summary">
                  <p>{{ version.summary }}</p>
                </div>

                <!-- 变更详情 -->
                <div class="changes-section">
                  <div
                    v-for="(items, type) in version.changes"
                    :key="type"
                    class="change-group"
                    v-show="items && items.length > 0"
                  >
                    <div class="change-type-header">
                      <el-icon :class="`type-icon-${String(type)}`">
                        <component :is="getCommitTypeIcon(String(type))"></component>
                      </el-icon>
                      <span class="type-label">{{ getCommitTypeLabel(String(type)) }}</span>
                      <el-tag size="mini" type="info">{{
                        String(items ? items.length : 0)
                      }}</el-tag>
                    </div>
                    <ul class="change-list">
                      <li
                        v-for="(item, itemIndex) in items || []"
                        :key="itemIndex"
                        class="change-item"
                      >
                        {{ item }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- 分隔线 -->
                <el-divider v-if="index < versionHistory.length - 1"></el-divider>
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
import { PageHeader } from '@/components/common'
import {
  InfoFilled,
  Star,
  DocumentChecked,
  Refresh,
  Clock,
  Plus,
  Warning,
  Document,
  Brush,
  Refresh as RefreshIcon,
  Lightning,
  Help,
  Setting,
  Avatar,
  Box,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getCurrentVersion,
  getVersionInfo,
  formatVersion,
  formatDate,
  analyzeVersionTrends,
  getVersionHistory,
  type VersionHistory,
} from '../services/versionService'

// 响应式数据
const loading = ref(false)
const versionHistory = ref<VersionHistory[]>([])
const versionInfo = ref<any>(null)
const versionAnalysis = ref(analyzeVersionTrends())

// 计算属性
const currentVersion = computed(() => {
  if (!versionInfo.value) return 'v0.0.1' // 兜底版本
  return formatVersion(versionInfo.value.version)
})
const lastUpdated = computed(() => {
  if (!versionInfo.value) return '2025-09-20' // 兜底日期
  return versionInfo.value.lastUpdated
})
const currentVersionDate = computed(() => {
  if (!versionInfo.value) return '2025年9月20日' // 兜底日期
  return formatDate(versionInfo.value.buildDate)
})
const buildInfo = computed(() => {
  if (!versionInfo.value) return 'Vue 3 + TypeScript + Vite' // 兜底信息
  return versionInfo.value.buildInfo
})

// 获取版本历史数据
const fetchChangelog = async () => {
  try {
    loading.value = true
    // 直接从 version.json 获取版本历史
    const history = getVersionHistory()
    versionHistory.value = history
  } catch (error) {
    console.error('获取版本历史失败:', error)
    ElMessage.error('获取版本历史失败，请稍后重试')
    versionHistory.value = []
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

// 获取提交类型的图标
const getCommitTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    feat: Plus,
    fix: Warning,
    docs: Document,
    style: Brush,
    refactor: RefreshIcon,
    perf: Lightning,
    test: Help,
    chore: Setting,
    ci: Avatar,
    build: Box,
  }

  return icons[type] || InfoFilled
}

// 获取版本类型的颜色
const getVersionTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    major: 'danger',
    minor: 'success',
    patch: 'warning',
  }

  return colors[type] || 'info'
}

// 获取版本类型的图标
const getVersionTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    major: '🚀',
    minor: '📈',
    patch: '🐛',
  }

  return icons[type] || '📦'
}

// 获取版本信息
const fetchVersionInfo = async () => {
  try {
    const info = await getVersionInfo()
    versionInfo.value = info
  } catch (error) {
    console.warn('获取版本信息失败:', error)
    // 使用兜底值
    versionInfo.value = {
      version: '0.16.1',
      name: 'Maicraft Web UI',
      description: 'Minecraft 服务器监控和管理界面',
      buildDate: '2025-09-20',
      buildTime: '15:59:48',
      buildInfo: 'Vue 3 + TypeScript + Vite',
      author: 'ChangingSelf',
      repository: 'https://github.com/ChangingSelf/maicraft-web-ui',
      license: 'MIT',
      lastUpdated: '2025-09-20',
    }
  }
}

// 刷新版本信息
const refreshChangelog = () => {
  fetchChangelog()
  fetchVersionInfo()
  versionAnalysis.value = analyzeVersionTrends()
}

// 组件挂载时获取更新日志和版本信息
onMounted(async () => {
  await Promise.all([fetchChangelog(), fetchVersionInfo()])
})
</script>

<style scoped>
.changelog-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
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

.version-info .el-tag {
  font-size: 16px !important;
  font-weight: 600 !important;
  padding: 8px 16px !important;
  border-radius: 20px !important;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15) !important;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.current-version-card {
  border-radius: 12px;
  overflow: hidden;
}

.changelog-card {
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
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
  font-size: 20px !important;
  color: #1a1a1a !important;
  font-weight: 700 !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

.loading-container {
  padding: 20px;
}

.no-content {
  padding: 40px;
  text-align: center;
}

.changelog-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.changelog-content {
  flex: 1;
  overflow-y: auto;
}

/* 版本列表样式 */
.version-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.version-item {
  padding: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.version-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #409eff 0%, #66b1ff 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.version-item:hover {
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.15);
  border-color: #409eff;
  transform: translateY(-2px);
}

.version-item:hover::before {
  opacity: 1;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.version-badge {
  display: flex;
  align-items: center;
}

.version-badge .el-tag {
  font-size: 18px !important;
  font-weight: 700 !important;
  padding: 10px 20px !important;
  border-radius: 25px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%) !important;
  color: white !important;
  border: none !important;
}

.version-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 14px;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.version-summary {
  margin: 12px 0;
}

.version-summary p {
  margin: 0;
  color: #303133;
  font-size: 15px;
  line-height: 1.5;
}

/* 变更部分样式 */
.changes-section {
  margin-top: 16px;
}

.change-group {
  margin-bottom: 16px;
}

.change-type-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-radius: 10px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transition: all 0.3s ease;
}

.change-type-header:hover {
  transform: translateX(2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.type-icon-feat {
  color: #52c41a;
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-fix {
  color: #ff4d4f;
  background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-docs {
  color: #722ed1;
  background: linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-style {
  color: #fa8c16;
  background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-refactor {
  color: #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-perf {
  color: #faad14;
  background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-test {
  color: #13c2c2;
  background: linear-gradient(135deg, #e6fffb 0%, #87e8de 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-chore {
  color: #bfbfbf;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-ci {
  color: #40a9ff;
  background: linear-gradient(135deg, #f0f8ff 0%, #bae7ff 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.type-icon-build {
  color: #36cfc9;
  background: linear-gradient(135deg, #f0fdff 0%, #b5f5ec 100%);
  border-radius: 6px;
  padding: 6px;
  font-size: 16px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}

.type-label {
  font-weight: 600;
  color: #303133;
}

.change-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8f2ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.change-item {
  padding: 12px 20px 12px 40px;
  border-bottom: 1px solid #f0f2f5;
  position: relative;
  line-height: 1.6;
  transition: all 0.2s ease;
}

.change-item:last-child {
  border-bottom: none;
}

.change-item:hover {
  background: rgba(64, 158, 255, 0.02);
  padding-left: 44px;
}

.change-item::before {
  content: '▸';
  color: #409eff;
  font-weight: bold;
  margin-right: 10px;
  position: absolute;
  left: 16px;
  top: 12px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.change-item:hover::before {
  color: #66b1ff;
  transform: scale(1.1);
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

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.analysis-item {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.08);
  border: 1px solid #e8f2ff;
  transition: all 0.3s ease;
}

.analysis-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
}

.analysis-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.analysis-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
