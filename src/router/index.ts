import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import LogViewer from '../views/LogViewer.vue'
import EventViewer from '../views/EventViewer.vue'
import MCPTools from '../views/MCPTools.vue'

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
        title: '日志查看器',
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
    // 服务器管理相关路由（占位）
    {
      path: '/server/:action',
      name: 'server',
      component: () => import('../views/ServerManager.vue'),
      meta: {
        title: '服务器管理',
      },
    },
    // 玩家管理相关路由（占位）
    {
      path: '/players/:action',
      name: 'players',
      component: () => import('../views/PlayerManager.vue'),
      meta: {
        title: '玩家管理',
      },
    },
    // 系统监控相关路由（占位）
    {
      path: '/monitoring/:action',
      name: 'monitoring',
      component: () => import('../views/Monitoring.vue'),
      meta: {
        title: '系统监控',
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
      component: () => import('../views/Settings.vue'),
      meta: {
        title: '设置',
      },
    },
  ],
})

export default router
