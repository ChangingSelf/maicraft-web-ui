<template>
  <div class="page-header">
    <div class="header-left">
      <!-- 默认标题显示 -->
      <div v-if="title && !$slots.default" class="default-title">
        <h2>{{ title }}</h2>
        <p v-if="description" class="page-description">{{ description }}</p>
      </div>
      <!-- 自定义标题内容 -->
      <slot />
    </div>
    <div class="header-actions">
      <!-- 连接状态显示 -->
      <div v-if="showConnectionStatus" class="connection-status">
        <el-tag :type="connectionStatus.type" size="large">
          <el-icon><component :is="connectionStatus.icon" /></el-icon>
          {{ connectionStatus.text }}
        </el-tag>
      </div>
      <!-- 连接控制按钮 -->
      <div v-if="showConnectionButtons" class="connection-buttons">
        <el-button
          type="primary"
          @click="$emit('connect')"
          v-if="!isConnected"
          :loading="connecting"
        >
          <el-icon><VideoPlay /></el-icon>
          连接
        </el-button>
        <el-button type="danger" @click="$emit('disconnect')" v-else :loading="disconnecting">
          <el-icon><VideoPause /></el-icon>
          断开
        </el-button>
      </div>
      <!-- 自定义操作按钮 -->
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleClose, VideoPlay, VideoPause } from '@element-plus/icons-vue'

interface Props {
  title?: string
  description?: string
  showConnectionStatus?: boolean
  showConnectionButtons?: boolean
  isConnected?: boolean
  connecting?: boolean
  disconnecting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  showConnectionStatus: false,
  showConnectionButtons: false,
  isConnected: false,
  connecting: false,
  disconnecting: false,
})

// 定义组件事件
defineEmits<{
  connect: []
  disconnect: []
}>()

// 连接状态显示
const connectionStatus = computed(() => {
  if (props.isConnected) {
    return {
      type: 'success' as const,
      icon: CircleCheck,
      text: '已连接',
    }
  } else {
    return {
      type: 'danger' as const,
      icon: CircleClose,
      text: '未连接',
    }
  }
})

defineOptions({
  name: 'PageHeader',
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 4px 0 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.default-title h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.connection-status {
  margin-right: 12px;
}

.connection-buttons {
  display: flex;
  gap: 12px;
  margin-right: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }
}
</style>
