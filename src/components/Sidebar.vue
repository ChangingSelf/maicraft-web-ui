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

        <!-- Agent 日志 -->
        <el-menu-item index="minecraft-logs">
          <el-icon><Document /></el-icon>
          <template #title>
            <span>Agent 日志</span>
          </template>
        </el-menu-item>

        <!-- MCP Server 日志 -->
        <el-menu-item index="mcp-server-logs">
          <el-icon><Document /></el-icon>
          <template #title>
            <span>MCP Server 日志</span>
          </template>
        </el-menu-item>

        <!-- 游戏监控 -->
        <el-menu-item index="game-world-player-dashboard">
          <el-icon><Monitor /></el-icon>
          <template #title>
            <span>游戏状态</span>
          </template>
        </el-menu-item>

        <!-- MCP 工具管理 -->
        <el-menu-item index="mcp-tools">
          <el-icon><Tools /></el-icon>
          <template #title>
            <span>MCP 工具</span>
          </template>
        </el-menu-item>

        <!-- Token 使用量监控 -->
        <el-menu-item index="token-usage">
          <el-icon><Histogram /></el-icon>
          <template #title>
            <span>Token 监控</span>
          </template>
        </el-menu-item>

        <!-- 任务管理 -->
        <el-menu-item index="task-manager">
          <el-icon><List /></el-icon>
          <template #title>
            <span>任务管理</span>
          </template>
        </el-menu-item>

        <!-- 调试工具 -->
        <el-sub-menu index="debug-tools">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>调试工具</span>
          </template>
          <el-menu-item index="websocket-monitor">WebSocket 监控</el-menu-item>
          <el-menu-item index="websocket-debugger">WebSocket 调试</el-menu-item>
          <el-menu-item index="websocket-simulator">WebSocket 模拟器</el-menu-item>
          <el-menu-item index="heartbeat-test">心跳测试</el-menu-item>
        </el-sub-menu>

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
      <!-- 连接状态显示 -->
      <div class="connection-status" v-if="!isCollapsed">
        <div class="status-display">
          <div class="status-dot" :class="{ online: allConnected }"></div>
          <span class="status-text">{{ connectionStatusText }}</span>
        </div>
      </div>

      <!-- 模拟模式切换 -->
      <div class="mock-mode-section" v-if="!isCollapsed">
        <div class="mock-mode-header">
          <span class="mock-mode-label">{{ isMockMode ? '模拟模式' : '真实模式' }}</span>
          <el-switch
            v-model="isMockMode"
            active-color="#67c23a"
            inactive-color="#409eff"
            @change="handleMockModeToggle"
            size="small"
          />
        </div>
        <el-button
          v-if="isMockMode"
          class="quick-action-btn mock-connect-btn"
          type="success"
          @click="handleQuickMockStart"
          size="small"
        >
          <el-icon><VideoPlay /></el-icon>
          <span>快速启动模拟</span>
        </el-button>
      </div>

      <!-- 连接控制按钮 -->
      <div class="connection-controls" v-if="!isCollapsed">
        <div class="connection-buttons">
          <el-button
            class="quick-action-btn connect-btn"
            :type="connectionButtonType"
            :loading="isConnecting"
            @click="handleConnectionToggle"
            size="small"
          >
            <el-icon v-if="allConnected"><Switch /></el-icon>
            <el-icon v-else><Link /></el-icon>
            <span>{{ isMockMode ? '模拟连接' : '全部连接' }}</span>
          </el-button>
          <el-button
            class="quick-action-btn disconnect-all-btn"
            type="danger"
            @click="handleDisconnectAll"
            size="small"
            :disabled="globalConnectionStatus.connectionCount === 0"
          >
            <el-icon><SwitchButton /></el-icon>
            <span>全部断开</span>
          </el-button>
        </div>
      </div>

      <!-- 全局监控按钮 -->
      <div class="monitor-section" v-if="!isCollapsed">
        <el-button
          class="quick-action-btn monitor-btn"
          type="primary"
          @click="handleJumpToMonitor"
          size="small"
        >
          <el-icon><Monitor /></el-icon>
          <span>全局监控</span>
        </el-button>
      </div>

      <div class="version-info" v-if="!isCollapsed">
        <div class="version-display" @click="handleVersionClick">
          <small>{{ currentVersion }} （点击查看更新日志）</small>
        </div>
      </div>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentVersionSync, formatVersion } from '../services/versionService'
