// 日志管理API服务
import { httpClient } from './httpClient'
import type { ApiResponse } from '../types/api'
import type {
  LogEntry,
  LogConfig,
  LogLevelInfo,
  LogQueryParams,
  LogResponse,
  LogStats,
} from '../types/game'

// 重新导出类型以保持向后兼容
export type { LogEntry, LogConfig, LogLevelInfo, LogQueryParams, LogResponse, LogStats }

// 日志查询接口（扩展基础查询）
export interface LogQuery extends LogQueryParams {
  start_time?: number
  end_time?: number
  file?: string
}

// 日志列表响应接口（使用统一的LogResponse）
export type LogListResponse = LogResponse

// 日志统计接口（使用统一的LogStats）
export type LogStatsResponse = LogStats

// 更新日志级别请求接口
export interface UpdateLogLevelRequest {
  level: string
}

// 清空日志响应接口
export interface ClearLogsResponse {
  cleared_count: number
  message: string
  before_clear_stats: {
    total_logs: number
    oldest_timestamp: number
    newest_timestamp: number
  }
}

// 日志导出接口
export interface LogExportRequest {
  format: 'json' | 'csv' | 'txt'
  query?: LogQuery
  include_extra?: boolean
}

// 日志服务类
export class LogService {
  // 获取日志配置
  async getConfig(): Promise<ApiResponse<LogConfig>> {
    return httpClient.get<LogConfig>('/api/logs/config')
  }

  // 获取日志级别信息
  async getLevel(): Promise<ApiResponse<LogLevelInfo>> {
    return httpClient.get<LogLevelInfo>('/api/logs/level')
  }

  // 更新日志级别
  async updateLevel(
    level: string,
  ): Promise<ApiResponse<{ message: string; previous_level: string }>> {
    return httpClient.post('/api/logs/level', { level })
  }

  // 获取最近日志
  async getRecentLogs(query?: LogQuery): Promise<ApiResponse<LogListResponse>> {
    const params: Record<string, any> = {}
    if (query?.limit) params.limit = query.limit
    if (query?.level) params.level = query.level
    if (query?.module) params.module = query.module
    if (query?.message_contains) params.message_contains = query.message_contains
    if (query?.since_minutes) params.since_minutes = query.since_minutes
    if (query?.start_time) params.start_time = query.start_time
    if (query?.end_time) params.end_time = query.end_time
    if (query?.file) params.file = query.file

    return httpClient.get<LogListResponse>('/api/logs/recent', params)
  }

  // 获取日志统计
  async getStats(query?: {
    start_time?: number
    end_time?: number
    modules?: string[]
    levels?: string[]
  }): Promise<ApiResponse<LogStats>> {
    const params: Record<string, any> = {}
    if (query?.start_time) params.start_time = query.start_time
    if (query?.end_time) params.end_time = query.end_time
    if (query?.modules) params.modules = query.modules.join(',')
    if (query?.levels) params.levels = query.levels.join(',')

    return httpClient.get<LogStats>('/api/logs/stats', params)
  }

  // 清空日志缓存
  async clearLogs(): Promise<ApiResponse<ClearLogsResponse>> {
    return httpClient.post<ClearLogsResponse>('/api/logs/clear')
  }

  // 导出日志
  async exportLogs(request: LogExportRequest): Promise<ApiResponse<any>> {
    const params: Record<string, any> = { format: request.format }
    if (request.include_extra !== undefined) params.include_extra = request.include_extra

    const queryParams = new URLSearchParams(params).toString()
    const endpoint = `/logs/export${queryParams ? `?${queryParams}` : ''}`

    if (request.query) {
      return httpClient.post(endpoint, request.query)
    } else {
      return httpClient.get(endpoint)
    }
  }

  // 获取日志级别描述
  async getLevelDescriptions(): Promise<
    ApiResponse<
      Record<
        string,
        {
          description: string
          color: string
          priority: number
        }
      >
    >
  > {
    return httpClient.get('/logs/level-descriptions')
  }

  // 搜索日志
  async searchLogs(searchQuery: {
    text: string
    case_sensitive?: boolean
    regex?: boolean
    fields?: ('message' | 'module' | 'file' | 'level')[]
    limit?: number
    start_time?: number
    end_time?: number
  }): Promise<ApiResponse<LogListResponse>> {
    return httpClient.post<LogListResponse>('/logs/search', searchQuery)
  }

  // 获取日志流（实时）
  async getLogStream(query?: { levels?: string[]; modules?: string[]; follow?: boolean }): Promise<
    ApiResponse<{
      stream_id: string
      websocket_url: string
      filters: {
        levels: string[]
        modules: string[]
      }
    }>
  > {
    return httpClient.post('/logs/stream', query || {})
  }

  // 停止日志流
  async stopLogStream(streamId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete(`/logs/stream/${streamId}`)
  }

  // 获取活跃的日志流
  async getActiveStreams(): Promise<
    ApiResponse<
      Array<{
        stream_id: string
        created_time: number
        filters: {
          levels: string[]
          modules: string[]
        }
        message_count: number
      }>
    >
  > {
    return httpClient.get('/logs/streams')
  }

  // 批量操作日志
  async batchOperation(operation: {
    type: 'delete' | 'archive' | 'export'
    query: LogQuery
    options?: {
      archive_path?: string
      export_format?: 'json' | 'csv' | 'txt'
      compression?: boolean
    }
  }): Promise<
    ApiResponse<{
      operation_id: string
      affected_count: number
      status: 'pending' | 'completed' | 'failed'
      message: string
    }>
  > {
    return httpClient.post('/logs/batch', operation)
  }

  // 获取批量操作状态
  async getBatchOperationStatus(operationId: string): Promise<
    ApiResponse<{
      operation_id: string
      type: string
      status: 'pending' | 'running' | 'completed' | 'failed'
      progress: number
      affected_count: number
      start_time: number
      end_time?: number
      error?: string
    }>
  > {
    return httpClient.get(`/logs/batch/${operationId}`)
  }
}

// 导出单例实例
export const logService = new LogService()

// 便捷的全局方法
export const getLogConfig = () => logService.getConfig()
export const getLogLevel = () => logService.getLevel()
export const updateLogLevel = (level: string) => logService.updateLevel(level)
export const getRecentLogs = (query?: LogQuery) => logService.getRecentLogs(query)
export const getLogStats = (query?: any) => logService.getStats(query)
export const clearLogs = () => logService.clearLogs()
export const searchLogs = (query: any) => logService.searchLogs(query)
