import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { WSEndpointType } from './websocket'
import { updateEndpointData } from '../stores/websocketData'
import {
  generatePlayerData,
  generateWorldData,
  generateLogEntry,
  generateTokenUsageData,
  generateTaskData,
  DEFAULT_MOCK_CONFIGS,
  type MockDataConfig,
} from '../utils/mockDataGenerators'

/**
 * 模拟WebSocket服务
 * 用于在没有真实服务端的情况下测试WebSocket功能
 */

export interface MockConnectionStatus {
  connected: boolean
  lastConnected?: number
  lastDisconnected?: number
  messageCount: number
  errorCount: number
  lastError?: string
}

export interface MockWebSocketServiceState {
  isEnabled: boolean
  connections: Record<WSEndpointType, MockConnectionStatus>
  configs: Record<string, MockDataConfig>
  timers: Record<string, number>
  totalMessages: number
}

// 模拟服务状态
const mockState = reactive<MockWebSocketServiceState>({
  isEnabled: false,
  connections: {} as Record<WSEndpointType, MockConnectionStatus>,
  configs: { ...DEFAULT_MOCK_CONFIGS },
  timers: {},
  totalMessages: 0,
})

// 所有支持的端点
const ALL_ENDPOINTS: WSEndpointType[] = [
  'PLAYER',
  'WORLD',
  'MARKER',
  'LOGS',
  'MCP_LOGS',
  'TOKEN_USAGE',
  'TASK_MANAGER',
]

// 初始化连接状态
ALL_ENDPOINTS.forEach((endpoint) => {
  mockState.connections[endpoint] = {
    connected: false,
    messageCount: 0,
    errorCount: 0,
    lastConnected: undefined,
    lastDisconnected: undefined,
    lastError: undefined,
  }
})

/**
 * 模拟WebSocket管理器类
 * 模拟真实WebSocket的行为
 */
export class MockWebSocketManager {
  private endpoint: WSEndpointType
  private messageHandlers: ((message: any) => void)[] = []
  private connectionHandlers: ((connected: boolean) => void)[] = []
  private errorHandlers: ((error: Event) => void)[] = []
  private closeHandlers: (() => void)[] = []

  constructor(endpoint: WSEndpointType) {
    this.endpoint = endpoint
  }

