<template>
  <div class="connection-status">
    <div class="connection-info">
      <el-tag :type="connectionStatus.type" :size="size">
        <el-icon><component :is="connectionStatus.icon" /></el-icon>
        {{ connectionStatus.text }}
      </el-tag>
    </div>

    <div class="connection-actions" v-if="showActions">
      <el-button
        v-if="!isConnected"
        type="primary"
        :size="buttonSize"
        @click="$emit('connect')"
        :loading="connecting"
      >
        <el-icon><VideoPlay /></el-icon>
        {{ connectText }}
      </el-button>
      <el-button
        v-else
        type="danger"
        :size="buttonSize"
        @click="$emit('disconnect')"
        :loading="disconnecting"
      >
        <el-icon><VideoPause /></el-icon>
        {{ disconnectText }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VideoPlay, VideoPause, Connection, Close } from '@element-plus/icons-vue'

interface Props {
  isConnected: boolean
  connecting?: boolean
  disconnecting?: boolean
  showActions?: boolean
  size?: 'small' | 'default' | 'large'
  connectText?: string
  disconnectText?: string
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  connecting: false,
  disconnecting: false,
  showActions: true,
  size: 'default',
  connectText: '连接',
  disconnectText: '断开',
  errorMessage: '',
})

const emit = defineEmits<{
  connect: []
  disconnect: []
}>()

const buttonSize = computed(() => {
  const sizeMap = {
    small: 'small',
    default: 'default',
    large: 'default',
  }
  return sizeMap[props.size]
})

const connectionStatus = computed(() => {
  if (props.connecting) {
    return {
      type: 'warning' as const,
      text: '连接中...',
      icon: Connection,
    }
  }

  if (props.disconnecting) {
    return {
      type: 'warning' as const,
      text: '断开中...',
      icon: Connection,
    }
  }

  if (props.errorMessage) {
    return {
      type: 'danger' as const,
      text: `错误: ${props.errorMessage}`,
      icon: Close,
    }
  }

  if (props.isConnected) {
    return {
      type: 'success' as const,
      text: '已连接',
      icon: Connection,
    }
  }

  return {
    type: 'info' as const,
    text: '未连接',
    icon: Close,
  }
})

defineOptions({
  name: 'ConnectionStatus',
})
</script>

<style scoped>
@import '@/styles/common.css';

.connection-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-info {
  flex-shrink: 0;
}

.connection-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .connection-status {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .connection-info {
    text-align: center;
  }
}
</style>
