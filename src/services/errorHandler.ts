// 全局错误处理服务
// 提供统一的错误处理、用户反馈和日志记录功能

import type { ApiException } from '../types/api'

// 错误级别枚举
export enum ErrorLevel {
  LOW = 'low', // 低级别错误，不影响主要功能
  MEDIUM = 'medium', // 中级别错误，可能影响部分功能
  HIGH = 'high', // 高级别错误，严重影响功能
  CRITICAL = 'critical', // 关键错误，可能导致应用崩溃
}

// 错误类型枚举
export enum ErrorType {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

// 错误信息接口
export interface ErrorInfo {
  id: string
  timestamp: number
  level: ErrorLevel
  type: ErrorType
  message: string
  userMessage: string
  stack?: string
  url?: string
  userAgent?: string
  additionalData?: Record<string, any>
}

// 错误处理配置接口
export interface ErrorHandlerConfig {
  enableLogging: boolean
  enableUserNotifications: boolean
  enableErrorReporting: boolean
  maxErrorsInMemory: number
  logLevel: ErrorLevel
}

// 错误处理回调类型
export type ErrorHandlerCallback = (error: ErrorInfo) => void
export type UserNotificationCallback = (error: ErrorInfo) => void

// 默认配置
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableUserNotifications: true,
  enableErrorReporting: false,
  maxErrorsInMemory: 100,
  logLevel: ErrorLevel.MEDIUM,
}

// 全局错误处理器类
class GlobalErrorHandler {
  private config: ErrorHandlerConfig = { ...DEFAULT_CONFIG }
  private errors: ErrorInfo[] = []
  private errorCallbacks: ErrorHandlerCallback[] = []
  private notificationCallbacks: UserNotificationCallback[] = []
  private isInitialized = false

  // 初始化错误处理器
  init(config: Partial<ErrorHandlerConfig> = {}): void {
    if (this.isInitialized) {
      console.warn('GlobalErrorHandler: Already initialized')
      return
    }

    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupGlobalErrorHandlers()
    this.isInitialized = true

    console.log('GlobalErrorHandler: Initialized with config:', this.config)
  }