  // 模拟连接
  async connect(): Promise<void> {
    if (!mockState.isEnabled) {
      throw new Error('模拟服务未启用')
    }

    // 模拟连接延迟
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100))

    const connection = mockState.connections[this.endpoint]
    connection.connected = true
    connection.lastConnected = Date.now()
    console.log(`[MockWS] ${this.endpoint} 连接状态已更新:`, connection)

    console.log(`[MockWS] ${this.endpoint} 模拟连接已建立`)

    // 触发连接事件
    this.connectionHandlers.forEach((handler) => handler(true))

    // 立即同步全局连接状态
    setTimeout(async () => {
      const { syncConnectionStatus } = await import('./globalWebSocketService')
      syncConnectionStatus()
      console.log(`[MockWS] ${this.endpoint} 全局连接状态已同步`)
    }, 100)

    // 连接成功后自动开始数据推送
    setTimeout(() => {
      this.startDataPush()
      console.log(`[MockWS] ${this.endpoint} 自动开始数据推送`)
    }, 1000)
  }

  // 模拟断开连接
  disconnect(): void {
    const connection = mockState.connections[this.endpoint]
    connection.connected = false
    connection.lastDisconnected = Date.now()

    console.log(`[MockWS] ${this.endpoint} 模拟连接已断开`)

    // 停止数据推送
    this.stopDataPush()

    // 触发断开连接事件
    this.connectionHandlers.forEach((handler) => handler(false))
    this.closeHandlers.forEach((handler) => handler())
  }

  // 模拟发送消息
  sendMessage(message: any): boolean {
    if (!this.isConnected) {
      console.warn(`[MockWS] ${this.endpoint} 未连接，无法发送消息`)
      return false
    }

    console.log(`[MockWS] ${this.endpoint} 发送消息:`, message)

    // 模拟服务端响应
    if (message.type === 'ping') {
      setTimeout(
        () => {
          this.simulateMessage({
            type: 'pong',
            timestamp: Date.now(),
          })
        },
        Math.random() * 100 + 10,
      )
    } else if (message.type === 'subscribe') {
      // 开始数据推送
      this.startDataPush()
    } else if (message.type === 'unsubscribe') {
      // 停止数据推送
      this.stopDataPush()
    }

    return true
  }

  // 模拟订阅
  subscribe(updateInterval = 1000): boolean {
    return this.sendMessage({
      type: 'subscribe',
      update_interval: updateInterval,
    })
  }

  // 模拟取消订阅
  unsubscribe(): boolean {
    return this.sendMessage({
      type: 'unsubscribe',
    })
  }

  // 添加消息处理器
  addMessageHandler(handler: (message: any) => void): void {
    this.messageHandlers.push(handler)
  }

  // 添加连接状态处理器
  addConnectionHandler(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler)
  }

  // 添加错误处理器
  addErrorHandler(handler: (error: Event) => void): void {
    this.errorHandlers.push(handler)
  }

  // 添加关闭处理器
  addCloseHandler(handler: () => void): void {
    this.closeHandlers.push(handler)
  }

  // 获取连接状态
  get isConnected(): boolean {
    return mockState.connections[this.endpoint].connected
  }

  // 获取管理器ID
  getId(): string {
    return this.endpoint
  }

  // 模拟接收消息
  private simulateMessage(message: any): void {
    const connection = mockState.connections[this.endpoint]
    connection.messageCount++
    mockState.totalMessages++

    console.log(`[MockWS] ${this.endpoint} 接收消息:`, message)

    // 触发消息处理器
    this.messageHandlers.forEach((handler) => handler(message))
  }

  // 开始数据推送
  private startDataPush(): void {
    const configKey = this.endpoint.toLowerCase()
    const config = mockState.configs[configKey]

    console.log(`[MockWS] ${this.endpoint} 开始数据推送，配置:`, config)

    if (!config || !config.enabled) {
      console.log(`[MockWS] ${this.endpoint} 数据推送被禁用或配置不存在`)
      return
    }

    // 清除现有定时器
    if (mockState.timers[this.endpoint]) {
      clearInterval(mockState.timers[this.endpoint])
    }

    // 创建新定时器
    mockState.timers[this.endpoint] = window.setInterval(() => {
      if (!this.isConnected) {
        console.log(`[MockWS] ${this.endpoint} 未连接，跳过数据推送`)
        return
      }

      console.log(`[MockWS] ${this.endpoint} 定时推送数据...`)
      try {
        const data = this.generateEndpointData()
        if (data) {
          this.simulateMessage(data)
        } else {
          console.log(`[MockWS] ${this.endpoint} 生成数据失败`)
        }
      } catch (error) {
        console.error(`[MockWS] ${this.endpoint} 数据生成错误:`, error)
        const connection = mockState.connections[this.endpoint]
        connection.errorCount++
        connection.lastError = String(error)
      }
    }, config.interval)

    console.log(`[MockWS] ${this.endpoint} 数据推送定时器已设置，间隔: ${config.interval}ms`)

    console.log(`[MockWS] ${this.endpoint} 开始数据推送，间隔: ${config.interval}ms`)
  }

  // 停止数据推送
  private stopDataPush(): void {
    if (mockState.timers[this.endpoint]) {
      clearInterval(mockState.timers[this.endpoint])
      delete mockState.timers[this.endpoint]
      console.log(`[MockWS] ${this.endpoint} 停止数据推送`)
    }
  }

  // 生成端点对应的数据
  private generateEndpointData(): any {
    switch (this.endpoint) {
      case 'PLAYER':
        return {
          type: 'player_update',
          data: generatePlayerData(),
        }

      case 'WORLD':
        return {
          type: 'world_update',
          data: generateWorldData(),
        }

      case 'LOGS':
        const logData = generateLogEntry(false)
        return {
          type: 'log',
          timestamp: logData.timestamp,
          level: logData.level,
          module: logData.module,
          message: logData.message,
          formatted_timestamp: logData.formatted_timestamp,
        }

      case 'MCP_LOGS':
        const mcpLogData = generateLogEntry(true)
        return {
          type: 'log',
          timestamp: mcpLogData.timestamp,
          level: mcpLogData.level,
          module: mcpLogData.module,
          message: mcpLogData.message,
          formatted_timestamp: mcpLogData.formatted_timestamp,
        }

      case 'TOKEN_USAGE':
        const tokenData = generateTokenUsageData()
        return {
          type: 'token_usage_update',
          data: tokenData,
        }

      case 'TASK_MANAGER':
        const taskList = generateTaskData()
        return {
          type: 'tasks_list',
          data: {
            tasks: taskList,
          },
        }

      default:
        return {
          type: 'unknown_data',
          data: { message: `${this.endpoint} 的模拟数据` },
        }
    }
  }
}

