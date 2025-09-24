import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  type WSEndpointType,
  getWebSocketManager,
  WS_MANAGER_CONFIGS,
  subscribeWebSocket,
} from './websocket'
import { updateEndpointData } from '../stores/websocketData'

// 全局连接状态管理
export interface GlobalConnectionStatus {
  isConnecting: boolean
  allConnected: boolean
  connectionCount: number
  totalEndpoints: number
  connectionStatus: Record<WSEndpointType, boolean>
  connectionDetails: Record<
    WSEndpointType,
    {
      connected: boolean
      lastConnected?: number
      lastDisconnected?: number
      messageCount: number
      errorCount: number
      lastError?: string
    }
  >
}

// 所有需要连接的端点类型
const ALL_ENDPOINTS: WSEndpointType[] = [
  'PLAYER',
  'WORLD',
  'MARKER',
  'LOGS',
  'LOGS_ALT',
  'TOKEN_USAGE',
  'EVENTS',
  'TASK_MANAGER',
  'GENERAL',
  'STATUS',
]

// 每个端点的默认订阅配置
const ENDPOINT_SUBSCRIPTION_CONFIGS: Record<
  WSEndpointType,
  {
    enabled: boolean
    updateInterval?: number
    customSubscription?: () => boolean
  }
> = {
  PLAYER: {
    enabled: true,
    updateInterval: 500, // 高频更新玩家状态
  },
  WORLD: {
    enabled: true,
    updateInterval: 2000, // 世界信息更新频率较低
  },
  MARKER: {
    enabled: true,
    updateInterval: 0, // 标记不需要定时更新
  },
  LOGS: {
    enabled: true,
    customSubscription: () => {
      // 日志需要特殊的订阅消息
      const manager = getWebSocketManager('LOGS')
      return manager.sendMessage({
        type: 'subscribe',
        levels: ['INFO', 'WARN', 'ERROR', 'DEBUG'], // 订阅所有级别
        // 不指定modules表示订阅所有模块
      })
    },
  },
  LOGS_ALT: {
    enabled: true,
    customSubscription: () => {
      const manager = getWebSocketManager('LOGS_ALT')
      return manager.sendMessage({
        type: 'subscribe',
        levels: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
      })
    },
  },
  TOKEN_USAGE: {
    enabled: true,
    customSubscription: () => {
      // Token使用量监控需要发送订阅消息
      const manager = getWebSocketManager('TOKEN_USAGE')
      return manager.sendMessage({
        type: 'subscribe',
        update_interval: 0, // 实时推送
        model_filter: null, // 不过滤模型
      })
    },
  },
  EVENTS: {
    enabled: true,
    customSubscription: () => {
      // 事件需要特殊的订阅消息
      const manager = getWebSocketManager('EVENTS')
      return manager.sendMessage({
        type: 'subscribe',
        event_types: ['all'], // 订阅所有事件类型
        timestamp: Date.now(),
      })
    },
  },
  TASK_MANAGER: {
    enabled: true,
    customSubscription: () => {
      // 任务管理器需要发送订阅消息
      const manager = getWebSocketManager('TASK_MANAGER')
      return manager.sendMessage({
        type: 'subscribe',
        update_interval: 5000,
      })
    },
  },
  GENERAL: {
    enabled: true,
    updateInterval: 10000, // 通用端点低频更新
  },
  STATUS: {
    enabled: true,
    updateInterval: 3000, // 状态信息中等频率更新
  },
}

// 全局连接状态
const globalStatus = reactive<GlobalConnectionStatus>({
  isConnecting: false,
  allConnected: false,
  connectionCount: 0,
  totalEndpoints: ALL_ENDPOINTS.length,
  connectionStatus: {} as Record<WSEndpointType, boolean>,
  connectionDetails: {} as Record<WSEndpointType, any>,
})

/**
 * 格式化错误信息，确保错误能够正确显示
 */
function formatError(error: any): string {
  if (error instanceof Error) {
    return error.message || error.toString()
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    try {
      // 尝试序列化对象，限制长度避免过长
      const serialized = JSON.stringify(error, null, 2)
      return serialized.length > 200 ? serialized.substring(0, 200) + '...' : serialized
    } catch {
      // 如果序列化失败，尝试提取有用的属性
      if (error.message) return error.message
      if (error.code) return `错误代码: ${error.code}`
      if (error.status) return `状态码: ${error.status}`
      return '未知错误对象'
    }
  }

  return String(error)
}