import {
  connectAllWebSockets,
  disconnectAllWebSockets,
  getGlobalConnectionStatus,
  getIsMockMode,
  enableMockMode,
  disableMockMode,
} from '../services/globalWebSocketService'
import {
  connectAllMockEndpoints,
  disconnectAllMockEndpoints,
} from '../services/mockWebSocketService'
import { ElMessage } from 'element-plus'
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
  SwitchButton,
  Switch,
  Link,
  VideoPlay,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const isCollapsed = ref(false)
const serverOnline = ref(true)
const isMobile = ref(false)
const showMobileSidebar = ref(false)
const isMockMode = ref(getIsMockMode())

// WebSocket连接状态
const globalConnectionStatus = getGlobalConnectionStatus()
const isConnecting = computed(() => globalConnectionStatus.isConnecting)
const allConnected = computed(() => globalConnectionStatus.allConnected)

// 连接状态显示文本
const connectionStatusText = computed(() => {
  if (isConnecting.value) return '连接中...'
  if (allConnected.value) return '全部在线'
  const connectedCount = globalConnectionStatus.connectionCount
  const totalCount = globalConnectionStatus.totalEndpoints
  return `${connectedCount}/${totalCount} 在线`
})

// 连接按钮状态
const connectionButtonType = computed(() => {
  if (isConnecting.value) return 'primary'
  return allConnected.value ? 'success' : 'warning'
})

// 版本信息
const currentVersion = ref('v1.1.4') // 默认版本

// 获取版本信息（使用同步方法）
const loadVersionInfo = () => {
  try {
    const version = getCurrentVersionSync()
    currentVersion.value = formatVersion(version)
  } catch (error) {
    console.warn('获取版本信息失败:', error)
    // 使用配置文件中的版本作为兜底
    try {
      const configVersion = '0.0.0' // 从 version.json 中获取
      currentVersion.value = formatVersion(configVersion)
    } catch (configError) {
      console.warn('获取配置文件版本失败:', configError)
      currentVersion.value = 'v0.0.0' // 最后的兜底版本
    }
  }
}

// 当前激活的菜单项
const activeIndex = computed(() => {
  const path = route.path
  if (path === '/' || path === '/home') return 'home'
  if (path === '/logs') return 'minecraft-logs'
  if (path === '/mcp-logs') return 'mcp-server-logs'
  if (path === '/mcp-tools') return 'mcp-tools'
  if (path === '/token-usage') return 'token-usage'
  if (path === '/task-manager') return 'task-manager'
  if (path.startsWith('/server')) return 'server'
  if (path.startsWith('/players')) return 'players'
  if (path.startsWith('/monitoring')) return 'monitoring'
  if (path === '/game-monitoring/world-player-dashboard') return 'game-world-player-dashboard'
  if (path.startsWith('/game-monitoring')) return 'game-monitoring'
  if (path.startsWith('/debug-tools')) return 'debug-tools'
  if (path === '/websocket-monitor') return 'websocket-monitor'
  if (path === '/websocket-debugger') return 'websocket-debugger'
  if (path === '/websocket-simulator') return 'websocket-simulator'
  if (path === '/heartbeat-test') return 'heartbeat-test'
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

// 模拟模式切换处理
const handleMockModeToggle = (enabled: boolean) => {
  if (enabled) {
    enableMockMode()
    ElMessage.success('已切换到模拟模式')
  } else {
    disableMockMode()
    ElMessage.info('已切换到真实模式')
  }
  isMockMode.value = enabled
}

// 快速启动模拟连接
const handleQuickMockStart = async () => {
  try {
    await connectAllMockEndpoints()
    ElMessage.success('模拟连接已启动！数据将在1-2秒后开始推送')
  } catch (error) {
    console.error('模拟连接启动失败:', error)
    ElMessage.error('模拟连接启动失败')
  }
}

// WebSocket连接处理
const handleConnectionToggle = async () => {
  try {
    if (allConnected.value) {
      // 如果全部连接，则断开所有连接
      if (isMockMode.value) {
        disconnectAllMockEndpoints()
      } else {
        disconnectAllWebSockets()
      }
    } else {
      // 否则连接所有WebSocket
      if (isMockMode.value) {
        await connectAllMockEndpoints()
      } else {
        await connectAllWebSockets()
      }
    }
  } catch (error) {
    console.error('WebSocket连接操作失败:', error)
    ElMessage.error('连接操作失败')
  }
}

// 组件挂载时初始化
onMounted(() => {
  updateSidebarMargin()
  loadVersionInfo()

  // 定期同步模拟模式状态
  const syncMockModeTimer = setInterval(() => {
    isMockMode.value = getIsMockMode()
  }, 2000)

  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearInterval(syncMockModeTimer)
  })
})

