// API请求拦截器服务
// 提供丰富的请求/响应拦截器，支持认证、日志、错误处理等功能

import type {
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ApiResponse,
  ApiException,
} from '../types/api'

// 拦截器类型
export type InterceptorType = 'request' | 'response'

// 拦截器优先级
export enum InterceptorPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 15,
}

// 拦截器配置
export interface InterceptorConfig {
  priority: InterceptorPriority
  enabled: boolean
  name?: string
}

// 增强的拦截器接口
export interface EnhancedRequestInterceptor extends RequestInterceptor {
  config: InterceptorConfig
}

export interface EnhancedResponseInterceptor extends ResponseInterceptor {
  config: InterceptorConfig
}

// 拦截器管理器
export class InterceptorManager {
  private requestInterceptors: EnhancedRequestInterceptor[] = []
  private responseInterceptors: EnhancedResponseInterceptor[] = []

  // 添加请求拦截器
  addRequestInterceptor(
    interceptor: RequestInterceptor,
    config: Partial<InterceptorConfig> = {},
  ): () => void {
    const enhancedInterceptor: EnhancedRequestInterceptor = {
      ...interceptor,
      config: {
        priority: InterceptorPriority.NORMAL,
        enabled: true,
        ...config,
      },
    }

    this.requestInterceptors.push(enhancedInterceptor)
    this.sortInterceptors()

    // 返回移除函数
    return () => {
      const index = this.requestInterceptors.indexOf(enhancedInterceptor)
      if (index > -1) {
        this.requestInterceptors.splice(index, 1)
      }
    }
  }

  // 添加响应拦截器
  addResponseInterceptor(
    interceptor: ResponseInterceptor,
    config: Partial<InterceptorConfig> = {},
  ): () => void {
    const enhancedInterceptor: EnhancedResponseInterceptor = {
      ...interceptor,
      config: {
        priority: InterceptorPriority.NORMAL,
        enabled: true,
        ...config,
      },
    }

    this.responseInterceptors.push(enhancedInterceptor)
    this.sortInterceptors()

    // 返回移除函数
    return () => {
      const index = this.responseInterceptors.indexOf(enhancedInterceptor)
      if (index > -1) {
        this.responseInterceptors.splice(index, 1)
      }
    }
  }

  // 排序拦截器（按优先级）
  private sortInterceptors(): void {
    this.requestInterceptors.sort((a, b) => b.config.priority - a.config.priority)
    this.responseInterceptors.sort((a, b) => b.config.priority - a.config.priority)
  }

  // 执行请求拦截器链
  async executeRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config

    for (const interceptor of this.requestInterceptors) {
      if (!interceptor.config.enabled) continue

      try {
        if (interceptor.onFulfilled) {
          processedConfig = await interceptor.onFulfilled(processedConfig)
        }
      } catch (error) {
        if (interceptor.onRejected) {
          throw await interceptor.onRejected(error)
        }
        throw error
      }
    }

    return processedConfig
  }

  // 执行响应拦截器链
  async executeResponseInterceptors<T>(
    response: ApiResponse<T>,
    config: RequestConfig,
  ): Promise<ApiResponse<T>> {
    let processedResponse = response

    for (const interceptor of this.responseInterceptors) {
      if (!interceptor.config.enabled) continue

      try {
        if (interceptor.onFulfilled) {
          processedResponse = await interceptor.onFulfilled(processedResponse)
        }
      } catch (error) {
        if (interceptor.onRejected) {
          throw await interceptor.onRejected(error as ApiException)
        }
        throw error
      }
    }

    return processedResponse
  }

  // 获取所有请求拦截器
  getRequestInterceptors(): EnhancedRequestInterceptor[] {
    return [...this.requestInterceptors]
  }

  // 获取所有响应拦截器
  getResponseInterceptors(): EnhancedResponseInterceptor[] {
    return [...this.responseInterceptors]
  }

  // 启用/禁用拦截器
  setInterceptorEnabled(name: string, enabled: boolean): boolean {
    let found = false

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.config.name === name) {
        interceptor.config.enabled = enabled
        found = true
      }
    }

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.config.name === name) {
        interceptor.config.enabled = enabled
        found = true
      }
    }

    return found
  }

  // 移除拦截器
  removeInterceptor(name: string): boolean {
    let removed = false

    this.requestInterceptors = this.requestInterceptors.filter((interceptor) => {
      if (interceptor.config.name === name) {
        removed = true
        return false
      }
      return true
    })

    this.responseInterceptors = this.responseInterceptors.filter((interceptor) => {
      if (interceptor.config.name === name) {
        removed = true
        return false
      }
      return true
    })

    return removed
  }

  // 清空所有拦截器
  clearAll(): void {
    this.requestInterceptors = []
    this.responseInterceptors = []
  }
}

