// MCP组件导出文件
export { default as ToolList } from './ToolList.vue'
export { default as ToolDetail } from './ToolDetail.vue'
export { default as HistoryPanel } from './HistoryPanel.vue'
export { default as NotificationPanel } from './NotificationPanel.vue'

// 类型定义
export interface MCPNotification {
  id?: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  read?: boolean
}

// 工具执行参数接口
export interface ToolExecutionParams {
  [key: string]: any
  _async?: boolean
  _timeout?: number
}
