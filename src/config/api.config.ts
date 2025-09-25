import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

// API配置管理 - 从设置store动态获取
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

// 懒初始化配置
let _apiConfig: ReturnType<typeof computed<GlobalApiConfig>> | null = null

const getApiConfig = () => {
  if (!_apiConfig) {
    const settingsStore = useSettingsStore()
    _apiConfig = computed(() => ({
      http: {
        baseURL: `http://${settingsStore.settings.api.host}:${settingsStore.settings.api.port}/api`,
        timeout: settingsStore.settings.api.timeout,
        retry: {
          maxRetries: 3, // 默认重试3次
          retryDelay: 1000, // 默认重试延迟1秒
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
        heartbeatInterval: settingsStore.settings.websocket.heartbeatInterval,
        reconnectInterval: settingsStore.settings.websocket.reconnectInterval,
        maxReconnectAttempts: settingsStore.settings.websocket.maxReconnectAttempts,
        enableHeartbeat: settingsStore.settings.websocket.enableHeartbeat,
        enableAutoReconnect: settingsStore.settings.websocket.enableAutoReconnect,
      },
    }))
  }
  return _apiConfig
}

// 从设置store和环境变量读取配置（懒初始化）
export const getAPIConfig = (): GlobalApiConfig => {
  if (!_apiConfig) {
    _apiConfig = getApiConfig()
  }
  return _apiConfig.value
}

// 为向后兼容提供 computed 属性
export const API_CONFIG = {
  get value() {
    return getAPIConfig()
  },
}

// 环境配置验证
export function validateApiConfig(): { valid: boolean; errors: string[] } {
  const config = getAPIConfig()
  const errors: string[] = []

  if (!config.http.baseURL) {
    errors.push('API baseURL is required')
  }

  if (config.http.timeout <= 0) {
    errors.push('API timeout must be greater than 0')
  }

  if (config.http.retry.maxRetries < 0) {
    errors.push('API maxRetries must be non-negative')
  }

  if (config.websocket.heartbeatInterval <= 0) {
    errors.push('WebSocket heartbeatInterval must be greater than 0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// 导出便捷的配置访问器
export const getApiBaseURL = () => getAPIConfig().http.baseURL
export const getApiTimeout = () => getAPIConfig().http.timeout
export const getWebSocketConfig = () => getAPIConfig().websocket
export const isDebugMode = () => getAPIConfig().http.debug

// 配置日志输出（仅在调试模式下）
if (import.meta.env.DEV || import.meta.env.VITE_API_DEBUG === 'true') {
  console.log('🔧 API Configuration initialized (lazy loading)')
}