// 初始化连接详情
ALL_ENDPOINTS.forEach((endpoint) => {
  globalStatus.connectionStatus[endpoint] = false
  globalStatus.connectionDetails[endpoint] = {
    connected: false,
    messageCount: 0,
    errorCount: 0,
  }
})

/**
 * 为指定端点发送订阅消息
 */
function subscribeToEndpoint(endpoint: WSEndpointType): boolean {
  const config = ENDPOINT_SUBSCRIPTION_CONFIGS[endpoint]

  if (!config.enabled) {
    return false
  }

  try {
    // 如果有自定义订阅函数，使用自定义函数
    if (config.customSubscription) {
      return config.customSubscription()
    }

    // 否则使用标准订阅
    if (config.updateInterval !== undefined) {
      return subscribeWebSocket(endpoint, config.updateInterval)
    }

    return subscribeWebSocket(endpoint)
  } catch (error) {
    console.error(`[GlobalWS] ${endpoint} 订阅失败:`, error)
    return false
  }
}

/**
 * 连接所有WebSocket端点
 */
export async function connectAllWebSockets(): Promise<void> {
  if (globalStatus.isConnecting) {
    ElMessage.warning('正在连接中，请稍候...')
    return
  }

  globalStatus.isConnecting = true
  ElMessage.info('开始连接所有WebSocket端点...')

  try {
    const connectionPromises = ALL_ENDPOINTS.map(async (endpoint) => {
      try {
        const manager = getWebSocketManager(endpoint)

        // 添加连接状态监听
        const connectionHandler = (connected: boolean) => {
          globalStatus.connectionStatus[endpoint] = connected
          const details = globalStatus.connectionDetails[endpoint]

          if (connected) {
            details.connected = true
            details.lastConnected = Date.now()

            // 连接成功后自动订阅
            setTimeout(() => {
              const subscribeSuccess = subscribeToEndpoint(endpoint)
              console.log(`[GlobalWS] ${endpoint} 自动订阅${subscribeSuccess ? '成功' : '失败'}`)
            }, 1000) // 延迟1秒确保连接稳定
          } else {
            details.connected = false
            details.lastDisconnected = Date.now()
          }

          updateGlobalStatus()
        }

        // 添加消息计数监听和数据更新
        const messageHandler = (message: any) => {
          globalStatus.connectionDetails[endpoint].messageCount++

          // 更新全局数据存储
          try {
            updateEndpointData(endpoint, message)
          } catch (error) {
            console.error(`[GlobalWS] ${endpoint} 数据更新失败:`, error)
          }
        }

        // 添加错误监听
        const errorHandler = (error: Event) => {
          const details = globalStatus.connectionDetails[endpoint]
          details.errorCount++
          details.lastError = formatError(error)
        }

        // 检查是否已经有全局处理器，避免重复添加
        if (!(manager as any)._hasGlobalConnectionHandler) {
          manager.addConnectionHandler(connectionHandler)
          ;(manager as any)._hasGlobalConnectionHandler = true
        }

        if (!(manager as any)._hasGlobalMessageHandler) {
          manager.addMessageHandler(messageHandler)
          ;(manager as any)._hasGlobalMessageHandler = true
        }

        if (!(manager as any)._hasGlobalErrorHandler) {
          manager.addErrorHandler(errorHandler)
          ;(manager as any)._hasGlobalErrorHandler = true
        }

        // 连接WebSocket
        await manager.connect()

        // 连接完成后立即检查连接状态
        const isConnected = manager.isConnected
        globalStatus.connectionStatus[endpoint] = isConnected
        if (isConnected) {
          globalStatus.connectionDetails[endpoint].connected = true
          globalStatus.connectionDetails[endpoint].lastConnected = Date.now()
        }

        console.log(`[GlobalWS] ${endpoint} 连接${isConnected ? '成功' : '失败'}`)
      } catch (error) {
        console.error(`[GlobalWS] ${endpoint} 连接失败:`, error)
        globalStatus.connectionDetails[endpoint].errorCount++
        globalStatus.connectionDetails[endpoint].lastError = formatError(error)
      }
    })

    await Promise.allSettled(connectionPromises)

    // 立即更新全局状态
    updateGlobalStatus()

    // 等待连接状态稳定，给连接状态更新一些时间
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 再次更新状态以确保准确性
    updateGlobalStatus()

    const connectedCount = Object.values(globalStatus.connectionStatus).filter(Boolean).length

    // 调试信息：显示每个端点的连接状态
    console.log('[GlobalWS] 连接状态详情:', globalStatus.connectionStatus)
    console.log('[GlobalWS] 连接详情:', globalStatus.connectionDetails)

    ElMessage.success(`连接完成！已连接 ${connectedCount}/${ALL_ENDPOINTS.length} 个端点`)
  } catch (error) {
    console.error('[GlobalWS] 连接过程出错:', error)
    ElMessage.error('连接过程出现错误')
  } finally {
    globalStatus.isConnecting = false
    updateGlobalStatus()
  }
}

