// API配置管理 - 环境变量支持
export interface ApiConfig {
  baseURL: string
  timeout: number
  retry: {
    maxRetries: number
    retryDelay: number
    retryCondition?: (error: any) => boolean
  }
  headers: Record<string, string>
  debug: boolean
}

export interface WebSocketConfig {
  heartbeatInterval: number
  reconnectInterval: number
  maxReconnectAttempts: number
  enableHeartbeat: boolean
  enableAutoReconnect: boolean
}

export interface GlobalApiConfig {
  http: ApiConfig
  websocket: WebSocketConfig
}

// 从环境变量读取配置，如果没有则使用默认值
export const API_CONFIG: GlobalApiConfig = {
  http: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:20914/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    retry: {
      maxRetries: parseInt(import.meta.env.VITE_API_MAX_RETRIES || '3'),
      retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000'),
      retryCondition: (error: any) => {
        // 默认重试条件：网络错误或超时
        return (
          error.name === 'NetworkError' ||
          error.name === 'TimeoutError' ||
          error.code === 'NETWORK_ERROR' ||
          error.code === 'TIMEOUT_ERROR'
        )
      },
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // 可以在这里添加其他默认头部，如认证token等
      // 'Authorization': `Bearer ${import.meta.env.VITE_API_TOKEN || ''}`,
    },
    debug: import.meta.env.DEV || import.meta.env.VITE_API_DEBUG === 'true',
  },
  websocket: {
    heartbeatInterval: parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL || '10000'), // 10秒 - 匹配服务器清理间隔
    reconnectInterval: parseInt(import.meta.env.VITE_WS_RECONNECT_INTERVAL || '5000'),
    maxReconnectAttempts: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS || '5'),
    enableHeartbeat: import.meta.env.VITE_WS_ENABLE_HEARTBEAT !== 'false',
    enableAutoReconnect: import.meta.env.VITE_WS_ENABLE_AUTO_RECONNECT !== 'false',
  },
}

// 环境配置验证
export function validateApiConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!API_CONFIG.http.baseURL) {
    errors.push('API baseURL is required')
  }

  if (API_CONFIG.http.timeout <= 0) {
    errors.push('API timeout must be greater than 0')
  }

  if (API_CONFIG.http.retry.maxRetries < 0) {
    errors.push('API maxRetries must be non-negative')
  }

  if (API_CONFIG.websocket.heartbeatInterval <= 0) {
    errors.push('WebSocket heartbeatInterval must be greater than 0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// 导出便捷的配置访问器
export const getApiBaseURL = () => API_CONFIG.http.baseURL
export const getApiTimeout = () => API_CONFIG.http.timeout
export const getWebSocketConfig = () => API_CONFIG.websocket
export const isDebugMode = () => API_CONFIG.http.debug

// 配置日志输出（仅在调试模式下）
if (isDebugMode()) {
  console.log('🔧 API Configuration:', {
    baseURL: getApiBaseURL(),
    timeout: getApiTimeout(),
    retry: API_CONFIG.http.retry,
    websocket: getWebSocketConfig(),
  })
}
