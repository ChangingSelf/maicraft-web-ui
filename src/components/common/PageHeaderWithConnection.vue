<template>
  <!-- 页面头部组件，包含标题和连接状态 -->
  <div class="page-header">
    <h2>{{ title }}</h2>
    <div class="header-actions">
      <el-button type="primary" @click="handleConnect" v-if="!isConnected" :loading="connecting">
        <el-icon><VideoPlay /></el-icon>
        连接
      </el-button>
      <el-button type="danger" @click="handleDisconnect" v-else :loading="disconnecting">
        <el-icon><VideoPause /></el-icon>
        断开
      </el-button>
      <el-tag :type="connectionStatus.type" size="large">
        <el-icon><component :is="connectionStatus.icon" /></el-icon>
        {{ connectionStatus.text }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VideoPlay, VideoPause, CircleCheck, CircleClose } from '@element-plus/icons-vue'

// 定义组件属性
interface Props {
  title: string
  isConnected: boolean
  connecting?: boolean
  disconnecting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  connecting: false,
  disconnecting: false,
})

// 定义组件事件
const emit = defineEmits<{
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

// 事件处理器
const handleConnect = () => {
  emit('connect')
}

const handleDisconnect = () => {
  emit('disconnect')
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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
