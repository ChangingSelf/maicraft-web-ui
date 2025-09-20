// 统一的API响应和错误类型定义

// 基础API响应接口 - 根据API文档更新
export interface ApiResponse<T = any> {
  code: string
  success: boolean
  message: string
  data: T | null
  timestamp: number
  requestId?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
}

// 分页查询参数
export interface PaginationQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 时间范围查询参数
export interface TimeRangeQuery {
  startTime?: number
  endTime?: number
  timeZone?: string
}

// 基础查询参数
export interface BaseQuery extends PaginationQuery, TimeRangeQuery {
  search?: string
  filters?: Record<string, any>
}

// API错误接口 - 根据API文档更新
export interface ApiError {
  code: string
  success: false
  message: string
  error_code: string
  data: null
  timestamp: number
  requestId?: string
  statusCode?: number
  details?: any // 保留向后兼容性
}

// API异常类 - 根据API文档更新
export class ApiException extends Error {
  public code: string
  public success: false
  public error_code: string
  public data: null
  public timestamp: number
  public requestId?: string
  public statusCode?: number

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiException'
    this.code = error.code
    this.success = error.success
    this.error_code = error.error_code
    this.data = error.data
    this.timestamp = error.timestamp
    this.requestId = error.requestId
    this.statusCode = error.statusCode
  }

  // 获取用户友好的错误消息 - 根据API文档更新错误码
  getUserMessage(): string {
    switch (this.error_code) {
      case 'VALIDATION_ERROR':
        return '输入参数有误，请检查后重试'
      case 'RESOURCE_NOT_FOUND':
        return '请求的资源不存在'
      case 'INVALID_PARAMETER':
        return '无效的参数，请检查后重试'
      case 'OPERATION_FAILED':
        return '操作执行失败，请稍后重试'
      case 'CONNECTION_ERROR':
        return '连接失败，请检查网络后重试'
      case 'SUBSCRIPTION_ERROR':
        return '订阅失败，请重新连接'
      case 'GAME_STATE_ERROR':
        return '游戏状态错误，请重启游戏'
      case 'ENVIRONMENT_ERROR':
        return '环境配置错误，请联系管理员'
      case 'INTERNAL_ERROR':
        return '服务器内部错误，请联系管理员'
      default:
        return this.message || '操作失败，请稍后重试'
    }
  }

  // 判断是否为客户端错误
  isClientError(): boolean {
    return this.statusCode ? this.statusCode >= 400 && this.statusCode < 500 : false
  }

  // 判断是否为服务器错误
  isServerError(): boolean {
    return this.statusCode ? this.statusCode >= 500 : false
  }

  // 判断是否为网络错误 - 根据API文档更新错误码
  isNetworkError(): boolean {
    return ['CONNECTION_ERROR'].includes(this.error_code)
  }

  // 判断是否可以重试 - 根据API文档更新错误码
  canRetry(): boolean {
    return (
      this.isNetworkError() ||
      this.error_code === 'OPERATION_FAILED' ||
      (this.statusCode !== undefined && this.statusCode >= 500)
    )
  }
}

// 请求配置接口
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  timeout?: number
  signal?: AbortSignal
  retry?: {
    maxRetries: number
    retryDelay: number
    retryCondition?: (error: any) => boolean
  }
  cache?: CacheConfig // 添加缓存配置
}

// HTTP状态码枚举
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// 请求拦截器接口
export interface RequestInterceptor {
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onRejected?: (error: any) => any
}

// 响应拦截器接口
export interface ResponseInterceptor {
  onFulfilled?: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>
  onRejected?: (error: ApiException) => any
}

// 缓存配置接口
export interface CacheConfig {
  ttl: number // 缓存时间（毫秒）
  key?: string // 缓存键
  condition?: (response: ApiResponse) => boolean // 缓存条件
}

// 请求选项接口
export interface RequestOptions extends RequestConfig {
  cache?: CacheConfig
  skipErrorHandler?: boolean // 是否跳过全局错误处理
}

// 批量请求接口
export interface BatchRequest<T = any> {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  data?: any
  headers?: Record<string, string>
}

export interface BatchResponse<T = any> {
  id: string
  success: boolean
  data?: T
  error?: ApiError
}

// 常用泛型工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// 提取API响应数据类型
export type ApiDataType<T extends ApiResponse> = T['data']

// 条件类型：根据方法返回不同类型
export type ApiResponseType<T, M extends ApiMethod> = M extends 'DELETE'
  ? ApiResponse<boolean>
  : M extends 'POST' | 'PUT' | 'PATCH'
    ? ApiResponse<T>
    : ApiResponse<T>

// 全局类型声明
declare global {
  interface Window {
    // Element Plus 消息提示
    ElMessage?: {
      (options: {
        message: string
        type?: 'success' | 'warning' | 'info' | 'error'
        duration?: number
        showClose?: boolean
        onClose?: () => void
      }): void
      success: (message: string) => void
      warning: (message: string) => void
      info: (message: string) => void
      error: (message: string) => void
    }

    // Vue 实例（用于错误处理）
    Vue?: any
  }
}
