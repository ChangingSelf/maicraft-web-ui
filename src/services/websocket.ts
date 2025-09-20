import { reactive } from 'vue'

// WebSocket端点配置 - 全局统一管理
export const WS_ENDPOINTS = {
  // 游戏相关端点
  PLAYER: 'ws://localhost:20914/ws/game/player',
  WORLD: 'ws://localhost:20914/ws/game/world',
  MARKER: 'ws://localhost:20914/ws/game/marker',

  // 日志和监控端点
  LOGS: 'ws://localhost:20914/ws/logs',
  LOGS_ALT: 'ws://localhost:8000/ws/logs', // 备用端点

  // 监控和统计端点
  TOKEN_USAGE: 'ws://localhost:20914/ws/token-usage',
  EVENTS: 'ws://localhost:20914/ws/events',
  TASK_MANAGER: 'ws://localhost:20914/ws/task-manager',

  // 通用端点
  GENERAL: 'ws://localhost:20914/ws',
  STATUS: 'ws://localhost:20914/ws/status',
} as const

// WebSocket端点类型
export type WSEndpointType = keyof typeof WS_ENDPOINTS

// WebSocket连接状态
export interface WSConnection {
  isConnected: boolean
  lastMessage: any
  lastUpdate: number
  error: string | null
}

// WebSocket配置选项
export interface WSConfig {
  url: string
  heartbeatInterval?: number
  reconnectInterval?: number
  maxReconnectAttempts?: number
  autoReconnect?: boolean
  enableHeartbeat?: boolean
}

// WebSocket管理器配置映射
export const WS_MANAGER_CONFIGS: Record<WSEndpointType, Partial<WSConfig>> = {
  // 游戏相关端点配置
  PLAYER: { heartbeatInterval: 30000, reconnectInterval: 5000, maxReconnectAttempts: 5 },
  WORLD: { heartbeatInterval: 30000, reconnectInterval: 5000, maxReconnectAttempts: 5 },
  MARKER: { heartbeatInterval: 30000, reconnectInterval: 5000, maxReconnectAttempts: 5 },

  // 日志和监控端点配置
  LOGS: { heartbeatInterval: 30000, reconnectInterval: 5000, maxReconnectAttempts: 5 },
  LOGS_ALT: { heartbeatInterval: 30000, reconnectInterval: 5000, maxReconnectAttempts: 5 },

  // 监控和统计端点配置
  TOKEN_USAGE: { heartbeatInterval: 30000, reconnectInterval: 3000, maxReconnectAttempts: 3 },
  EVENTS: { heartbeatInterval: 30000, reconnectInterval: 3000, maxReconnectAttempts: 3 },
  TASK_MANAGER: { heartbeatInterval: 30000, reconnectInterval: 3000, maxReconnectAttempts: 3 },

  // 通用端点配置
  GENERAL: { heartbeatInterval: 30000, reconnectInterval: 5000, maxReconnectAttempts: 5 },
  STATUS: { heartbeatInterval: 30000, reconnectInterval: 5000, maxReconnectAttempts: 5 },
}

// =============================================
// 通用WebSocket消息类型定义
// =============================================

export interface WebSocketMessage {
  type: string
  [key: string]: any
}

export interface WSHeartbeatMessage extends WebSocketMessage {
  type: 'ping' | 'pong'
  timestamp: number
}

export interface WSLogMessage extends WebSocketMessage {
  type: 'log'
  timestamp: number
  level: string
  module: string
  message: string
}

export interface WSPlayerMessage extends WebSocketMessage {
  type: 'player_update'
  data: any
}

export interface WSWorldMessage extends WebSocketMessage {
  type: 'world_update'
  data: any
}

export interface WSMarkerMessage extends WebSocketMessage {
  type: 'marker_update'
  data: any
}

export interface WSTokenMessage extends WebSocketMessage {
  type: 'token_usage_update'
  data: any
}

// 全局WebSocket管理器类
export class GameWebSocketManager {
  private ws: WebSocket | null = null
  private heartbeatTimer: number | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0

  public connection: WSConnection = reactive({
    isConnected: false,
    lastMessage: null,
    lastUpdate: 0,
    error: null,
  })

  private config: WSConfig
  private id: string // 管理器唯一标识

  private messageHandlers: ((message: any) => void)[] = []
  private connectionHandlers: ((connected: boolean) => void)[] = []
  private errorHandlers: ((error: Event) => void)[] = []
  private closeHandlers: (() => void)[] = []

  constructor(id: string, config: WSConfig) {
    this.id = id
    this.config = {
      url: config.url,
      heartbeatInterval: config.heartbeatInterval || 30000,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      autoReconnect: config.autoReconnect !== false,
      enableHeartbeat: config.enableHeartbeat !== false,
    }
  }

