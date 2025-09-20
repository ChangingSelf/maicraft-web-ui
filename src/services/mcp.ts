// MCP 工具 API 服务
import { httpClient } from './httpClient'
import type { ApiResponse } from '../types/api'

// MCP 工具类型定义
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
  category: string
  enabled?: boolean
}

// 工具调用类型定义
export interface ToolCall {
  call_id: string
  tool_name: string
  parameters: Record<string, any>
  status: 'success' | 'error' | 'pending'
  timestamp: number
  execution_time?: number
  result?: {
    content: Array<{
      type: string
      text?: string
    }>
    is_error: boolean
  }
}

// 工具调用历史查询参数
export interface ToolCallsQuery {
  limit?: number
  tool_name?: string
  status?: 'success' | 'error' | 'pending'
  start_time?: number
  end_time?: number
}

// 工具调用请求参数
export interface ToolCallRequest {
  tool_name: string
  arguments: Record<string, any>
}

// 批量调用请求参数
export interface BatchCallRequest {
  calls: Array<{
    tool_name: string
    arguments: Record<string, any>
  }>
  sequential?: boolean
}

// 批量调用响应
export interface BatchCallResponse {
  batch_id: string
  results: ToolCall[]
  total_calls: number
  successful_calls: number
  failed_calls: number
}

// 工具列表响应
export interface ToolsResponse {
  tools: MCPTool[]
  total: number
}

// 调用历史响应
export interface ToolCallsResponse {
  calls: ToolCall[]
  total: number
  has_more?: boolean
}

// API 工具类
class MCPApiService {
  // 获取工具列表
  async getTools(): Promise<ToolsResponse> {
    const response = await httpClient.get<ToolsResponse>('/mcp/tools')
    return response.data
  }

  // 获取工具详情
  async getToolDetail(toolName: string): Promise<MCPTool> {
    const response = await httpClient.get<MCPTool>(`/mcp/tools/${toolName}`)
    return response.data
  }

  // 调用工具
  async callTool(toolName: string, arguments_: Record<string, any>): Promise<ToolCall> {
    const request: ToolCallRequest = {
      tool_name: toolName,
      arguments: arguments_,
    }
    const response = await httpClient.post<ToolCall>('/mcp/tools/call', request)
    return response.data
  }

  // 获取调用历史
  async getToolCalls(query?: ToolCallsQuery): Promise<ToolCallsResponse> {
    const params: Record<string, any> = {}
    if (query?.limit) params.limit = query.limit
    if (query?.tool_name) params.tool_name = query.tool_name
    if (query?.status) params.status = query.status
    if (query?.start_time) params.start_time = query.start_time
    if (query?.end_time) params.end_time = query.end_time

    const response = await httpClient.get<ToolCallsResponse>('/mcp/tools/calls', params)
    return response.data
  }

  // 批量调用工具
  async batchCallTools(request: BatchCallRequest): Promise<BatchCallResponse> {
    const response = await httpClient.post<BatchCallResponse>('/mcp/tools/batch', request)
    return response.data
  }

  // 获取工具调用统计
  async getToolStats(): Promise<{
    total_calls: number
    success_rate: number
    avg_execution_time: number
  }> {
    const response = await httpClient.get('/mcp/tools/stats')
    return response.data
  }

  // 验证工具参数
  async validateToolArguments(
    toolName: string,
    arguments_: Record<string, any>,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const response = await httpClient.post('/mcp/tools/validate', {
      tool_name: toolName,
      arguments: arguments_,
    })
    return response.data
  }
}

// 导出单例实例
export const mcpApi = new MCPApiService()
