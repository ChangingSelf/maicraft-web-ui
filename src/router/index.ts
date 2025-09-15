import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import LogViewer from '../views/LogViewer.vue'
import MCPServerLogViewer from '../views/MCPServerLogViewer.vue'
import EventViewer from '../views/EventViewer.vue'
import MCPTools from '../views/MCPTools.vue'
import Settings from '../views/Settings.vue'
import WorldInfo from '../views/WorldInfo.vue'
import PlayerStatus from '../views/PlayerStatus.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        title: '主页',
      },
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogViewer,
      meta: {
        title: 'Minecraft 日志查看器',
      },
    },
    {
      path: '/mcp-logs',
      name: 'mcp-logs',
      component: MCPServerLogViewer,
      meta: {
        title: 'MCP Server 日志查看器',
      },
    },
    {
      path: '/events',
      name: 'events',
      component: EventViewer,
      meta: {
        title: '事件查看器',
      },
    },
    // MCP 工具管理
    {
      path: '/mcp-tools',
      name: 'mcp-tools',
      component: MCPTools,
      meta: {
        title: 'MCP 工具管理',
      },
    },
    // 设置页面（占位）
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: {
        title: '设置',
      },
    },
    // 游戏监控相关路由
    {
      path: '/game-monitoring/world-info',
      name: 'world-info',
      component: WorldInfo,
      meta: {
        title: '世界信息',
      },
    },
    {
      path: '/game-monitoring/player-status',
      name: 'player-status',
      component: PlayerStatus,
      meta: {
        title: '玩家状态',
      },
    },
  ],
})

export default router
