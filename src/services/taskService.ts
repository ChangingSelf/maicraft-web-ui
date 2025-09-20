import { ref, reactive, computed } from 'vue'
import { getWebSocketManager, connectWebSocket, disconnectWebSocket } from './websocket'
import type { GameWebSocketManager } from './websocket'

// 任务接口定义
export interface Task {
  id: string
  details: string
  done_criteria?: string
  progress?: string
  done: boolean
}

// 任务列表响应接口
export interface TasksResponse {
  type: 'tasks_list'
  message: string
  data: {
    tasks: Task[]
    total: number
    completed: number
    pending: number
    goal: string
    is_done: boolean
  }
  timestamp: number
}

// 任务更新推送接口
export interface TasksUpdateResponse {
  type: 'tasks_update'
  timestamp: number
  data: {
    tasks: Task[]
    total: number
    completed: number
    pending: number
    goal: string
    is_done: boolean
  }
}

// 任务服务状态
interface TaskServiceState {
  tasks: Task[]
  goal: string
  is_done: boolean
  total: number
  completed: number
  pending: number
  loading: boolean
  error: string | null
  isConnected: boolean
}

// 任务服务类
export class TaskService {
  private wsManager: GameWebSocketManager | null = null
  private messageHandler: ((message: any) => void) | null = null
  private connectionHandler: ((connected: boolean) => void) | null = null

  // 响应式状态
  public state = reactive<TaskServiceState>({
    tasks: [],
    goal: '',
    is_done: false,
    total: 0,
    completed: 0,
    pending: 0,
    loading: false,
    error: null,
    isConnected: false,
  })

  constructor() {
    this.initWebSocket()
  }

  // 初始化WebSocket连接
  private initWebSocket() {
    try {
      this.wsManager = getWebSocketManager('TASK_MANAGER')

      // 设置消息处理器
      this.messageHandler = (message: any) => {
        this.handleWebSocketMessage(message)
      }
      this.wsManager.addMessageHandler(this.messageHandler)

      // 设置连接状态处理器
      this.connectionHandler = (connected: boolean) => {
        this.state.isConnected = connected
        if (!connected) {
          this.state.error = 'WebSocket连接断开'
        } else {
          this.state.error = null
        }
      }
      this.wsManager.addConnectionHandler(this.connectionHandler)
    } catch (error) {
      console.error('初始化任务WebSocket失败:', error)
      this.state.error = '初始化WebSocket失败'
    }
  }

  // 处理WebSocket消息
  private handleWebSocketMessage(message: any) {
    console.log('收到任务WebSocket消息:', message)

    try {
      switch (message.type) {
        case 'subscribed':
          console.log('任务WebSocket订阅成功:', message.message)
          break

        case 'unsubscribed':
          console.log('任务WebSocket取消订阅:', message.message)
          break

        case 'tasks_list':
          this.updateTasksData(message.data)
          break

        case 'tasks_update':
          this.updateTasksData(message.data)
          break

        case 'task_added':
          console.log('任务添加成功:', message.data)
          // 重新获取任务列表以确保数据同步
          this.getTasks()
          break

        case 'task_updated':
          console.log('任务更新成功:', message.data)
          break

        case 'task_deleted':
          console.log('任务删除成功:', message.data)
          // 重新获取任务列表以确保数据同步
          this.getTasks()
          break

        case 'task_marked_done':
          console.log('任务标记完成成功:', message.data)
          break

        case 'error':
          console.error('任务WebSocket错误:', message.message)
          this.state.error = message.message
          break

        default:
          console.log('未知的任务消息类型:', message.type)
      }
    } catch (error) {
      console.error('处理任务WebSocket消息失败:', error)
      this.state.error = '处理消息失败'
    }
  }

  // 更新任务数据
  private updateTasksData(data: any) {
    this.state.tasks = data.tasks || []
    this.state.total = data.total || 0
    this.state.completed = data.completed || 0
    this.state.pending = data.pending || 0
    this.state.goal = data.goal || ''
    this.state.is_done = data.is_done || false
    this.state.loading = false
    this.state.error = null
  }

  // 连接WebSocket
  async connect(): Promise<void> {
    if (!this.wsManager) {
      throw new Error('WebSocket管理器未初始化')
    }

    try {
      this.wsManager.connect()
      // 等待连接建立后订阅
      setTimeout(() => {
        this.subscribe()
      }, 1000)
    } catch (error) {
      console.error('连接任务WebSocket失败:', error)
      this.state.error = '连接失败'
      throw error
    }
  }