// 处理菜单选择
const handleSelect = (index: string) => {
  switch (index) {
    case 'home':
      router.push('/')
      break
    case 'minecraft-logs':
      router.push('/logs')
      break
    case 'mcp-server-logs':
      router.push('/mcp-logs')
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
    case 'game-world-player-dashboard':
      router.push('/game-monitoring/world-player-dashboard')
      break
    case 'mcp-tools':
      router.push('/mcp-tools')
      break
    case 'token-usage':
      router.push('/token-usage')
      break
    case 'task-manager':
      router.push('/task-manager')
      break
    case 'websocket-monitor':
      router.push('/websocket-monitor')
      break
    case 'websocket-debugger':
      router.push('/websocket-debugger')
      break
    case 'websocket-simulator':
      router.push('/websocket-simulator')
      break
    case 'heartbeat-test':
      router.push('/heartbeat-test')
      break
    case 'settings':
      router.push('/settings')
      break
  }
}

// 处理版本信息点击
const handleVersionClick = () => {
  router.push('/changelog')
}

// 处理全部断开按钮点击
const handleDisconnectAll = () => {
  try {
    if (isMockMode.value) {
      disconnectAllMockEndpoints()
    } else {
      disconnectAllWebSockets()
    }
  } catch (error) {
    console.error('断开所有连接失败:', error)
    ElMessage.error('断开连接失败')
  }
}

// 处理全局监控页面跳转
const handleJumpToMonitor = () => {
  router.push('/websocket-monitor')
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

/* 连接状态显示样式 */
.connection-status {
  margin-bottom: 12px;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff4d4f;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
}

.status-dot.online {
  background-color: #52c41a;
}

.status-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 模拟模式切换区域 */
.mock-mode-section {
  margin: 12px 0;
  padding: 10px;
  background: rgba(103, 194, 58, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.mock-mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mock-mode-label {
  font-size: 12px;
  font-weight: 500;
  color: #67c23a;
}

.mock-connect-btn {
  width: 100%;
  margin-top: 8px;
}

/* 连接控制按钮样式 */
.connection-controls {
  margin-bottom: 12px;
}

.connection-buttons {
  display: flex;
  gap: 8px;
}

/* 全局监控按钮样式 */
.monitor-section {
  margin-bottom: 12px;
}

.quick-action-btn {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 12px;
  font-weight: 500;
}

.quick-action-btn .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

.quick-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.disconnect-all-btn {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.disconnect-all-btn:hover {
  background-color: #fee2e2;
  border-color: #fca5a5;
}

.connect-btn {
  background-color: #f0f9ff;
  border-color: #bae6fd;
  color: #0369a1;
}

.connect-btn:hover {
  background-color: #e0f2fe;
  border-color: #7dd3fc;
}

.monitor-btn {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.monitor-btn:hover {
  background-color: #dbeafe;
  border-color: #93c5fd;
}

.version-info {
  margin-bottom: 12px;
}

.version-display {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  padding: 4px 8px;
}

.version-display:hover {
  background-color: #e6e6e6;
  color: #409eff;
}

.version-display small {
  color: inherit;
  font-size: 12px;
  font-weight: 500;
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
