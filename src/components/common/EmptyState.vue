<template>
  <div class="empty-state" :class="size">
    <div class="empty-icon">
      <el-icon v-if="icon" :size="iconSize">
        <component :is="icon" />
      </el-icon>
      <el-icon v-else :size="iconSize">
        <Box />
      </el-icon>
    </div>

    <div class="empty-content">
      <div class="empty-text">{{ title || '暂无数据' }}</div>
      <div v-if="description" class="empty-description">{{ description }}</div>
    </div>

    <div v-if="$slots.actions || actionText" class="empty-actions">
      <slot name="actions">
        <el-button v-if="actionText" :type="actionType" @click="$emit('action')">
          {{ actionText }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Box } from '@element-plus/icons-vue'

interface Props {
  title?: string
  description?: string
  icon?: any
  size?: 'small' | 'medium' | 'large'
  actionText?: string
  actionType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  icon: undefined,
  size: 'medium',
  actionText: '',
  actionType: 'primary',
})

const emit = defineEmits<{
  action: []
}>()

const iconSize = computed(() => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  }
  return sizeMap[props.size]
})

defineOptions({
  name: 'EmptyState',
})
</script>

<style scoped>
@import '@/styles/common.css';

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #909399;
}

.empty-state.small {
  padding: 20px 16px;
}

.empty-state.medium {
  padding: 40px 20px;
}

.empty-state.large {
  padding: 60px 24px;
}

.empty-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-content {
  margin-bottom: 20px;
}

.empty-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-state.small .empty-text {
  font-size: 14px;
}

.empty-state.large .empty-text {
  font-size: 18px;
}

.empty-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
  max-width: 300px;
}

.empty-state.small .empty-description {
  font-size: 12px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