// 预定义的常用拦截器

// 1. 认证拦截器
export class AuthInterceptor {
  private token: string | null = null

  constructor(token?: string) {
    if (token) {
      this.setToken(token)
    }
  }

  setToken(token: string): void {
    this.token = token
  }

  clearToken(): void {
    this.token = null
  }

  createRequestInterceptor(): RequestInterceptor {
    return {
      onFulfilled: (config) => {
        if (this.token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.token}`,
          }
        }
        return config
      },
    }
  }

  createResponseInterceptor(): ResponseInterceptor {
    return {
      onRejected: async (error) => {
        // 如果是401错误，清除token
        if (error.statusCode === 401) {
          this.clearToken()
          console.warn('AuthInterceptor: Token expired, cleared')
        }
        throw error
      },
    }
  }
}

// 2. 请求日志拦截器
export class RequestLoggerInterceptor {
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  createRequestInterceptor(): RequestInterceptor {
    return {
      onFulfilled: (config) => {
        if (this.enabled) {
          console.log(`📡 ${config.method} ${config.url || 'unknown'}`, {
            headers: config.headers,
            body: config.body,
            timestamp: new Date().toISOString(),
          })
        }
        return config
      },
    }
  }

  createResponseInterceptor(): ResponseInterceptor {
    return {
      onFulfilled: (response) => {
        if (this.enabled) {
          console.log(`✅ ${response.requestId || 'unknown'}`, {
            status: 'success',
            data: response.data,
            timestamp: new Date().toISOString(),
          })
        }
        return response
      },
      onRejected: (error) => {
        if (this.enabled) {
          console.error(`❌ ${error.requestId || 'unknown'}`, {
            status: 'error',
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString(),
          })
        }
        throw error
      },
    }
  }
}

// 3. 响应格式化拦截器
export class ResponseFormatterInterceptor {
  private formatResponse = true

  setFormatEnabled(enabled: boolean): void {
    this.formatResponse = enabled
  }

  createResponseInterceptor(): ResponseInterceptor {
    return {
      onFulfilled: (response) => {
        if (this.formatResponse) {
          // 可以在这里统一处理响应格式
          // 例如：添加统一的元数据、格式化数据等
          return {
            ...response,
            _formatted: true,
            _timestamp: new Date().toISOString(),
          }
        }
        return response
      },
    }
  }
}

// 4. 重试拦截器
export class RetryInterceptor {
  private maxRetries = 3
  private retryDelay = 1000

  constructor(maxRetries = 3, retryDelay = 1000) {
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
  }

  createResponseInterceptor(): ResponseInterceptor {
    return {
      onRejected: async (error) => {
        // 检查是否应该重试
        const shouldRetry =
          error.statusCode && error.statusCode >= 500 && error.retryCount < this.maxRetries

        if (shouldRetry) {
          console.log(`🔄 Retrying request (${error.retryCount + 1}/${this.maxRetries})`)

          // 等待重试延迟
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay))

          // 重新抛出错误，让HTTP客户端处理重试
          throw error
        }

        throw error
      },
    }
  }
}

// 5. 加载状态拦截器
export class LoadingInterceptor {
  private loadingCount = 0
  private onLoadingChange?: (loading: boolean) => void

  setLoadingChangeCallback(callback: (loading: boolean) => void): void {
    this.onLoadingChange = callback
  }

  createRequestInterceptor(): RequestInterceptor {
    return {
      onFulfilled: (config) => {
        this.loadingCount++
        if (this.loadingCount === 1 && this.onLoadingChange) {
          this.onLoadingChange(true)
        }
        return config
      },
    }
  }

  createResponseInterceptor(): ResponseInterceptor {
    return {
      onFulfilled: (response) => {
        this.loadingCount--
        if (this.loadingCount === 0 && this.onLoadingChange) {
          this.onLoadingChange(false)
        }
        return response
      },
      onRejected: (error) => {
        this.loadingCount--
        if (this.loadingCount === 0 && this.onLoadingChange) {
          this.onLoadingChange(false)
        }
        throw error
      },
    }
  }

  getLoadingCount(): number {
    return this.loadingCount
  }

  isLoading(): boolean {
    return this.loadingCount > 0
  }
}

// 6. 缓存拦截器
export class CacheInterceptor {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5分钟

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
  }

  createRequestInterceptor(): RequestInterceptor {
    return {
      onFulfilled: (config) => {
        // 为GET请求启用缓存
        if (config.method === 'GET' && config.cache?.enable !== false) {
          const cacheKey = this.generateCacheKey(config)
          const cached = this.cache.get(cacheKey)

          if (cached && !this.isExpired(cached)) {
            console.log('📋 Using cached response for:', cacheKey)
            // 这里可以设置一个标记，让响应拦截器使用缓存
            ;(config as any)._useCache = true
            ;(config as any)._cachedData = cached.data
          }
        }

        return config
      },
    }
  }

  createResponseInterceptor(): ResponseInterceptor {
    return {
      onFulfilled: (response) => {
        const config = (response as any)._originalConfig
        if (config?.method === 'GET' && config?.cache?.enable !== false) {
          const cacheKey = this.generateCacheKey(config)
          const ttl = config.cache?.ttl || this.defaultTTL

          this.cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
            ttl,
          })

          console.log('💾 Cached response for:', cacheKey)
        }

        return response
      },
    }
  }

  private generateCacheKey(config: RequestConfig): string {
    return `${config.method}:${config.url || 'unknown'}:${JSON.stringify(config.params || {})}`
  }

  private isExpired(cached: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cached.timestamp > cached.ttl
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}

// 7. 请求去重拦截器（防止重复请求）
export class DeduplicationInterceptor {
  private pendingRequests = new Map<string, Promise<any>>()

  createRequestInterceptor(): RequestInterceptor {
    return {
      onFulfilled: (config) => {
        // 只对GET请求去重
        if (config.method === 'GET') {
          const requestKey = this.generateRequestKey(config)

          if (this.pendingRequests.has(requestKey)) {
            console.log('🚫 Duplicate request detected, using pending:', requestKey)
            // 这里可以抛出一个特殊的错误，让调用方知道这是重复请求
            throw new Error('DUPLICATE_REQUEST')
          }

          // 创建一个标记，用于响应时清理
          ;(config as any)._requestKey = requestKey
        }

        return config
      },
    }
  }

  createResponseInterceptor(): ResponseInterceptor {
    return {
      onFulfilled: (response) => {
        const config = (response as any)._originalConfig
        if (config?._requestKey) {
          this.pendingRequests.delete(config._requestKey)
        }
        return response
      },
      onRejected: (error) => {
        const config = (error as any)._originalConfig
        if (config?._requestKey) {
          this.pendingRequests.delete(config._requestKey)
        }
        throw error
      },
    }
  }

  private generateRequestKey(config: RequestConfig): string {
    return `${config.method}:${config.url || 'unknown'}:${JSON.stringify(config.params || {})}`
  }

  getPendingRequestCount(): number {
    return this.pendingRequests.size
  }
}

// 创建默认的拦截器管理器实例
export const interceptorManager = new InterceptorManager()

// 便捷函数：创建常用拦截器
export const createAuthInterceptor = (token?: string) => new AuthInterceptor(token)
export const createRequestLogger = () => new RequestLoggerInterceptor()
export const createResponseFormatter = () => new ResponseFormatterInterceptor()
export const createRetryInterceptor = (maxRetries?: number, retryDelay?: number) =>
  new RetryInterceptor(maxRetries, retryDelay)
export const createLoadingInterceptor = () => new LoadingInterceptor()
export const createCacheInterceptor = () => new CacheInterceptor()
export const createDeduplicationInterceptor = () => new DeduplicationInterceptor()

// 便捷函数：注册常用拦截器
export const registerAuthInterceptor = (token?: string) => {
  const auth = createAuthInterceptor(token)
  const removeRequest = interceptorManager.addRequestInterceptor(auth.createRequestInterceptor(), {
    name: 'auth-request',
    priority: InterceptorPriority.HIGH,
  })
  const removeResponse = interceptorManager.addResponseInterceptor(
    auth.createResponseInterceptor(),
    { name: 'auth-response', priority: InterceptorPriority.HIGH },
  )
  return () => {
    removeRequest()
    removeResponse()
  }
}

export const registerLoggerInterceptors = () => {
  const logger = createRequestLogger()
  const removeRequest = interceptorManager.addRequestInterceptor(
    logger.createRequestInterceptor(),
    { name: 'request-logger', priority: InterceptorPriority.LOW },
  )
  const removeResponse = interceptorManager.addResponseInterceptor(
    logger.createResponseInterceptor(),
    { name: 'response-logger', priority: InterceptorPriority.LOW },
  )
  return () => {
    removeRequest()
    removeResponse()
  }
}

export const registerDefaultInterceptors = () => {
  // 注册认证拦截器
  const removeAuth = registerAuthInterceptor()

  // 注册日志拦截器
  const removeLogger = registerLoggerInterceptors()

  // 注册响应格式化拦截器
  const formatter = createResponseFormatter()
  const removeFormatter = interceptorManager.addResponseInterceptor(
    formatter.createResponseInterceptor(),
    { name: 'response-formatter', priority: InterceptorPriority.NORMAL },
  )

  return () => {
    removeAuth()
    removeLogger()
    removeFormatter()
  }
}

export default interceptorManager