  // 断开WebSocket连接
  disconnect(): void {
    if (this.wsManager) {
      this.wsManager.disconnect()
    }
  }

  // 订阅任务更新
  subscribe(updateInterval = 5000): boolean {
    if (!this.wsManager) {
      console.error('WebSocket管理器未初始化')
      return false
    }

    const message = {
      type: 'subscribe',
      update_interval: updateInterval,
    }

    console.log('发送订阅消息:', message)
    return this.wsManager.sendMessage(message)
  }

  // 取消订阅
  unsubscribe(): boolean {
    if (!this.wsManager) {
      console.error('WebSocket管理器未初始化')
      return false
    }

    const message = {
      type: 'unsubscribe',
    }

    console.log('发送取消订阅消息:', message)
    return this.wsManager.sendMessage(message)
  }

  // 获取任务列表
  async getTasks(): Promise<void> {
    if (!this.wsManager || !this.state.isConnected) {
      throw new Error('WebSocket未连接')
    }

    this.state.loading = true
    this.state.error = null

    const message = {
      type: 'get_tasks',
    }

    console.log('发送获取任务列表消息:', message)
    const success = this.wsManager.sendMessage(message)

    if (!success) {
      this.state.loading = false
      this.state.error = '发送消息失败'
      throw new Error('发送消息失败')
    }

    // 设置超时，如果5秒内没有响应则取消loading状态
    setTimeout(() => {
      if (this.state.loading) {
        this.state.loading = false
        this.state.error = '请求超时'
      }
    }, 5000)
  }

  // 添加任务
  async addTask(details: string, doneCriteria: string, progress?: string): Promise<void> {
    if (!this.wsManager || !this.state.isConnected) {
      throw new Error('WebSocket未连接')
    }

    const message = {
      type: 'add_task',
      details,
      done_criteria: doneCriteria,
      ...(progress && { progress }),
    }

    console.log('发送添加任务消息:', message)
    const success = this.wsManager.sendMessage(message)

    if (!success) {
      throw new Error('发送消息失败')
    }
  }

  // 更新任务进度
  async updateTaskProgress(taskId: string, progress: string): Promise<void> {
    if (!this.wsManager || !this.state.isConnected) {
      throw new Error('WebSocket未连接')
    }

    const message = {
      type: 'update_task',
      task_id: taskId,
      progress,
    }

    console.log('发送更新任务进度消息:', message)
    const success = this.wsManager.sendMessage(message)

    if (!success) {
      throw new Error('发送消息失败')
    }
  }

  // 删除任务
  async deleteTask(taskId: string): Promise<void> {
    if (!this.wsManager || !this.state.isConnected) {
      throw new Error('WebSocket未连接')
    }

    const message = {
      type: 'delete_task',
      task_id: taskId,
    }

    console.log('发送删除任务消息:', message)
    const success = this.wsManager.sendMessage(message)

    if (!success) {
      throw new Error('发送消息失败')
    }
  }

  // 标记任务完成
  async markTaskDone(taskId: string): Promise<void> {
    if (!this.wsManager || !this.state.isConnected) {
      throw new Error('WebSocket未连接')
    }

    const message = {
      type: 'mark_done',
      task_id: taskId,
    }

    console.log('发送标记任务完成消息:', message)
    const success = this.wsManager.sendMessage(message)

    if (!success) {
      throw new Error('发送消息失败')
    }
  }

  // 获取任务统计信息
  getTaskStats(): {
    total: number
    completed: number
    pending: number
    is_done: boolean
    is_all_done: boolean
    goal: string
  } {
    return {
      total: this.state.total,
      completed: this.state.completed,
      pending: this.state.pending,
      is_done: this.state.is_done,
      is_all_done: this.state.is_done,
      goal: this.state.goal,
    }
  }

  // 销毁服务
  destroy() {
    if (this.messageHandler && this.wsManager) {
      this.wsManager.removeMessageHandler(this.messageHandler)
    }
    if (this.connectionHandler && this.wsManager) {
      this.wsManager.removeConnectionHandler(this.connectionHandler)
    }
    this.disconnect()
  }
}

// 单例模式的任务服务实例
let taskServiceInstance: TaskService | null = null

export const getTaskService = (): TaskService => {
  if (!taskServiceInstance) {
    taskServiceInstance = new TaskService()
  }
  return taskServiceInstance
}

// 便捷函数
export const connectTaskWS = () => connectWebSocket('TASK_MANAGER')
export const disconnectTaskWS = () => disconnectWebSocket('TASK_MANAGER')
