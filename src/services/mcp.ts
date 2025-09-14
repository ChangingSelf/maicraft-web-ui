// MCP 工具 API 服务
const API_BASE = 'http://localhost:8000/api'

// API 响应基础类型
interface ApiResponse<T = any> {
  isSuccess: boolean
  message: string
  data: T
}

// MCP 工具类型定义
export interface MCPTool {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
  category: string
  enabled: boolean
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
  parameters: Record<string, any>
  async?: boolean
  timeout?: number
}

// 批量调用请求参数
export interface BatchCallRequest {
  calls: Array<{
    tool_name: string
    parameters: Record<string, any>
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
  categories: string[]
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse<T> = await response.json()

      if (!data.isSuccess) {
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // 获取工具列表
  async getTools(): Promise<ToolsResponse> {
    const response = await this.request<ToolsResponse>('/mcp/tools')
    return response.data
  }

  // 获取工具详情
  async getToolDetail(toolName: string): Promise<MCPTool> {
    const response = await this.request<MCPTool>(`/mcp/tools/${toolName}`)
    return response.data
  }

  // 调用工具
  async callTool(toolName: string, request: ToolCallRequest): Promise<ToolCall> {
    const response = await this.request<ToolCall>(`/mcp/tools/${toolName}/call`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return response.data
  }

  // 获取调用历史
  async getToolCalls(query?: ToolCallsQuery): Promise<ToolCallsResponse> {
    const params = new URLSearchParams()
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.tool_name) params.append('tool_name', query.tool_name)
    if (query?.status) params.append('status', query.status)
    if (query?.start_time) params.append('start_time', query.start_time.toString())
    if (query?.end_time) params.append('end_time', query.end_time.toString())

    const queryString = params.toString()
    const endpoint = `/mcp/tools/calls${queryString ? `?${queryString}` : ''}`

    const response = await this.request<ToolCallsResponse>(endpoint)
    return response.data
  }

  // 批量调用工具
  async batchCallTools(request: BatchCallRequest): Promise<BatchCallResponse> {
    const response = await this.request<BatchCallResponse>('/mcp/tools/batch', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return response.data
  }
}

// 导出单例实例
export const mcpApi = new MCPApiService()
