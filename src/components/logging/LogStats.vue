<template>
  <div v-if="visible" class="stats-panel">
    <div class="stats-section">
      <h3>日志级别统计</h3>
      <div class="stats-grid">
        <div v-for="(count, level) in levelStats" :key="level" class="stat-item">
          <span class="stat-label" :class="`level-${level.toLowerCase()}`">{{ level }}</span>
          <span class="stat-value">{{ count }}</span>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h3>模块统计</h3>
      <div class="stats-grid">
        <div v-for="(count, module) in moduleStats" :key="module" class="stat-item">
          <span class="stat-label">{{ module }}</span>
          <span class="stat-value">{{ count }}</span>
          <span class="stat-frequency">({{ getLogFrequency(module) }}/min)</span>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h3>总体信息</h3>
      <div class="stats-info">
        <div class="info-item">
          <span class="info-label">总日志数:</span>
          <span class="info-value">{{ totalLogs }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">每分钟频率:</span>
          <span class="info-value">{{ getLogFrequency() }}/min</span>
        </div>
        <div class="info-item">
          <span class="info-label">被限制日志:</span>
          <span class="info-value">{{ rateLimitedCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props定义
interface Props {
  visible: boolean
  levelStats: Record<string, number>
  moduleStats: Record<string, number>
  totalLogs: number
  rateLimitedCount: number
  logs: Array<{
    timestamp: number
    module: string
    count?: number
  }>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  levelStats: () => ({}),
  moduleStats: () => ({}),
  totalLogs: 0,
  rateLimitedCount: 0,
  logs: () => [],
})

// 定义组件名称
defineOptions({
  name: 'LogStats',
})

// 计算日志频率（每分钟）
const getLogFrequency = (module?: string): number => {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  const recentLogs = props.logs.filter((log) => {
    const matchesModule = !module || log.module === module
    const isRecent = log.timestamp > oneMinuteAgo
    return matchesModule && isRecent
  })

  const totalCount = recentLogs.reduce((sum, log) => sum + (log.count || 1), 0)
  return Math.round(totalCount)
}
</script>

<style scoped>
.stats-panel {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-section {
  margin-bottom: 20px;
}

.stats-section:last-child {
  margin-bottom: 0;
}

.stats-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 2px solid #409eff;
  padding-bottom: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.stat-label {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.level-trace {
  color: #666;
}

.level-debug {
  color: #1890ff;
}

.level-info {
  color: #52c41a;
}

.level-success {
  color: #52c41a;
}

.level-warning {
  color: #faad14;
}

.level-error {
  color: #ff4d4f;
}

.level-critical {
  color: #cf1322;
}

.stat-value {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

.stat-frequency {
  font-size: 12px;
  color: #666;
}

.stats-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.info-value {
  font-weight: bold;
  color: #409eff;
}
</style>