// 模拟管理器注册表
const mockManagers = new Map<WSEndpointType, MockWebSocketManager>()

/**
 * 获取模拟WebSocket管理器
 */
export const getMockWebSocketManager = (endpoint: WSEndpointType): MockWebSocketManager => {
  if (!mockManagers.has(endpoint)) {
    const manager = new MockWebSocketManager(endpoint)

    // 添加消息处理器，将数据更新到全局存储
    manager.addMessageHandler((message) => {
      try {
        console.log(`[MockWS] ${endpoint} 准备更新数据:`, message)
        updateEndpointData(endpoint, message)
        console.log(`[MockWS] ${endpoint} 数据已更新到全局存储`)
      } catch (error) {
        console.error(`[MockWS] ${endpoint} 数据更新失败:`, error)
      }
    })

    mockManagers.set(endpoint, manager)
  }
  return mockManagers.get(endpoint)!
}

/**
 * 启用模拟服务
 */
export const enableMockService = (): void => {
  mockState.isEnabled = true
  console.log('[MockWS] 模拟WebSocket服务已启用')
  ElMessage.success('模拟WebSocket服务已启用')
}

/**
 * 禁用模拟服务
 */
export const disableMockService = (): void => {
  mockState.isEnabled = false

  // 断开所有模拟连接
  ALL_ENDPOINTS.forEach((endpoint) => {
    const manager = mockManagers.get(endpoint)
    if (manager && manager.isConnected) {
      manager.disconnect()
    }
  })

  // 清除所有定时器
  Object.values(mockState.timers).forEach((timer) => {
    clearInterval(timer)
  })
  mockState.timers = {}

  console.log('[MockWS] 模拟WebSocket服务已禁用')
  ElMessage.info('模拟WebSocket服务已禁用')
}

/**
 * 获取模拟服务状态
 */
export const getMockServiceState = () => mockState

/**
 * 更新模拟配置
 */
export const updateMockConfig = (endpoint: string, config: Partial<MockDataConfig>): void => {
  if (mockState.configs[endpoint]) {
    Object.assign(mockState.configs[endpoint], config)
    console.log(`[MockWS] ${endpoint} 配置已更新:`, config)
  }
}

/**
 * 手动触发数据推送
 */
export const triggerManualPush = (endpoint: WSEndpointType): void => {
  const manager = mockManagers.get(endpoint)
  if (manager && manager.isConnected) {
    try {
      const data = (manager as any).generateEndpointData()
      if (data) {
        ;(manager as any).simulateMessage(data)
        ElMessage.success(`${endpoint} 数据推送成功`)
      }
    } catch (error) {
      console.error(`[MockWS] ${endpoint} 手动推送失败:`, error)
      ElMessage.error(`${endpoint} 数据推送失败`)
    }
  } else {
    ElMessage.warning(`${endpoint} 未连接`)
  }
}

/**
 * 模拟任务操作
 */
