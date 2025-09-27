import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import LogViewer from '../views/LogViewer.vue'
import MCPServerLogViewer from '../views/MCPServerLogViewer.vue'
import MCPTools from '../views/MCPTools.vue'
import Settings from '../views/Settings.vue'
import WorldPlayerDashboard from '../views/WorldPlayerDashboard.vue'
import Changelog from '../views/Changelog.vue'
import TokenUsage from '../views/TokenUsage.vue'
import TaskManager from '../views/TaskManager.vue'
import WebSocketDebugger from '../views/WebSocketDebugger.vue'
import HeartbeatTest from '../views/HeartbeatTest.vue'
import WebSocketMonitor from '../views/WebSocketMonitor.vue'
import WebSocketSimulator from '../views/WebSocketSimulator.vue'
import ComponentTest from '../views/ComponentTest.vue'
import WebSocketTest from '../views/WebSocketTest.vue'

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
    // MCP 工具管理
    {
      path: '/mcp-tools',
      name: 'mcp-tools',
      component: MCPTools,
      meta: {
        title: 'MCP 工具管理',
      },
    },
    // Token 使用量监控
    {
      path: '/token-usage',
      name: 'token-usage',
      component: TokenUsage,
      meta: {
        title: 'Token 使用量监控',
      },
    },
    // 任务管理
    {
      path: '/task-manager',
      name: 'task-manager',
      component: TaskManager,
      meta: {
        title: '任务管理',
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
      path: '/game-monitoring/world-player-dashboard',
      name: 'world-player-dashboard',
      component: WorldPlayerDashboard,
      meta: {
        title: '世界与玩家状态',
      },
    },
    // 版本信息页面
    {
      path: '/changelog',
      name: 'changelog',
      component: Changelog,
      meta: {
        title: '版本信息',
      },
    },
    // WebSocket 调试工具
    {
      path: '/websocket-debugger',
      name: 'websocket-debugger',
      component: WebSocketDebugger,
      meta: {
        title: 'WebSocket 调试工具',
      },
    },
    // 心跳机制测试
    {
      path: '/heartbeat-test',
      name: 'heartbeat-test',
      component: HeartbeatTest,
      meta: {
        title: '心跳机制测试',
      },
    },
    // WebSocket 连接监控
    {
      path: '/websocket-monitor',
      name: 'websocket-monitor',
      component: WebSocketMonitor,
      meta: {
        title: 'WebSocket 连接监控',
      },
    },
    // WebSocket 模拟器
    {
      path: '/websocket-simulator',
      name: 'websocket-simulator',
      component: WebSocketSimulator,
      meta: {
        title: 'WebSocket 模拟器',
      },
    },
    // 组件测试页面
    {
      path: '/component-test',
      name: 'component-test',
      component: ComponentTest,
      meta: {
        title: '组件测试',
      },
    },
    // WebSocket 测试页面
    {
      path: '/websocket-test',
      name: 'websocket-test',
      component: WebSocketTest,
      meta: {
        title: 'WebSocket 测试',
      },
    },
  ],
})

export default router
