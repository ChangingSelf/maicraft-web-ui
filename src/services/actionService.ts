// 动作执行API服务
import { httpClient } from './httpClient'
import type { ApiResponse } from '../types/api'
import type { ActionType, ActionInfo, ActionResult } from '../types/game'

// ActionType类型已从game.ts导入

// ActionInfo类型已从game.ts导入

// 动作列表接口
export interface ActionList {
  actions: ActionInfo[]
  categories: Record<string, ActionType[]>
  total: number
}

// 位置接口
export interface Position {
  x: number
  y: number
  z: number
}

// 动作请求接口
export interface ActionRequest {
  action_type: ActionType
  parameters: Record<string, any>
}

// ActionResult类型已从game.ts导入

// 批量动作请求接口
export interface BatchActionRequest {
  calls: Array<{
    action_type: ActionType
    parameters: Record<string, any>
  }>
  sequential?: boolean // 是否按顺序执行
}

// 批量动作响应接口
export interface BatchActionResult {
  batch_id: string
  results: ActionResult[]
  total_calls: number
  successful_calls: number
  failed_calls: number
  total_execution_time: number
}

// 动作历史查询接口
export interface ActionHistoryQuery {
  limit?: number
  action_type?: ActionType
  status?: 'success' | 'error'
  start_time?: number
  end_time?: number
}

// 动作历史接口
export interface ActionHistory {
  actions: ActionHistoryItem[]
  total: number
  has_more: boolean
}

// 动作历史项接口
export interface ActionHistoryItem {
  id: string
  action_type: ActionType
  parameters: Record<string, any>
  result: ActionResult
  timestamp: number
}

// 动作执行状态接口
export interface ActionStatus {
  is_executing: boolean
  current_action?: {
    action_type: ActionType
    parameters: Record<string, any>
    start_time: number
  }
  queue_length: number
}

// 动作服务类
export class ActionService {
  // 获取可用动作列表
  async getActions(): Promise<ApiResponse<ActionList>> {
    return httpClient.get<ActionList>('/actions')
  }

  // 执行单个动作
  async executeAction(action: ActionRequest): Promise<ApiResponse<ActionResult>> {
    return httpClient.post<ActionResult>('/actions/execute', action)
  }

  // 批量执行动作
  async batchExecute(actions: BatchActionRequest): Promise<ApiResponse<BatchActionResult>> {
    return httpClient.post<BatchActionResult>('/actions/batch', actions)
  }

  // 获取执行历史
  async getHistory(query?: ActionHistoryQuery): Promise<ApiResponse<ActionHistory>> {
    const params: Record<string, any> = {}
    if (query?.limit) params.limit = query.limit
    if (query?.action_type) params.action_type = query.action_type
    if (query?.status) params.status = query.status
    if (query?.start_time) params.start_time = query.start_time
    if (query?.end_time) params.end_time = query.end_time

    return httpClient.get<ActionHistory>('/actions/history', params)
  }

  // 获取当前执行状态
  async getStatus(): Promise<ApiResponse<ActionStatus>> {
    return httpClient.get<ActionStatus>('/actions/status')
  }

  // 停止当前动作
  async stopCurrentAction(): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/actions/stop')
  }

  // 停止所有动作
  async stopAllActions(): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/actions/stop-all')
  }

  // 获取动作统计
  async getStats(): Promise<
    ApiResponse<{
      total_actions: number
      successful_actions: number
      failed_actions: number
      avg_execution_time: number
      most_used_action: ActionType
    }>
  > {
    return httpClient.get('/actions/stats')
  }

  // 验证动作参数
  async validateAction(action: ActionRequest): Promise<
    ApiResponse<{
      valid: boolean
      errors?: string[]
      warnings?: string[]
    }>
  > {
    return httpClient.post('/actions/validate', action)
  }

  // 获取动作详细信息
  async getActionDetails(actionType: ActionType): Promise<ApiResponse<ActionInfo>> {
    return httpClient.get<ActionInfo>(`/actions/${actionType}`)
  }

  // 预览动作执行结果
  async previewAction(action: ActionRequest): Promise<
    ApiResponse<{
      success: boolean
      preview: any
      warnings?: string[]
    }>
  > {
    return httpClient.post('/actions/preview', action)
  }
}

// 导出单例实例
export const actionService = new ActionService()

// 便捷的全局方法
export const getActions = () => actionService.getActions()
export const executeAction = (action: ActionRequest) => actionService.executeAction(action)
export const batchExecuteActions = (actions: BatchActionRequest) =>
  actionService.batchExecute(actions)
export const getActionHistory = (query?: ActionHistoryQuery) => actionService.getHistory(query)
export const stopCurrentAction = () => actionService.stopCurrentAction()
export const getActionStatus = () => actionService.getStatus()
