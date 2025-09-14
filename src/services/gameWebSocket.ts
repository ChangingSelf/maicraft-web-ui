import { reactive } from 'vue'

// WebSocket端点配置
export const WS_ENDPOINTS = {
  PLAYER: 'ws://localhost:20914/ws/game/player',
  WORLD: 'ws://localhost:20914/ws/game/world',
  MARKER: 'ws://localhost:20914/ws/game/marker',
  LOGS: 'ws://localhost:8000/ws/logs',
} as const

// WebSocket连接状态
export interface WSConnection {
  isConnected: boolean
  lastMessage: any
  lastUpdate: number
  error: string | null
}

// 游戏数据类型定义
export interface PlayerData {
  name?: string
  health?: number
  max_health?: number
  food?: number
  max_food?: number
  experience?: number
  level?: number
  gamemode?: string
  position?: {
    x: number
    y: number
    z: number
    yaw: number
    pitch: number
    on_ground: boolean
  }
  equipment?: {
    main_hand?: any
    helmet?: any
    chestplate?: any
    leggings?: any
    boots?: any
  }
  inventory?: {
    occupied_slots: number
    total_slots: number
    empty_slots: number
    items: any[]
  }
}

export interface WorldData {
  time?: {
    time_of_day: number
    formatted_time: string
    day_count: number
  }
  weather?: {
    weather: string
    formatted_weather: string
    duration: number
  }
  location?: {
    dimension: string
    biome: string
    light_level: number
  }
  nearby_blocks?: Array<{
    name: string
    position: { x: number; y: number; z: number }
    distance: number
  }>
  nearby_entities?: Array<{
    name: string
    display_name: string
    type: string
    distance: number
    position: { x: number; y: number; z: number }
    health: number
    max_health: number
  }>
}

export interface MarkerData {
  name: string
  info: string
  position: { x: number; y: number; z: number }
  type: string
  created_time: number
  visit_count: number
}

// WebSocket管理器类
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

  private config: {
    url: string
    heartbeatInterval: number
    reconnectInterval: number
    maxReconnectAttempts: number
  }

  private messageHandlers: ((message: any) => void)[] = []
  private connectionHandlers: ((connected: boolean) => void)[] = []

  constructor(
    url: string,
    heartbeatInterval = 30000,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  ) {
    this.config = {
      url,
      heartbeatInterval,
      reconnectInterval,
      maxReconnectAttempts,
    }
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
        console.log(`${this.config.url} WebSocket connected`)
        this.startHeartbeat()
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
        console.log(`${this.config.url} WebSocket disconnected`)
        this.stopHeartbeat()
        this.connectionHandlers.forEach((handler) => handler(false))
      }

      this.ws.onerror = (error) => {
        console.error(`${this.config.url} WebSocket error:`, error)
        this.connection.error = 'WebSocket连接错误'
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
    this.stopHeartbeat()
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

// 全局WebSocket管理器实例
export const gameWSManagers = {
  player: new GameWebSocketManager(WS_ENDPOINTS.PLAYER, 30000, 5000, 5),
  world: new GameWebSocketManager(WS_ENDPOINTS.WORLD, 30000, 5000, 5),
  marker: new GameWebSocketManager(WS_ENDPOINTS.MARKER, 30000, 5000, 5),
  logs: new GameWebSocketManager(WS_ENDPOINTS.LOGS, 30000, 5000, 5),
}

// 游戏数据响应式状态
export const gameData = reactive({
  player: {} as PlayerData,
  world: {} as WorldData,
  markers: [] as MarkerData[],
  logs: [] as any[],
})

// 消息处理函数
const handlePlayerUpdate = (data: any) => {
  Object.assign(gameData.player, data)
}

const handleWorldUpdate = (data: any) => {
  Object.assign(gameData.world, data)
}

const handleMarkerUpdate = (data: any) => {
  if (data.action === 'add' || data.action === 'update') {
    const existingIndex = gameData.markers.findIndex((m) => m.name === data.data.name)
    if (existingIndex > -1) {
      gameData.markers[existingIndex] = data.data
    } else {
      gameData.markers.push(data.data)
    }
  } else if (data.action === 'remove') {
    const index = gameData.markers.findIndex((m) => m.name === data.data.name)
    if (index > -1) {
      gameData.markers.splice(index, 1)
    }
  }
}

const handleLogMessage = (data: any) => {
  if (data.type === 'log') {
    gameData.logs.unshift(data)
    // 限制日志数量
    if (gameData.logs.length > 1000) {
      gameData.logs = gameData.logs.slice(0, 1000)
    }
  }
}

// 注册消息处理器
gameWSManagers.player.addMessageHandler((message) => {
  if (message.type === 'player_update') {
    handlePlayerUpdate(message.data)
  } else if (message.type === 'pong') {
    console.log('Player WebSocket heartbeat received')
  }
})

gameWSManagers.world.addMessageHandler((message) => {
  if (message.type === 'world_update') {
    handleWorldUpdate(message.data)
  } else if (message.type === 'pong') {
    console.log('World WebSocket heartbeat received')
  }
})

gameWSManagers.marker.addMessageHandler((message) => {
  if (message.type === 'marker_update') {
    handleMarkerUpdate(message.data)
  } else if (message.type === 'pong') {
    console.log('Marker WebSocket heartbeat received')
  }
})

gameWSManagers.logs.addMessageHandler((message) => {
  if (message.type === 'log') {
    handleLogMessage(message)
  } else if (message.type === 'pong') {
    console.log('Logs WebSocket heartbeat received')
  }
})

// 导出便捷函数
export const connectPlayerWS = () => gameWSManagers.player.connect()
export const disconnectPlayerWS = () => gameWSManagers.player.disconnect()
export const subscribePlayerWS = (interval = 500) => gameWSManagers.player.subscribe(interval)

export const connectWorldWS = () => gameWSManagers.world.connect()
export const disconnectWorldWS = () => gameWSManagers.world.disconnect()
export const subscribeWorldWS = (interval = 2000) => gameWSManagers.world.subscribe(interval)

export const connectMarkerWS = () => gameWSManagers.marker.connect()
export const disconnectMarkerWS = () => gameWSManagers.marker.disconnect()
export const subscribeMarkerWS = (interval = 0) => gameWSManagers.marker.subscribe(interval)

export const connectLogsWS = () => gameWSManagers.logs.connect()
export const disconnectLogsWS = () => gameWSManagers.logs.disconnect()
export const subscribeLogsWS = () => gameWSManagers.logs.subscribe()

// 断开所有连接
export const disconnectAllWS = () => {
  Object.values(gameWSManagers).forEach((manager) => manager.disconnect())
}