  // 获取管理器ID
  getId() {
    return this.id
  }

  // 连接WebSocket
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.config.url)

      this.ws.onopen = () => {
        this.connection.isConnected = true
        this.connection.error = null
        this.reconnectAttempts = 0
        console.log(`[${this.id}] ${this.config.url} WebSocket connected`)
        if (this.config.enableHeartbeat) {
          this.startHeartbeat()
        }
        this.connectionHandlers.forEach((handler) => handler(true))
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.connection.lastMessage = data
          this.connection.lastUpdate = Date.now()
          this.messageHandlers.forEach((handler) => handler(data))
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      this.ws.onclose = () => {
        this.connection.isConnected = false
        console.log(`[${this.id}] ${this.config.url} WebSocket disconnected`)
        if (this.config.enableHeartbeat) {
          this.stopHeartbeat()
        }
        this.connectionHandlers.forEach((handler) => handler(false))
        this.closeHandlers.forEach((handler) => handler())
      }

      this.ws.onerror = (error) => {
        console.error(`[${this.id}] ${this.config.url} WebSocket error:`, error)
        this.connection.error = 'WebSocket连接错误'
        this.errorHandlers.forEach((handler) => handler(error))
      }
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      this.connection.error = '创建WebSocket连接失败'
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connection.isConnected = false
    if (this.config.enableHeartbeat) {
      this.stopHeartbeat()
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // 发送消息
  sendMessage(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送消息')
      return false
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('发送WebSocket消息失败:', error)
      return false
    }
  }

  // 发送订阅消息
  subscribe(updateInterval = 1000) {
    return this.sendMessage({
      type: 'subscribe',
      update_interval: updateInterval,
    })
  }

  // 发送取消订阅消息
  unsubscribe() {
    return this.sendMessage({
      type: 'unsubscribe',
    })
  }

  // 添加消息处理器
  addMessageHandler(handler: (message: any) => void) {
    this.messageHandlers.push(handler)
  }

  // 移除消息处理器
  removeMessageHandler(handler: (message: any) => void) {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  // 添加连接状态处理器
  addConnectionHandler(handler: (connected: boolean) => void) {
    this.connectionHandlers.push(handler)
  }

  // 移除连接状态处理器
  removeConnectionHandler(handler: (connected: boolean) => void) {
    const index = this.connectionHandlers.indexOf(handler)
    if (index > -1) {
      this.connectionHandlers.splice(index, 1)
    }
  }

  // 添加错误处理器
  addErrorHandler(handler: (error: Event) => void) {
    this.errorHandlers.push(handler)
  }

  // 移除错误处理器
  removeErrorHandler(handler: (error: Event) => void) {
    const index = this.errorHandlers.indexOf(handler)
    if (index > -1) {
      this.errorHandlers.splice(index, 1)
    }
  }

  // 添加关闭处理器
  addCloseHandler(handler: () => void) {
    this.closeHandlers.push(handler)
  }

  // 移除关闭处理器
  removeCloseHandler(handler: () => void) {
    const index = this.closeHandlers.indexOf(handler)
    if (index > -1) {
      this.closeHandlers.splice(index, 1)
    }
  }

  // 开始心跳
  private startHeartbeat() {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'ping',
          timestamp: Date.now(),
        })
      }
    }, this.config.heartbeatInterval)
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 获取连接状态
  get isConnected() {
    return this.connection.isConnected
  }

  // 获取最后更新时间
  get lastUpdate() {
    return this.connection.lastUpdate
  }

  // 获取最后消息
  get lastMessage() {
    return this.connection.lastMessage
  }
}

// =============================================
// WebSocket管理器类定义
// =============================================

// 通用WebSocket管理器工厂函数
export const createWebSocketManager = (
  url: string,
  options: {
    heartbeatInterval?: number
    reconnectInterval?: number
    maxReconnectAttempts?: number
    autoReconnect?: boolean
    enableHeartbeat?: boolean
  } = {},
) => {
  const config: WSConfig = {
    url,
    heartbeatInterval: options.heartbeatInterval || 30000,
    reconnectInterval: options.reconnectInterval || 5000,
    maxReconnectAttempts: options.maxReconnectAttempts || 5,
    autoReconnect: options.autoReconnect,
    enableHeartbeat: options.enableHeartbeat,
  }

  return new GameWebSocketManager(`custom-${url}`, config)
}

// 日志WebSocket专用管理器
export const createLogsWebSocketManager = (url: string = WS_ENDPOINTS.LOGS) => {
  return createWebSocketManager(url, {
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  })
}

// 通用事件WebSocket管理器
export const createEventWebSocketManager = (url: string) => {
  return createWebSocketManager(url, {
    heartbeatInterval: 30000,
    reconnectInterval: 3000,
    maxReconnectAttempts: 3,
  })
}