/**
 * 断开所有WebSocket连接
 */
export function disconnectAllWebSockets(): void {
  ElMessage.info('正在断开所有WebSocket连接...')

  let disconnectedCount = 0
  ALL_ENDPOINTS.forEach((endpoint) => {
    try {
      const manager = getWebSocketManager(endpoint)
      if (manager.isConnected) {
        manager.disconnect()
        disconnectedCount++
      }

      globalStatus.connectionStatus[endpoint] = false
      globalStatus.connectionDetails[endpoint].connected = false
      globalStatus.connectionDetails[endpoint].lastDisconnected = Date.now()
    } catch (error) {
      console.error(`[GlobalWS] 断开 ${endpoint} 失败:`, error)
    }
  })

  updateGlobalStatus()
  ElMessage.success(`已断开 ${disconnectedCount} 个连接`)
}

/**
 * 更新全局连接状态
 */
function updateGlobalStatus(): void {
  const connectedEndpoints = Object.values(globalStatus.connectionStatus).filter(Boolean)
  globalStatus.connectionCount = connectedEndpoints.length
  globalStatus.allConnected = globalStatus.connectionCount === ALL_ENDPOINTS.length
}

/**
 * 获取全局连接状态
 */
export function getGlobalConnectionStatus(): GlobalConnectionStatus {
  return globalStatus
}

/**
 * 获取特定端点的连接状态
 */
export function getEndpointStatus(endpoint: WSEndpointType): boolean {
  return globalStatus.connectionStatus[endpoint] || false
}

/**
 * 获取所有端点类型
 */
export function getAllEndpoints(): WSEndpointType[] {
  return [...ALL_ENDPOINTS]
}

/**
 * 连接单个端点
 */
export async function connectSingleEndpoint(endpoint: WSEndpointType): Promise<void> {
  try {
    const manager = getWebSocketManager(endpoint)

    // 添加连接状态监听器（如果还没有的话）
    const connectionHandler = (connected: boolean) => {
      globalStatus.connectionStatus[endpoint] = connected
      const details = globalStatus.connectionDetails[endpoint]

      if (connected) {
        details.connected = true
        details.lastConnected = Date.now()

        // 连接成功后自动订阅
        setTimeout(() => {
          const subscribeSuccess = subscribeToEndpoint(endpoint)
          console.log(
            `[GlobalWS] ${endpoint} 单独连接自动订阅${subscribeSuccess ? '成功' : '失败'}`,
          )
        }, 1000)
      } else {
        details.connected = false
        details.lastDisconnected = Date.now()
      }

      updateGlobalStatus()
    }

    // 检查是否已经有连接处理器，避免重复添加
    if (!(manager as any)._hasGlobalConnectionHandler) {
      manager.addConnectionHandler(connectionHandler)
      ;(manager as any)._hasGlobalConnectionHandler = true
    }

    await manager.connect()
    ElMessage.success(`${endpoint} 连接成功`)
  } catch (error) {
    console.error(`[GlobalWS] ${endpoint} 连接失败:`, error)
    ElMessage.error(`${endpoint} 连接失败`)
    globalStatus.connectionDetails[endpoint].errorCount++
    globalStatus.connectionDetails[endpoint].lastError = formatError(error)
  }
}

/**
 * 手动为单个端点发送订阅消息
 */
export function subscribeSingleEndpoint(endpoint: WSEndpointType): boolean {
  return subscribeToEndpoint(endpoint)
}

/**
 * 断开单个端点
 */
export function disconnectSingleEndpoint(endpoint: WSEndpointType): void {
  try {
    const manager = getWebSocketManager(endpoint)
    manager.disconnect()
    globalStatus.connectionStatus[endpoint] = false
    globalStatus.connectionDetails[endpoint].connected = false
    globalStatus.connectionDetails[endpoint].lastDisconnected = Date.now()
    updateGlobalStatus()
    ElMessage.success(`${endpoint} 连接已断开`)
  } catch (error) {
    console.error(`[GlobalWS] ${endpoint} 断开失败:`, error)
    ElMessage.error(`${endpoint} 断开失败`)
  }
}