export const simulateTaskOperation = (
  operation: 'add' | 'update' | 'delete' | 'complete',
  taskData?: any,
): void => {
  const manager = mockManagers.get('TASK_MANAGER')
  if (!manager || !manager.isConnected) {
    ElMessage.warning('任务管理器未连接')
    return
  }

  try {
    let responseData
    const taskId = taskData?.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    switch (operation) {
      case 'add':
        responseData = {
          type: 'task_added',
          data: {
            task: {
              id: taskId,
              details: taskData?.details || '新建任务',
              done_criteria: taskData?.done_criteria || '完成条件',
              progress: '未开始',
              done: false,
              priority: taskData?.priority || 'medium',
              category: taskData?.category || 'other',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...taskData,
            },
          },
          message: '任务已成功添加',
          success: true,
        }
        break

      case 'update':
        responseData = {
          type: 'task_updated',
          data: {
            task: {
              id: taskId,
              updated_at: new Date().toISOString(),
              ...taskData,
            },
          },
          message: '任务已成功更新',
          success: true,
        }
        break

      case 'delete':
        responseData = {
          type: 'task_deleted',
          data: {
            task_id: taskId,
          },
          message: '任务已成功删除',
          success: true,
        }
        break

      case 'complete':
        responseData = {
          type: 'task_marked_done',
          data: {
            task: {
              id: taskId,
              done: true,
              progress: '已完成',
              updated_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              ...taskData,
            },
          },
          message: '任务已标记为完成',
          success: true,
        }
        break

      default:
        throw new Error(`未知的任务操作: ${operation}`)
    }

    // 模拟消息
    ;(manager as any).simulateMessage(responseData)

    // 延迟发送更新的任务列表
    setTimeout(() => {
      const updatedTaskList = generateTaskData()
      const updatedListData = {
        type: 'tasks_list',
        data: {
          tasks: updatedTaskList,
        },
      }
      ;(manager as any).simulateMessage(updatedListData)
      console.log(`[MockWS] 任务操作后发送更新列表，包含 ${updatedTaskList.length} 个任务`)
    }, 500)

    console.log(`[MockWS] 任务操作 ${operation} 模拟完成:`, responseData)
    ElMessage.success(`任务操作 ${operation} 模拟成功`)
  } catch (error) {
    console.error(`[MockWS] 任务操作模拟失败:`, error)
    ElMessage.error(`任务操作模拟失败: ${error}`)
  }
}

/**
 * 模拟连接错误
 */
export const simulateConnectionError = (
  endpoint: WSEndpointType,
  errorMessage = '模拟连接错误',
): void => {
  const connection = mockState.connections[endpoint]
  connection.errorCount++
  connection.lastError = errorMessage

  const manager = mockManagers.get(endpoint)
  if (manager) {
    const errorEvent = new Event('error') as any
    errorEvent.message = errorMessage
    ;(manager as any).errorHandlers.forEach((handler: any) => handler(errorEvent))
  }

  console.log(`[MockWS] ${endpoint} 模拟错误:`, errorMessage)
  ElMessage.error(`${endpoint}: ${errorMessage}`)
}

/**
 * 重置模拟统计数据
 */
export const resetMockStats = (): void => {
  ALL_ENDPOINTS.forEach((endpoint) => {
    const connection = mockState.connections[endpoint]
    connection.messageCount = 0
    connection.errorCount = 0
    connection.lastError = undefined
  })
  mockState.totalMessages = 0
  ElMessage.success('模拟统计数据已重置')
}

/**
 * 批量连接所有端点
 */
export const connectAllMockEndpoints = async (): Promise<void> => {
  if (!mockState.isEnabled) {
    ElMessage.warning('请先启用模拟服务')
    return
  }

  const promises = ALL_ENDPOINTS.map(async (endpoint) => {
    try {
      const manager = getMockWebSocketManager(endpoint)
      await manager.connect()
    } catch (error) {
      console.error(`[MockWS] ${endpoint} 连接失败:`, error)
    }
  })

  await Promise.allSettled(promises)

  const connectedCount = ALL_ENDPOINTS.filter(
    (endpoint) => mockState.connections[endpoint].connected,
  ).length

  // 强制同步全局连接状态
  setTimeout(async () => {
    const { syncConnectionStatus } = await import('./globalWebSocketService')
    syncConnectionStatus()
    console.log(`[MockWS] 批量连接后全局状态已同步`)
  }, 200)

  ElMessage.success(`模拟连接完成！已连接 ${connectedCount}/${ALL_ENDPOINTS.length} 个端点`)
}

/**
 * 批量断开所有端点
 */
export const disconnectAllMockEndpoints = (): void => {
  let disconnectedCount = 0

  ALL_ENDPOINTS.forEach((endpoint) => {
    const manager = mockManagers.get(endpoint)
    if (manager && manager.isConnected) {
      manager.disconnect()
      disconnectedCount++
    }
  })

  ElMessage.success(`已断开 ${disconnectedCount} 个模拟连接`)
}

console.log('[MockWebSocketService] 模拟WebSocket服务已初始化')
