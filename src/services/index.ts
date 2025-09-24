// API服务统一导出文件
// 提供所有服务的统一入口，便于管理和使用

// HTTP客户端和配置
import { httpClient } from './httpClient'
export { httpClient, api } from './httpClient'
export { API_CONFIG, getApiBaseURL, getApiTimeout, isDebugMode } from '../config/api.config'

// WebSocket管理器
import {
  getWebSocketManager,
  getAllWebSocketManagers,
  connectWebSocket,
  disconnectWebSocket,
  disconnectAllWebSockets,
  getWebSocketStatus,
  subscribeWebSocket,
  unsubscribeWebSocket,
  sendWebSocketMessage,
} from './websocket'

// 核心API服务
import { mcpApi } from './mcp'
import { logService } from './logService'
import { environmentService } from './environmentService'
import { actionService } from './actionService'
import { locationService } from './locationService'
import { gameObjectService } from './gameObjectService'
import { getTaskService } from './taskService'

// WebSocket管理器
export {
  GameWebSocketManager,
  getWebSocketManager,
  getAllWebSocketManagers,
  connectWebSocket,
  disconnectWebSocket,
  disconnectAllWebSockets,
  getWebSocketStatus,
  subscribeWebSocket,
  unsubscribeWebSocket,
  sendWebSocketMessage,
  WS_ENDPOINTS,
} from './websocket'

// WebSocket端点类型 - 单独导出类型
export type { WSEndpointType } from './websocket'

// 全局错误处理器
export {
  globalErrorHandler,
  ErrorLevel,
  ErrorType,
  handleApiError,
  handleValidationError,
  handleNetworkError,
} from './errorHandler'
export type { ErrorInfo, ErrorHandlerConfig } from './errorHandler'

// TypeScript 高级类型工具导出
export * from '../types/index'

// 请求拦截器
export {
  interceptorManager,
  InterceptorPriority,
  AuthInterceptor,
  RequestLoggerInterceptor,
  ResponseFormatterInterceptor,
  RetryInterceptor,
  LoadingInterceptor,
  CacheInterceptor,
  DeduplicationInterceptor,
  createAuthInterceptor,
  createRequestLogger,
  createResponseFormatter,
  createRetryInterceptor,
  createLoadingInterceptor,
  createCacheInterceptor,
  createDeduplicationInterceptor,
  registerAuthInterceptor,
  registerLoggerInterceptors,
  registerDefaultInterceptors,
} from './interceptors'
export type {
  InterceptorConfig,
  EnhancedRequestInterceptor,
  EnhancedResponseInterceptor,
} from './interceptors'

// 核心API服务
export { mcpApi } from './mcp'
export { logService } from './logService'
export { environmentService } from './environmentService'
export { actionService } from './actionService'
export { locationService } from './locationService'
export { gameObjectService } from './gameObjectService'
export { getTaskService, TaskService, connectTaskWS, disconnectTaskWS } from './taskService'

// 便捷服务方法导出
export {
  getLogConfig,
  getLogLevel,
  updateLogLevel,
  getRecentLogs,
  getLogStats,
  clearLogs,
  searchLogs,
} from './logService'

export {
  getPlayerInfo,
  getWorldInfo,
  getInventory,
  getNearbyEntities,
  getEnvironmentSnapshot,
} from './environmentService'

export {
  getActions,
  executeAction,
  batchExecuteActions,
  getActionHistory,
  stopCurrentAction,
  getActionStatus,
} from './actionService'

export {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from './locationService'

export {
  getContainers,
  getContainerStats,
  verifyContainer,
  getBlockStats,
  getBlocksInRegion,
  searchBlocks,
  getBlockAt,
} from './gameObjectService'

export { getTaskService as getTasks } from './taskService'

// 类型定义导出
export type {
  ApiResponse,
  ApiError,
  ApiException,
  RequestOptions,
  RequestConfig,
  HttpStatusCode,
} from '../types/api'

// 游戏相关类型定义导出
export type {
  Position,
  Position2D,
  InventoryItem,
  EquipmentItem,
  PlayerInfo,
  WorldInfo,
  Entity,
  Location,
  Container,
  Block,
  BlockType,
  TokenUsage,
  Tool,
  ToolResult,
  ActionType,
  ActionInfo,
  ActionResult,
  Task,
  WebSocketMessage,
  WSHeartbeatMessage,
  WSLogMessage,
  WSPlayerMessage,
  WSWorldMessage,
  WSMarkerMessage,
  WSTokenMessage,
} from '../types/game'

// 服务实例便捷访问
export const services = {
  http: httpClient,
  websocket: {
    getManager: getWebSocketManager,
    getAllManagers: getAllWebSocketManagers,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    disconnectAll: disconnectAllWebSockets,
    getStatus: getWebSocketStatus,
    subscribe: subscribeWebSocket,
    unsubscribe: unsubscribeWebSocket,
    sendMessage: sendWebSocketMessage,
  },
  mcp: mcpApi,
  logs: logService,
  environment: environmentService,
  actions: actionService,
  locations: locationService,
  gameObjects: gameObjectService,
  get tasks() {
    return getTaskService()
  },
}

// 默认导出所有服务
export default services
