<template>
  <div class="controls">
    <!-- 频率限制状态 -->
    <div v-if="rateLimitedCount > 0" class="rate-limit-status">
      <el-tag type="warning" size="small"> 已限制 {{ rateLimitedCount }} 条日志 </el-tag>
    </div>
    <!-- 滚动状态指示器 -->
    <div v-if="userScrolledUp || scrollPausedBySpam" class="scroll-status">
      <el-tag :type="scrollPausedBySpam ? 'danger' : 'info'" size="small">
        {{ scrollPausedBySpam ? '刷屏暂停' : '手动暂停' }}
      </el-tag>
      <el-button type="success" icon="Bottom" @click="$emit('resumeAutoScroll')" size="small">
        恢复滚动
      </el-button>
    </div>
    <el-button
      :type="isConnected ? 'success' : 'primary'"
      :icon="isConnected ? VideoPause : VideoPlay"
      @click="$emit('toggleConnection')"
      size="small"
    >
      {{ isConnected ? '断开连接' : '连接服务器' }}
    </el-button>
    <el-button type="primary" icon="Refresh" @click="$emit('clearLogs')" size="small">
      清空日志
    </el-button>
    <el-button type="info" icon="Setting" @click="$emit('showSettings')" size="small">
      设置
    </el-button>
    <el-button
      type="primary"
      :icon="statsVisible ? 'ArrowUp' : 'ArrowDown'"
      @click="$emit('toggleStats')"
      size="small"
    >
      {{ statsVisible ? '隐藏统计' : '显示统计' }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay, VideoPause, Refresh, Setting, ArrowDown, ArrowUp, Bottom } from '@element-plus/icons-vue'

// Props定义
interface Props {
  isConnected: boolean
  rateLimitedCount: number
  userScrolledUp: boolean
  scrollPausedBySpam: boolean
  statsVisible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isConnected: false,
  rateLimitedCount: 0,
  userScrolledUp: false,
  scrollPausedBySpam: false,
  statsVisible: false,
})

// 定义组件名称
defineOptions({
  name: 'LogControls',
})

// 事件定义
defineEmits<{
  toggleConnection: []
  clearLogs: []
  showSettings: []
  toggleStats: []
  resumeAutoScroll: []
}>()
</script>

<style scoped>
.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.rate-limit-status {
  margin-right: 10px;
}

.scroll-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 10px;
}
</style>
