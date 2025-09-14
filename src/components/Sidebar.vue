<template>
  <el-aside class="sidebar" :class="{ collapsed: isCollapsed }" :width="sidebarWidth">
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <div class="logo-section">
        <el-icon class="logo-icon" v-if="!isCollapsed"><Grid /></el-icon>
        <h3 v-if="!isCollapsed">Maicraft Web UI</h3>
      </div>
      <el-button
        type="text"
        class="collapse-btn"
        @click="toggleCollapse"
        :icon="isCollapsed ? ArrowRight : ArrowLeft"
        size="small"
      />
    </div>

    <!-- 导航菜单 -->
    <div class="sidebar-menu">
      <el-menu
        :default-active="activeIndex"
        class="sidebar-nav"
        :collapse="isCollapsed"
        :unique-opened="true"
        @select="handleSelect"
      >
        <!-- 主页 -->
        <el-menu-item index="home">
          <el-icon><House /></el-icon>
          <template #title>
            <span>主页</span>
          </template>
        </el-menu-item>

        <!-- 日志查看 -->
        <el-menu-item index="logs">
          <el-icon><Document /></el-icon>
          <template #title>
            <span>日志查看</span>
          </template>
        </el-menu-item>

        <!-- 事件查看 -->
        <el-menu-item index="events">
          <el-icon><List /></el-icon>
          <template #title>
            <span>事件查看</span>
          </template>
        </el-menu-item>

        <!-- 游戏监控 -->
        <el-sub-menu index="game-monitoring">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>游戏监控</span>
          </template>
          <el-menu-item index="game-world-info">世界信息</el-menu-item>
          <el-menu-item index="game-player-status">玩家状态</el-menu-item>
        </el-sub-menu>

        <!-- MCP 工具管理 -->
        <el-menu-item index="mcp-tools">
          <el-icon><Tools /></el-icon>
          <template #title>
            <span>MCP 工具</span>
          </template>
        </el-menu-item>

        <!-- 设置 -->
        <el-menu-item index="settings">
          <el-icon><Setting /></el-icon>
          <template #title>
            <span>设置</span>
          </template>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 侧边栏底部 -->
    <div class="sidebar-footer">
      <div class="server-status" v-if="!isCollapsed">
        <div class="status-indicator">
          <div class="status-dot" :class="{ online: serverOnline }"></div>
          <span>{{ serverOnline ? '服务器在线' : '服务器离线' }}</span>
        </div>
      </div>
      <div class="version-info" v-if="!isCollapsed">
        <small>v1.0.0</small>
      </div>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  House,
  Monitor,
  Document,
  User,
  Histogram,
  Setting,
  Grid,
  ArrowLeft,
  ArrowRight,
  List,
  Tools,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const isCollapsed = ref(false)
const serverOnline = ref(true)
const isMobile = ref(false)
const showMobileSidebar = ref(false)

// 当前激活的菜单项
const activeIndex = computed(() => {
  const path = route.path
  if (path === '/' || path === '/home') return 'home'
  if (path === '/logs') return 'logs'
  if (path === '/events') return 'events'
  if (path === '/mcp-tools') return 'mcp-tools'
  if (path.startsWith('/server')) return 'server'
  if (path.startsWith('/players')) return 'players'
  if (path.startsWith('/monitoring')) return 'monitoring'
  if (path.startsWith('/game-monitoring')) return 'game-monitoring'
  if (path === '/settings') return 'settings'
  return 'home'
})

// 侧边栏宽度
const sidebarWidth = computed(() => {
  return isCollapsed.value ? '64px' : '260px'
})

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // 更新CSS变量
  updateSidebarMargin()
}

// 更新侧边栏margin
const updateSidebarMargin = () => {
  const margin = isCollapsed.value ? '64px' : '260px'
  document.documentElement.style.setProperty('--sidebar-width', margin)
}

// 组件挂载时初始化
onMounted(() => {
  updateSidebarMargin()
})

// 处理菜单选择
const handleSelect = (index: string) => {
  switch (index) {
    case 'home':
      router.push('/')
      break
    case 'logs':
      router.push('/logs')
      break
    case 'events':
      router.push('/events')
      break
    case 'server-status':
      router.push('/server/status')
      break
    case 'server-config':
      router.push('/server/config')
      break
    case 'server-plugins':
      router.push('/server/plugins')
      break
    case 'server-backup':
      router.push('/server/backup')
      break
    case 'players-online':
      router.push('/players/online')
      break
    case 'players-banlist':
      router.push('/players/banlist')
      break
    case 'players-whitelist':
      router.push('/players/whitelist')
      break
    case 'monitoring-performance':
      router.push('/monitoring/performance')
      break
    case 'monitoring-resources':
      router.push('/monitoring/resources')
      break
    case 'monitoring-alerts':
      router.push('/monitoring/alerts')
      break
    case 'game-world-info':
      router.push('/game-monitoring/world-info')
      break
    case 'game-player-status':
      router.push('/game-monitoring/player-status')
      break
    case 'mcp-tools':
      router.push('/mcp-tools')
      break
    case 'settings':
      router.push('/settings')
      break
  }
}

// 监听路由变化，更新活动菜单项
watch(
  () => route.path,
  () => {
    // 活动菜单项会自动通过computed更新
  },
)
</script>

<style scoped>
.sidebar {
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  color: #409eff;
}

.logo-section h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.collapse-btn {
  color: #666;
}

.collapse-btn:hover {
  color: #409eff;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.sidebar-nav {
  border-right: none;
  background: transparent;
}

.sidebar-nav :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-nav :deep(.el-menu-item:hover) {
  background-color: #ecf5ff;
  color: #409eff;
}

.sidebar-nav :deep(.el-menu-item.is-active) {
  background-color: #409eff;
  color: #fff;
}

.sidebar-nav :deep(.el-sub-menu) {
  margin: 4px 8px;
}

.sidebar-nav :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-nav :deep(.el-sub-menu__title:hover) {
  background-color: #ecf5ff;
  color: #409eff;
}

.sidebar-nav :deep(.el-menu--inline .el-menu-item) {
  padding-left: 56px !important;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e6e6e6;
  background: #fafafa;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff4d4f;
  transition: background-color 0.3s ease;
}

.status-dot.online {
  background-color: #52c41a;
}

.version-info {
  text-align: center;
  color: #999;
  font-size: 12px;
}

/* 滚动条样式 */
.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 280px !important;
    position: fixed;
    top: 0;
    left: -280px;
    z-index: 1001;
    transition: left 0.3s ease;
    height: 100vh;
  }

  .sidebar.show {
    left: 0;
  }

  .sidebar.collapsed {
    width: 280px !important;
    left: -280px;
  }

  .sidebar.collapsed.show {
    left: 0;
  }
}
</style>