  // 设置全局错误处理器
  private setupGlobalErrorHandlers(): void {
    // 处理未捕获的JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    // 处理未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason)
      // 阻止默认的错误日志
      event.preventDefault()
    })

    // 处理Vue错误（如果Vue可用）
    if (window.Vue) {
      window.Vue.config.errorHandler = (error, instance, info) => {
        this.handleVueError(error, instance, info)
      }
    }
  }

  // 处理JavaScript错误
  private handleJavaScriptError(error: Error | null, eventData?: any): void {
    const errorInfo = this.createErrorInfo({
      level: ErrorLevel.HIGH,
      type: ErrorType.JAVASCRIPT,
      message: error?.message || 'JavaScript error occurred',
      userMessage: '应用出现错误，请刷新页面重试',
      stack: error?.stack,
      additionalData: {
        filename: eventData?.filename,
        lineno: eventData?.lineno,
        colno: eventData?.colno,
      },
    })

    this.processError(errorInfo)
  }

  // 处理Promise拒绝
  private handlePromiseRejection(reason: any): void {
    const error = reason instanceof Error ? reason : new Error(String(reason))

    const errorInfo = this.createErrorInfo({
      level: ErrorLevel.MEDIUM,
      type: ErrorType.JAVASCRIPT,
      message: error.message || 'Promise rejection occurred',
      userMessage: '操作失败，请稍后重试',
      stack: error.stack,
      additionalData: { reason },
    })

    this.processError(errorInfo)
  }

  // 处理Vue错误
  private handleVueError(error: Error, instance: any, info: string): void {
    const errorInfo = this.createErrorInfo({
      level: ErrorLevel.MEDIUM,
      type: ErrorType.JAVASCRIPT,
      message: `Vue error: ${error.message}`,
      userMessage: '界面出现问题，请刷新页面',
      stack: error.stack,
      additionalData: {
        vueInfo: info,
        component: instance?.$?.type?.name || 'Unknown',
      },
    })

    this.processError(errorInfo)
  }

  // 处理API错误
  handleApiError(error: ApiException | Error, context?: Record<string, any>): void {
    let level = ErrorLevel.MEDIUM
    let userMessage = '操作失败，请稍后重试'

    if (error instanceof ApiException) {
      // 根据API错误代码确定级别 - 使用error_code字段
      switch (error.error_code) {
        case 'CONNECTION_ERROR':
          level = ErrorLevel.MEDIUM
          break
        case 'OPERATION_FAILED':
          level = ErrorLevel.MEDIUM
          break
        case 'VALIDATION_ERROR':
        case 'INVALID_PARAMETER':
          level = ErrorLevel.LOW
          break
        case 'RESOURCE_NOT_FOUND':
          level = ErrorLevel.MEDIUM
          break
        case 'SUBSCRIPTION_ERROR':
        case 'GAME_STATE_ERROR':
        case 'ENVIRONMENT_ERROR':
          level = ErrorLevel.HIGH
          break
        case 'INTERNAL_ERROR':
          level = ErrorLevel.CRITICAL
          break
        default:
          level = ErrorLevel.MEDIUM
      }
      userMessage = error.getUserMessage()
    }

    const errorInfo = this.createErrorInfo({
      level,
      type: ErrorType.API,
      message: error.message,
      userMessage,
      stack: error instanceof Error ? error.stack : undefined,
      additionalData: {
        ...context,
        ...(error instanceof ApiException
          ? {
              errorCode: error.error_code,
              statusCode: error.statusCode,
              requestId: error.requestId,
            }
          : {}),
      },
    })

    this.processError(errorInfo)
  }

  // 处理验证错误
  handleValidationError(message: string, details?: Record<string, any>): void {
    const errorInfo = this.createErrorInfo({
      level: ErrorLevel.LOW,
      type: ErrorType.VALIDATION,
      message: `Validation error: ${message}`,
      userMessage: message,
      additionalData: details,
    })

    this.processError(errorInfo)
  }

  // 处理网络错误
  handleNetworkError(error: Error, context?: Record<string, any>): void {
    const errorInfo = this.createErrorInfo({
      level: ErrorLevel.MEDIUM,
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: '网络连接失败，请检查网络后重试',
      stack: error.stack,
      additionalData: context,
    })

    this.processError(errorInfo)
  }

  // 创建错误信息对象
  private createErrorInfo(
    params: Omit<ErrorInfo, 'id' | 'timestamp' | 'url' | 'userAgent'>,
  ): ErrorInfo {
    return {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...params,
    }
  }

  // 生成错误ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 处理错误（统一的处理流程）
  private processError(error: ErrorInfo): void {
    // 检查错误级别是否需要处理
    if (this.shouldProcessError(error)) {
      // 添加到错误列表
      this.addError(error)

      // 记录日志
      if (this.config.enableLogging) {
        this.logError(error)
      }

      // 发送错误报告
      if (this.config.enableErrorReporting) {
        this.reportError(error)
      }

      // 显示用户通知
      if (this.config.enableUserNotifications) {
        this.showUserNotification(error)
      }

      // 触发错误回调
      this.triggerErrorCallbacks(error)
    }
  }

  // 判断是否需要处理错误
  private shouldProcessError(error: ErrorInfo): boolean {
    const levelOrder = {
      [ErrorLevel.LOW]: 1,
      [ErrorLevel.MEDIUM]: 2,
      [ErrorLevel.HIGH]: 3,
      [ErrorLevel.CRITICAL]: 4,
    }

    return levelOrder[error.level] >= levelOrder[this.config.logLevel]
  }

  // 添加错误到列表
  private addError(error: ErrorInfo): void {
    this.errors.push(error)

    // 限制错误数量
    if (this.errors.length > this.config.maxErrorsInMemory) {
      this.errors = this.errors.slice(-this.config.maxErrorsInMemory)
    }
  }

  // 记录错误日志
  private logError(error: ErrorInfo): void {
    const logMessage = `[${error.level.toUpperCase()}] ${error.type}: ${error.message}`

    switch (error.level) {
      case ErrorLevel.LOW:
        console.debug(logMessage, error)
        break
      case ErrorLevel.MEDIUM:
        console.warn(logMessage, error)
        break
      case ErrorLevel.HIGH:
      case ErrorLevel.CRITICAL:
        console.error(logMessage, error)
        break
    }
  }

  // 发送错误报告
  private reportError(error: ErrorInfo): void {
    // 这里可以实现错误上报逻辑，比如发送到服务器
    // 暂时只记录到控制台
    console.log('Error report:', {
      id: error.id,
      level: error.level,
      type: error.type,
      message: error.message,
      timestamp: new Date(error.timestamp).toISOString(),
      url: error.url,
      userAgent: error.userAgent,
      stack: error.stack,
      additionalData: error.additionalData,
    })
  }

  // 显示用户通知
  private showUserNotification(error: ErrorInfo): void {
    // 触发通知回调
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('Error in notification callback:', callbackError)
      }
    })

    // 默认的用户通知实现
    this.showDefaultNotification(error)
  }

  // 默认的用户通知实现
  private showDefaultNotification(error: ErrorInfo): void {
    // 这里可以集成各种UI通知库，比如Element Plus的消息提示
    // 暂时使用console.log代替
    console.log(`用户通知: ${error.userMessage}`)
  }

  // 触发错误回调
  private triggerErrorCallbacks(error: ErrorInfo): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError)
      }
    })
  }

  // 添加错误处理回调
  addErrorCallback(callback: ErrorHandlerCallback): () => void {
    this.errorCallbacks.push(callback)

    // 返回移除函数
    return () => {
      const index = this.errorCallbacks.indexOf(callback)
      if (index > -1) {
        this.errorCallbacks.splice(index, 1)
      }
    }
  }

  // 添加用户通知回调
  addNotificationCallback(callback: UserNotificationCallback): () => void {
    this.notificationCallbacks.push(callback)

    // 返回移除函数
    return () => {
      const index = this.notificationCallbacks.indexOf(callback)
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1)
      }
    }
  }

  // 获取所有错误
  getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  // 获取最近的错误
  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errors.slice(-count)
  }

  // 根据级别获取错误
  getErrorsByLevel(level: ErrorLevel): ErrorInfo[] {
    return this.errors.filter((error) => error.level === level)
  }

  // 根据类型获取错误
  getErrorsByType(type: ErrorType): ErrorInfo[] {
    return this.errors.filter((error) => error.type === type)
  }

  // 清空错误列表
  clearErrors(): void {
    this.errors = []
  }

  // 获取错误统计
  getErrorStats(): {
    total: number
    byLevel: Record<ErrorLevel, number>
    byType: Record<ErrorType, number>
  } {
    const byLevel: Record<ErrorLevel, number> = {
      [ErrorLevel.LOW]: 0,
      [ErrorLevel.MEDIUM]: 0,
      [ErrorLevel.HIGH]: 0,
      [ErrorLevel.CRITICAL]: 0,
    }

    const byType: Record<ErrorType, number> = {
      [ErrorType.JAVASCRIPT]: 0,
      [ErrorType.NETWORK]: 0,
      [ErrorType.API]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.PERMISSION]: 0,
      [ErrorType.TIMEOUT]: 0,
      [ErrorType.UNKNOWN]: 0,
    }

    this.errors.forEach((error) => {
      byLevel[error.level]++
      byType[error.type]++
    })

    return {
      total: this.errors.length,
      byLevel,
      byType,
    }
  }

  // 更新配置
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('GlobalErrorHandler: Config updated:', this.config)
  }

  // 获取当前配置
  getConfig(): ErrorHandlerConfig {
    return { ...this.config }
  }
}

// 全局错误处理器实例
export const globalErrorHandler = new GlobalErrorHandler()

// 便捷函数
export const handleApiError = (error: ApiException | Error, context?: Record<string, any>) =>
  globalErrorHandler.handleApiError(error, context)

export const handleValidationError = (message: string, details?: Record<string, any>) =>
  globalErrorHandler.handleValidationError(message, details)

export const handleNetworkError = (error: Error, context?: Record<string, any>) =>
  globalErrorHandler.handleNetworkError(error, context)

export default globalErrorHandler
