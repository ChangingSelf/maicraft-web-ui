// MCP 工具 API 服务
import { httpClient } from './httpClient'
import type { ApiResponse } from '../types/api'

// MCP 工具类型定义（基于API文档的原始MCP格式）
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
  // 注意：category 和 enabled 不在API返回的原始数据中，需要前端处理
  category?: string
  enabled?: boolean
}

// 工具调用结果类型定义（基于API文档的MCP原始格式）
export interface CallToolResult {
  content: Array<{
    type: string
    text: string
  }>
  structured_content: any
  is_error: boolean
  data?: Record<string, any>
}

// 工具调用历史记录（本地存储使用）
export interface ToolCall {
  call_id: string
  tool_name: string
  parameters: Record<string, any>
  status: 'success' | 'error' | 'pending'
  timestamp: number
  execution_time?: number
  result?: CallToolResult
}

// 工具调用请求参数
export interface ToolCallRequest {
  tool_name: string
  arguments: Record<string, any>
}

// 工具调用响应（基于API文档）
export interface ToolCallResponse {
  tool_name: string
  arguments: Record<string, any>
  result: CallToolResult
}

// 工具列表响应
export interface ToolsResponse {
  tools: MCPTool[]
  total: number
}

// 本地存储键名
const LOCAL_STORAGE_KEYS = {
  TOOL_HISTORY: 'mcp_tool_history',
} as const

// API 工具类
class MCPApiService {
  // 获取工具列表
  async getTools(): Promise<ToolsResponse> {
    const response = await httpClient.get<ToolsResponse>('/mcp/tools')
    return response.data
  }

  // 调用工具
  async callTool(toolName: string, arguments_: Record<string, any>): Promise<ToolCallResponse> {
    const request: ToolCallRequest = {
      tool_name: toolName,
      arguments: arguments_,
    }
    const response = await httpClient.post<ToolCallResponse>('/mcp/tools/call', request)
    return response.data
  }

  // === 本地历史记录管理 ===

  // 获取本地历史记录
  getLocalHistory(): ToolCall[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.TOOL_HISTORY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('读取本地历史记录失败:', error)
      return []
    }
  }

  // 保存工具调用到本地历史
  saveToHistory(toolCall: ToolCall): void {
    try {
      const history = this.getLocalHistory()
      history.unshift(toolCall) // 最新的在前面

      // 限制历史记录数量（最多保留100条）
      const limitedHistory = history.slice(0, 100)

      localStorage.setItem(LOCAL_STORAGE_KEYS.TOOL_HISTORY, JSON.stringify(limitedHistory))
    } catch (error) {
      console.error('保存历史记录失败:', error)
    }
  }

  // 清空本地历史记录
  clearLocalHistory(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOOL_HISTORY)
    } catch (error) {
      console.error('清空历史记录失败:', error)
    }
  }

  // 根据条件筛选历史记录
  filterHistory(query?: { tool_name?: string; status?: string; limit?: number }): ToolCall[] {
    let history = this.getLocalHistory()

    // 按工具名称筛选
    if (query?.tool_name) {
      history = history.filter((call) => call.tool_name === query.tool_name)
    }

    // 按状态筛选
    if (query?.status) {
      history = history.filter((call) => call.status === query.status)
    }

    // 限制数量
    if (query?.limit) {
      history = history.slice(0, query.limit)
    }

    return history
  }
}

// 导出单例实例
export const mcpApi = new MCPApiService()
