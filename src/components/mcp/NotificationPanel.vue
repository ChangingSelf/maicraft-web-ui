<template>
  <div class="mcp-notification-panel">
    <!-- 通知标题栏 -->
    <div class="notification-header">
      <h4>服务器通知</h4>
      <div class="notification-actions">
        <el-badge v-if="unreadCount > 0" :value="unreadCount" :max="99" class="notification-badge">
          <el-button type="text" :icon="Bell" size="small" @click="markAllRead">
            全部已读
          </el-button>
        </el-badge>
        <el-button type="text" :icon="Delete" @click="$emit('clear')" size="small">
          清空
        </el-button>
      </div>
    </div>

    <!-- 通知列表 -->
    <el-scrollbar class="notification-scrollbar">
      <div class="notification-list">
        <div
          v-for="(notification, index) in notifications"
          :key="notification.id || index"
          class="notification-item"
          :class="{
            unread: !notification.read,
            [notification.type]: true,
          }"
          @click="markAsRead(notification)"
        >
          <div class="notification-icon">
            <el-icon>
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>

          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">
              {{ formatTime(notification.timestamp) }}
            </div>
          </div>

          <div class="notification-status">
            <el-tag :type="getNotificationType(notification.type)" size="small">
              {{ getTypeLabel(notification.type) }}
            </el-tag>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="notifications.length === 0" class="empty-notifications">
          <el-empty description="暂无通知" :image-size="80" />
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Bell,
  Delete,
  InfoFilled,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled,
} from '@element-plus/icons-vue'

interface Notification {
  id?: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  read?: boolean
}

interface Props {
  notifications: Notification[]
}

interface Emits {
  (e: 'clear'): void
  (e: 'mark-read', notification: Notification): void
  (e: 'mark-all-read'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 未读通知数量
const unreadCount = computed(() => {
  return props.notifications.filter((n) => !n.read).length
})

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    info: InfoFilled,
    success: CircleCheckFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
  }
  return iconMap[type] || InfoFilled
}

// 获取通知类型
const getNotificationType = (type: string) => {
  const typeMap: Record<string, string> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger',
  }
  return typeMap[type] || 'info'
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    info: '信息',
    success: '成功',
    warning: '警告',
    error: '错误',
  }
  return labelMap[type] || type
}

// 标记为已读
const markAsRead = (notification: Notification) => {
  if (!notification.read) {
    emit('mark-read', notification)
  }
}

// 全部标记为已读
const markAllRead = () => {
  emit('mark-all-read')
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) {
    // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}
</script>

<style scoped>
.mcp-notification-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
}

.notification-header h4 {
  margin: 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-badge {
  display: inline-flex;
}

.notification-scrollbar {
  flex: 1;
}

.notification-list {
  padding: 8px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  border: 1px solid #f0f0f0;
  gap: 12px;
}

.notification-item:hover {
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.notification-item.unread {
  border-left: 3px solid #409eff;
  background: #f0f9ff;
}

.notification-item.info.unread {
  border-left-color: #409eff;
}

.notification-item.success.unread {
  border-left-color: #67c23a;
}

.notification-item.warning.unread {
  border-left-color: #e6a23c;
}

.notification-item.error.unread {
  border-left-color: #f56c6c;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-item.info .notification-icon {
  background: #e1f3ff;
  color: #409eff;
}

.notification-item.success .notification-icon {
  background: #f0f9ff;
  color: #67c23a;
}

.notification-item.warning .notification-icon {
  background: #fdf6ec;
  color: #e6a23c;
}

.notification-item.error .notification-icon {
  background: #fef0f0;
  color: #f56c6c;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #333;
  font-size: 13px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-message {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  color: #999;
  font-size: 11px;
}

.notification-status {
  flex-shrink: 0;
}

.empty-notifications {
  padding: 40px 20px;
  text-align: center;
}

/* 滚动条样式 */
.notification-scrollbar :deep(.el-scrollbar__bar) {
  opacity: 0.6;
}

.notification-scrollbar :deep(.el-scrollbar__thumb) {
  background-color: #c1c1c1;
}
</style>
