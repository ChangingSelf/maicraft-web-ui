// 统一的HTTP API客户端
import { ApiException } from '../types/api'
import type {
  ApiResponse,
  ApiError,
  RequestOptions,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types/api'
import { HttpStatusCode } from '../types/api'
import { API_CONFIG, validateApiConfig } from '../config/api.config'
import { globalErrorHandler } from './errorHandler'
import { interceptorManager } from './interceptors'

export class HttpClient {
  private baseURL: string
  private defaultConfig: RequestOptions

  constructor(baseURL?: string, config: Partial<RequestOptions> = {}) {
    // 验证配置
    const validation = validateApiConfig()
    if (!validation.valid) {
      console.error('❌ API配置验证失败:', validation.errors)
      throw new Error(`API配置无效: ${validation.errors.join(', ')}`)
    }

    const apiConfig = getAPIConfig()
    this.baseURL = baseURL || apiConfig.http.baseURL

    this.defaultConfig = {
      method: 'GET',
      headers: { ...apiConfig.http.headers },
      timeout: apiConfig.http.timeout,
      retry: apiConfig.http.retry,
      ...config,
    }

    if (apiConfig.http.debug) {
      console.log('🚀 HTTP客户端初始化完成:', {
        baseURL: this.baseURL,
        defaultConfig: this.defaultConfig,
      })
    }
  }

  // 添加请求拦截器（兼容性方法，推荐使用 interceptorManager）
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    return interceptorManager.addRequestInterceptor(interceptor)
  }

  // 添加响应拦截器（兼容性方法，推荐使用 interceptorManager）
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    return interceptorManager.addResponseInterceptor(interceptor)
  }

  // 移除请求拦截器（兼容性方法，推荐使用返回的移除函数）
  removeRequestInterceptor(interceptor: RequestInterceptor): void {
    // 注意：这个方法在新版本中不再有效，建议使用addRequestInterceptor返回的移除函数
    console.warn(
      'HttpClient.removeRequestInterceptor is deprecated. Use the remove function returned by addRequestInterceptor.',
    )
  }

  // 移除响应拦截器（兼容性方法，推荐使用返回的移除函数）
  removeResponseInterceptor(interceptor: ResponseInterceptor): void {
    // 注意：这个方法在新版本中不再有效，建议使用addResponseInterceptor返回的移除函数
    console.warn(
      'HttpClient.removeResponseInterceptor is deprecated. Use the remove function returned by addResponseInterceptor.',
    )
  }

  // 核心请求方法
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    // 合并配置
    const config = this.mergeConfig(options)
    const url = this.buildURL(endpoint, config.params)

    // 执行请求拦截器
    const processedConfig = await interceptorManager.executeRequestInterceptors(config)

    // 执行请求（确保配置完整）
    const response = await this.executeRequest<T>(url, {
      ...processedConfig,
      cache: processedConfig.cache || { enable: false },
    } as Required<RequestOptions>)

    // 执行响应拦截器
    const processedResponse = await interceptorManager.executeResponseInterceptors(
      response,
      processedConfig,
    )

    return processedResponse
  }

  // GET请求
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  // POST请求
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: data })
  }

  // PUT请求
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: data })
  }

  // PATCH请求
  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data })
  }

  // DELETE请求
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // 批量请求
  async batch(
    requests: Array<{ method: string; url: string; data?: any }>,
  ): Promise<ApiResponse[]> {
    const promises = requests.map((req) =>
      this.request(req.url, {
        method: req.method as any,
        body: req.data,
      }),
    )
    return Promise.all(promises)
  }

  // 私有方法：合并配置
  private mergeConfig(options: RequestOptions): RequestOptions {
    return {
      method: options.method || this.defaultConfig.method || 'GET',
      headers: { ...this.defaultConfig.headers, ...options.headers },
      body: options.body,
      params: options.params || {},
      timeout: options.timeout || this.defaultConfig.timeout || 10000,
      signal: options.signal,
      retry: options.retry || this.defaultConfig.retry || { maxRetries: 0, retryDelay: 1000 },
      cache: options.cache,
      skipErrorHandler: options.skipErrorHandler || false,
    }
  }

  // 私有方法：构建完整URL
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const baseURL = this.baseURL.replace(/\/$/, '') // 移除末尾斜杠
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = new URL(baseURL + path)

    // 添加查询参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  // 私有方法：执行HTTP请求
  private async executeRequest<T>(
    url: string,
    config: Required<RequestOptions>,
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    // 准备请求选项
    const requestOptions: RequestInit = {
      method: config.method,
      headers: config.headers,
      signal: config.signal || controller.signal,
    }

    // 处理请求体
    if (config.body && typeof config.body === 'object') {
      requestOptions.body = JSON.stringify(config.body)
    } else if (config.body) {
      requestOptions.body = config.body
    }

    // 重试逻辑
    let lastError: any = null
    const maxRetries = config.retry?.maxRetries || 0

    const apiConfig = getAPIConfig()
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (apiConfig.http.debug) {
          console.log(`📡 ${config.method} ${url} (尝试 ${attempt + 1}/${maxRetries + 1})`)
        }

        const response = await fetch(url, requestOptions)
        clearTimeout(timeoutId)

        // 处理响应
        const result = await this.handleResponse<T>(response, config)

        if (apiConfig.http.debug) {
          console.log(`✅ ${config.method} ${url} - ${response.status}`)
        }

        return result
      } catch (error) {
        lastError = error

        if (apiConfig.http.debug) {
          console.warn(`❌ ${config.method} ${url} (尝试 ${attempt + 1}/${maxRetries + 1}):`, error)
        }

        // 检查是否应该重试
        const shouldRetry = attempt < maxRetries && this.shouldRetry(error, config.retry)

        if (!shouldRetry) {
          break
        }

        // 等待重试延迟
        if (config.retry?.retryDelay && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, config.retry.retryDelay))
        }
      }
    }

    clearTimeout(timeoutId)

    // 所有重试都失败，创建并抛出异常
    const apiException = this.createApiException(lastError, url, config)

    // 通知全局错误处理器（异步，不阻塞当前流程）
    setTimeout(() => {
      if (apiException.code === 'NETWORK_ERROR') {
        globalErrorHandler.handleNetworkError(apiException, {
          url,
          method: config.method,
          retryAttempts: maxRetries + 1,
        })
      } else {
        globalErrorHandler.handleApiError(apiException, {
          url,
          method: config.method,
          retryAttempts: maxRetries + 1,
        })
      }
    }, 0)

    throw apiException
  }

  // 私有方法：处理HTTP响应
  private async handleResponse<T>(
    response: Response,
    config: Required<RequestOptions>,
  ): Promise<ApiResponse<T>> {
    let responseData: any

    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }
    } catch (error) {
      // 如果解析失败，创建一个基本的错误响应（使用新的格式）
      responseData = {
        code: 'INTERNAL_ERROR',
        success: false,
        message: '解析响应失败',
        data: null,
        timestamp: Date.now(),
      }
    }

    // 检查HTTP状态码
    if (!response.ok) {
      const error: ApiError = {
        code: responseData?.code || 'ERROR',
        success: false,
        message:
          responseData?.message ||
          responseData?.error ||
          response.statusText ||
          `HTTP ${response.status}`,
        error_code: responseData?.error_code || this.getErrorCode(response.status),
        data: null,
        timestamp: responseData?.timestamp || Date.now(),
        statusCode: response.status,
      }

      const apiException = new ApiException(error)

      // 通知全局错误处理器（异步，不阻塞当前流程）
      setTimeout(() => {
        globalErrorHandler.handleApiError(apiException, {
          url: response.url,
          method: config.method,
          statusCode: response.status,
          responseData,
        })
      }, 0)

      throw apiException
    }

    // 适配后端响应格式（支持新旧两种格式）
    const normalizedData = this.normalizeResponseData(responseData)

    // 确保响应格式正确 - 使用新的API格式
    if (typeof normalizedData === 'object' && normalizedData !== null) {
      // 检查是否为新的API格式（有code字段）或旧格式（有isSuccess字段）
      const isNewFormat = normalizedData.code !== undefined
      const isSuccess = isNewFormat
        ? normalizedData.success !== false
        : normalizedData.isSuccess !== false

      return {
        code: normalizedData.code || (isSuccess ? 'SUCCESS' : 'ERROR'),
        success: isSuccess,
        message: normalizedData.message || '请求成功',
        data: normalizedData.data !== undefined ? normalizedData.data : normalizedData,
        timestamp: normalizedData.timestamp || Date.now(),
        requestId: normalizedData.requestId,
        pagination: normalizedData.pagination,
      }
    }

    // 处理非标准响应格式
    return {
      code: 'SUCCESS',
      success: true,
      message: '请求成功',
      data: responseData,
      timestamp: Date.now(),
    }
  }

  // 私有方法：规范化响应数据格式
  private normalizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    const normalized = { ...data }

    // 转换字段名：is_success -> isSuccess（向后兼容）
    if (data.is_success !== undefined && data.isSuccess === undefined) {
      normalized.isSuccess = data.is_success
      delete normalized.is_success
    }

    // 转换字段名：request_id -> requestId
    if (data.request_id !== undefined && data.requestId === undefined) {
      normalized.requestId = data.request_id
      delete normalized.request_id
    }

    // 转换字段名：error_code -> errorCode (如果存在)
    if (data.error_code !== undefined && data.errorCode === undefined) {
      normalized.errorCode = data.error_code
      delete normalized.error_code
    }

    // 处理新API格式：确保success字段存在
    if (data.code !== undefined && data.success === undefined) {
      // 根据code字段推断success状态
      normalized.success = data.code === 'SUCCESS'
    }

    // 递归处理嵌套对象
    if (normalized.data && typeof normalized.data === 'object') {
      normalized.data = this.normalizeResponseData(normalized.data)
    }

    if (normalized.pagination && typeof normalized.pagination === 'object') {
      normalized.pagination = this.normalizeResponseData(normalized.pagination)
    }

    return normalized
  }

  // 私有方法：判断是否应该重试
  private shouldRetry(
    error: any,
    retryConfig?: { retryCondition?: (error: any) => boolean },
  ): boolean {
    if (!retryConfig?.retryCondition) {
      // 默认重试条件
      return (
        error.name === 'NetworkError' ||
        error.name === 'TimeoutError' ||
        error.name === 'AbortError' ||
        (error instanceof ApiException && error.canRetry())
      )
    }

    return retryConfig.retryCondition(error)
  }

  // 私有方法：根据HTTP状态码获取错误代码
  private getErrorCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatusCode.BAD_REQUEST:
        return 'VALIDATION_ERROR'
      case HttpStatusCode.UNAUTHORIZED:
        return 'AUTHENTICATION_ERROR'
      case HttpStatusCode.FORBIDDEN:
        return 'PERMISSION_DENIED'
      case HttpStatusCode.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND'
      case HttpStatusCode.METHOD_NOT_ALLOWED:
        return 'METHOD_NOT_ALLOWED'
      case HttpStatusCode.CONFLICT:
        return 'CONFLICT'
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR'
      case HttpStatusCode.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED'
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
      case HttpStatusCode.BAD_GATEWAY:
      case HttpStatusCode.SERVICE_UNAVAILABLE:
      case HttpStatusCode.GATEWAY_TIMEOUT:
        return 'INTERNAL_ERROR'
      default:
        return 'UNKNOWN_ERROR'
    }
  }

  // 私有方法：创建API异常
  private createApiException(
    error: any,
    url: string,
    config: Required<RequestOptions>,
  ): ApiException {
    if (error instanceof ApiException) {
      return error
    }

    let errorCode = 'UNKNOWN_ERROR'
    let message = '请求失败'

    if (error.name === 'NetworkError') {
      errorCode = 'NETWORK_ERROR'
      message = '网络连接失败'
    } else if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      errorCode = 'TIMEOUT_ERROR'
      message = '请求超时'
    } else if (error.message) {
      message = error.message
    }

    const apiError: ApiError = {
      code: 'ERROR',
      success: false,
      message,
      error_code: errorCode,
      data: null,
      timestamp: Date.now(),
      details: {
        url,
        method: config.method,
        originalError: error.message,
      },
    }

    return new ApiException(apiError)
  }
}

// 懒初始化单例实例
let _httpClient: HttpClient | null = null

export const getHttpClient = (): HttpClient => {
  if (!_httpClient) {
    _httpClient = new HttpClient()
  }
  return _httpClient
}

// 为向后兼容提供 httpClient getter
export const httpClient = new Proxy({} as HttpClient, {
  get(target, prop) {
    const client = getHttpClient()
    return (client as any)[prop]
  },
})

// 便捷的全局请求方法
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) =>
    httpClient.get<T>(endpoint, params),

  post: <T = any>(endpoint: string, data?: any) => httpClient.post<T>(endpoint, data),

  put: <T = any>(endpoint: string, data?: any) => httpClient.put<T>(endpoint, data),

  patch: <T = any>(endpoint: string, data?: any) => httpClient.patch<T>(endpoint, data),

  delete: <T = any>(endpoint: string) => httpClient.delete<T>(endpoint),

  request: <T = any>(endpoint: string, options?: RequestOptions) =>
    httpClient.request<T>(endpoint, options),
}

// 默认导出类和单例
export default HttpClient
