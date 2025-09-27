<template>
  <div class="controls">
    <!-- 频率限制状态 -->
    <div v-if="rateLimitedCount > 0" class="rate-limit-status">
      <el-tag type="warning" size="small"> 已限制 {{ rateLimitedCount }} 条日志 </el-tag>
    </div>
    <!-- 自动滚动控制 -->
    <div class="auto-scroll-control">
      <el-button
        :type="autoScrollEnabled ? 'warning' : 'success'"
        :icon="autoScrollEnabled ? VideoPause : VideoPlay"
        @click="$emit('toggleAutoScroll')"
        size="small"
        :title="autoScrollEnabled ? '点击暂停自动滚动' : '点击开启自动滚动'"
      >
        {{ autoScrollEnabled ? '暂停滚动' : '自动滚动' }}
      </el-button>
    </div>

    <!-- 滚动状态指示器已移除，完全由用户手动控制 -->
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
import { computed } from 'vue'
import { VideoPlay, VideoPause, Refresh, Setting } from '@element-plus/icons-vue'

// Props定义
interface Props {
  isConnected: boolean
  rateLimitedCount: number
  statsVisible: boolean
  autoScrollEnabled: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isConnected: false,
  rateLimitedCount: 0,
  statsVisible: false,
  autoScrollEnabled: true,
})

// 定义组件名称
defineOptions({
  name: 'LogControls',
})

// 计算属性用于开关状态
const autoScrollModel = computed({
  get: () => props.autoScrollEnabled,
  set: (value: boolean) => {
    // 这里通过emit来处理状态变化
  },
})

// 事件定义
defineEmits<{
  toggleConnection: []
  clearLogs: []
  showSettings: []
  toggleStats: []
  toggleAutoScroll: []
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

.auto-scroll-control {
  margin-right: 10px;
}

.scroll-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 10px;
}
</style>