// =============================================
// 全局WebSocket管理器注册表
// =============================================

// 全局管理器注册表
class GlobalWebSocketRegistry {
  private managers: Map<string, GameWebSocketManager> = new Map()
  private initializedTypes: Set<WSEndpointType> = new Set()

  // 获取或创建管理器
  getManager(type: WSEndpointType): GameWebSocketManager {
    const managerId = type

    if (!this.managers.has(managerId)) {
      const endpoint = WS_ENDPOINTS[type]
      const config = WS_MANAGER_CONFIGS[type]

      const wsConfig: WSConfig = {
        url: endpoint,
        ...config,
      }

      const manager = new GameWebSocketManager(managerId, wsConfig)
      this.managers.set(managerId, manager)
      this.initializedTypes.add(type)
    }

    return this.managers.get(managerId)!
  }

  // 获取所有管理器
  getAllManagers(): GameWebSocketManager[] {
    return Array.from(this.managers.values())
  }

  // 获取已初始化的端点类型
  getInitializedTypes(): WSEndpointType[] {
    return Array.from(this.initializedTypes)
  }

  // 断开所有连接
  disconnectAll(): void {
    this.managers.forEach((manager) => manager.disconnect())
  }

  // 获取连接状态
  getConnectionStatus(): Record<WSEndpointType, boolean> {
    const status: Record<string, boolean> = {}
    this.initializedTypes.forEach((type) => {
      const manager = this.managers.get(type)
      status[type] = manager ? manager.isConnected : false
    })
    return status as Record<WSEndpointType, boolean>
  }

  // 清理未使用的管理器
  cleanup(): void {
    const activeTypes = this.getInitializedTypes()
    for (const [id, manager] of this.managers) {
      if (!activeTypes.some((type) => type === id) && !manager.isConnected) {
        this.managers.delete(id)
      }
    }
  }
}

// 全局注册表实例
const globalRegistry = new GlobalWebSocketRegistry()

// =============================================
// 全局WebSocket管理API
// =============================================

// 获取指定类型的WebSocket管理器
export const getWebSocketManager = (type: WSEndpointType): GameWebSocketManager => {
  return globalRegistry.getManager(type)
}

// 获取所有管理器
export const getAllWebSocketManagers = (): GameWebSocketManager[] => {
  return globalRegistry.getAllManagers()
}

// 连接指定类型的WebSocket
export const connectWebSocket = (type: WSEndpointType): void => {
  const manager = globalRegistry.getManager(type)
  manager.connect()
}

// 断开指定类型的WebSocket
export const disconnectWebSocket = (type: WSEndpointType): void => {
  const manager = globalRegistry.getManager(type)
  manager.disconnect()
}

// 断开所有WebSocket连接
export const disconnectAllWebSockets = (): void => {
  globalRegistry.disconnectAll()
}

// 获取连接状态
export const getWebSocketStatus = (): Record<WSEndpointType, boolean> => {
  return globalRegistry.getConnectionStatus()
}

// 订阅消息
export const subscribeWebSocket = (type: WSEndpointType, updateInterval = 1000): boolean => {
  const manager = globalRegistry.getManager(type)
  return manager.subscribe(updateInterval)
}

// 取消订阅
export const unsubscribeWebSocket = (type: WSEndpointType): boolean => {
  const manager = globalRegistry.getManager(type)
  return manager.unsubscribe()
}

// 发送自定义消息
export const sendWebSocketMessage = (type: WSEndpointType, message: any): boolean => {
  const manager = globalRegistry.getManager(type)
  return manager.sendMessage(message)
}

// =============================================
// 便捷函数
// =============================================

// =============================================
// 便捷函数 - 游戏相关端点
// =============================================

export const connectPlayerWS = () => connectWebSocket('PLAYER')
export const disconnectPlayerWS = () => disconnectWebSocket('PLAYER')
export const subscribePlayerWS = (interval = 500) => subscribeWebSocket('PLAYER', interval)

export const connectWorldWS = () => connectWebSocket('WORLD')
export const disconnectWorldWS = () => disconnectWebSocket('WORLD')
export const subscribeWorldWS = (interval = 2000) => subscribeWebSocket('WORLD', interval)

export const connectMarkerWS = () => connectWebSocket('MARKER')
export const disconnectMarkerWS = () => disconnectWebSocket('MARKER')
export const subscribeMarkerWS = (interval = 0) => subscribeWebSocket('MARKER', interval)

export const connectLogsWS = () => connectWebSocket('LOGS')
export const disconnectLogsWS = () => disconnectWebSocket('LOGS')
export const subscribeLogsWS = () => subscribeWebSocket('LOGS')

// =============================================
// 其他便捷函数
// =============================================

export const disconnectAllWS = disconnectAllWebSockets
