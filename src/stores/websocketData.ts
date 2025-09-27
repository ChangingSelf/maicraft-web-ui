import { reactive, ref } from 'vue'
import { type WSEndpointType } from '../services/websocket'

// 玩家数据类型
export interface PlayerData {
  name: string
  health: number
  max_health: number
  food: number
  max_food: number
  experience: number
  level: number
  gamemode: string
  position: {
    x: number
    y: number
    z: number
    yaw: number
    pitch: number
    on_ground: boolean
  }
  equipment: {
    main_hand: any | null
    helmet: any | null
    chestplate: any | null
    leggings: any | null
    boots: any | null
  }
  inventory: {
    occupied_slots: number
    total_slots: number
    empty_slots: number
    items: any[]
  }
}

// 世界数据类型
export interface WorldData {
  time: {
    time_of_day: number
    formatted_time: string
    day_count: number
  }
  weather: {
    weather: string
    formatted_weather: string
    duration: number
  }
  location: {
    dimension: string
    biome: string
    light_level: number
  }
  nearby_blocks: any[]
  nearby_entities: any[]
}

// 日志条目类型
export interface LogEntry {
  timestamp: number | string
  level: string
  module: string
  message: string
  formatted_timestamp?: string
  count?: number
  lastTimestamp?: number | string
  merged?: boolean
}

// Token使用数据类型（根据API文档）
export interface TokenUsageData {
  current_usage: number
  limit: number
  reset_time: string
  usage_history: Array<{
    timestamp: string
    tokens_used: number
    operation: string
  }>
  // 汇总数据
  total_cost?: number
  total_prompt_tokens?: number
  total_completion_tokens?: number
  total_tokens?: number
  total_calls?: number
  model_count?: number
  // 模型详情数据
  models?: Record<string, any>
}

// 任务数据类型（根据API文档）
export interface TaskData {
  id: string
  details: string
  done_criteria: string
  progress: string
  done: boolean
}

// 全局WebSocket数据存储
export interface WebSocketDataStore {
  // 各端点的数据
  player: PlayerData
  world: WorldData
  logs: LogEntry[] // maicraft 日志
  mcpLogs: LogEntry[] // MCP server 日志
  tokenUsage: TokenUsageData
  tasks: TaskData[]

  // 数据更新时间戳
  lastUpdated: Record<WSEndpointType, number>

  // 数据接收统计
  messageCount: Record<WSEndpointType, number>
}

// 创建全局数据存储
const websocketDataStore = reactive<WebSocketDataStore>({
  // 初始化玩家数据
  player: {
    name: '',
    health: 0,
    max_health: 0,
    food: 0,
    max_food: 0,
    experience: 0,
    level: 0,
    gamemode: '',
    position: {
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      pitch: 0,
      on_ground: true,
    },
    equipment: {
      main_hand: null,
      helmet: null,
      chestplate: null,
      leggings: null,
      boots: null,
    },
    inventory: {
      occupied_slots: 0,
      total_slots: 0,
      empty_slots: 0,
      items: [],
    },
  },

  // 初始化世界数据
  world: {
    time: {
      time_of_day: 0,
      formatted_time: '',
      day_count: 0,
    },
    weather: {
      weather: '',
      formatted_weather: '',
      duration: 0,
    },
    location: {
      dimension: '',
      biome: '',
      light_level: 0,
    },
    nearby_blocks: [],
    nearby_entities: [],
  },

  // 初始化其他数据
  logs: [],
  mcpLogs: [],
  tokenUsage: {
    current_usage: 0,
    limit: 0,
    reset_time: '',
    usage_history: [],
  },
  tasks: [],

  // 初始化时间戳
  lastUpdated: {
    PLAYER: 0,
    WORLD: 0,
    MARKER: 0,
    LOGS: 0,
    MCP_LOGS: 0,
    TOKEN_USAGE: 0,
    TASK_MANAGER: 0,
  },

  // 初始化消息计数
  messageCount: {
    PLAYER: 0,
    WORLD: 0,
    MARKER: 0,
    LOGS: 0,
    MCP_LOGS: 0,
    TOKEN_USAGE: 0,
    TASK_MANAGER: 0,
  },
})

// 数据更新函数
export const updatePlayerData = (data: Partial<PlayerData>) => {
  Object.assign(websocketDataStore.player, data)
  websocketDataStore.lastUpdated.PLAYER = Date.now()
  websocketDataStore.messageCount.PLAYER++
  console.log('[WebSocketStore] 玩家数据已更新:', data)
}

export const updateWorldData = (data: Partial<WorldData>) => {
  Object.assign(websocketDataStore.world, data)
  websocketDataStore.lastUpdated.WORLD = Date.now()
  websocketDataStore.messageCount.WORLD++
  console.log('[WebSocketStore] 世界数据已更新:', data)
}

export const addLogEntry = (entry: LogEntry) => {
  // 确保时间戳格式正确
  const timestamp =
    typeof entry.timestamp === 'string' ? entry.timestamp : new Date(entry.timestamp).toISOString()

  // 添加格式化时间戳
  const formattedEntry = {
    ...entry,
    timestamp,
    formatted_timestamp: new Date(entry.timestamp).toLocaleString('zh-CN'),
  }

  websocketDataStore.logs.push(formattedEntry)

  // 限制日志数量，保留最新的1000条
  if (websocketDataStore.logs.length > 1000) {
    websocketDataStore.logs = websocketDataStore.logs.slice(0, 1000)
  }

  websocketDataStore.lastUpdated.LOGS = Date.now()
  websocketDataStore.messageCount.LOGS++
  console.log('[WebSocketStore] 新 maicraft 日志条目:', formattedEntry)
}

export const addMCPLogEntry = (entry: LogEntry) => {
  // 确保时间戳格式正确
  const timestamp =
    typeof entry.timestamp === 'string' ? entry.timestamp : new Date(entry.timestamp).toISOString()

  // 添加格式化时间戳
  const formattedEntry = {
    ...entry,
    timestamp,
    formatted_timestamp: new Date(entry.timestamp).toLocaleString('zh-CN'),
  }

  websocketDataStore.mcpLogs.push(formattedEntry)

  // 限制日志数量，保留最新的1000条
  if (websocketDataStore.mcpLogs.length > 1000) {
    websocketDataStore.mcpLogs = websocketDataStore.mcpLogs.slice(0, 1000)
  }

  websocketDataStore.lastUpdated.MCP_LOGS = Date.now()
  websocketDataStore.messageCount.MCP_LOGS++
  console.log('[WebSocketStore] 新 MCP 日志条目:', formattedEntry)
}

export const updateTokenUsage = (data: any) => {
  // 处理Token使用量更新数据
  if (data.usage) {
    // 单个模型的使用量数据
    Object.assign(websocketDataStore.tokenUsage, data.usage)
  }
  if (data.summary) {
    // 汇总数据
    Object.assign(websocketDataStore.tokenUsage, data.summary)
  }
  if (data.models) {
    // 模型详情数据
    websocketDataStore.tokenUsage.models = data.models
  }
  if (data.total_cost !== undefined) {
    // 直接的汇总数据
    Object.assign(websocketDataStore.tokenUsage, data)
  }

  websocketDataStore.lastUpdated.TOKEN_USAGE = Date.now()
  websocketDataStore.messageCount.TOKEN_USAGE++
  console.log('[WebSocketStore] Token使用数据已更新:', data)
}

export const updateTasks = (tasks: TaskData[]) => {
  websocketDataStore.tasks = tasks
  websocketDataStore.lastUpdated.TASK_MANAGER = Date.now()
  websocketDataStore.messageCount.TASK_MANAGER++
  console.log('[WebSocketStore] 任务数据已更新:', tasks)
}

// 通用数据更新函数
export const updateEndpointData = (endpoint: WSEndpointType, data: any) => {
  switch (endpoint) {
    case 'PLAYER':
      if (data.type === 'player_update') {
        updatePlayerData(data.data)
      }
      break

    case 'WORLD':
      if (data.type === 'world_update') {
        updateWorldData(data.data)
      }
      break

    case 'LOGS':
      if (data.type === 'log' || data.type === 'log_entry') {
        addLogEntry(data)
      } else if (data.type === 'subscribed') {
        console.log('[WebSocketStore] LOGS订阅成功:', data.subscription)
      }
      break

    case 'MCP_LOGS':
      if (data.type === 'log' || data.type === 'log_entry') {
        addMCPLogEntry(data)
      }
      break

    case 'TOKEN_USAGE':
      if (data.type === 'token_usage_update') {
        updateTokenUsage(data.data)
      } else if (data.type === 'usage_response') {
        // 处理获取使用量的响应
        updateTokenUsage(data.data)
      }
      break

    case 'TASK_MANAGER':
      if (data.type === 'tasks_list' || data.type === 'tasks_update') {
        // 处理任务列表和任务更新
        const tasksData = data.data?.tasks || []
        updateTasks(tasksData)
      } else if (
        data.type === 'task_added' ||
        data.type === 'task_updated' ||
        data.type === 'task_deleted' ||
        data.type === 'task_marked_done'
      ) {
        // 处理单个任务操作的响应，需要重新获取任务列表
        console.log(`[WebSocketStore] 任务操作响应: ${data.type}`, data)
      }
      break

    default:
      // 对于其他端点，更新基本统计信息
      websocketDataStore.lastUpdated[endpoint] = Date.now()
      websocketDataStore.messageCount[endpoint]++
      console.log(`[WebSocketStore] ${endpoint} 数据已更新:`, data)
  }
}

// 清空特定端点的数据
export const clearEndpointData = (endpoint: WSEndpointType) => {
  switch (endpoint) {
    case 'PLAYER':
      Object.assign(websocketDataStore.player, {
        name: '',
        health: 0,
        max_health: 0,
        food: 0,
        max_food: 0,
        experience: 0,
        level: 0,
        gamemode: '',
        position: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, on_ground: true },
        equipment: { main_hand: null, helmet: null, chestplate: null, leggings: null, boots: null },
        inventory: { occupied_slots: 0, total_slots: 0, empty_slots: 0, items: [] },
      })
      break

    case 'WORLD':
      Object.assign(websocketDataStore.world, {
        time: { time_of_day: 0, formatted_time: '', day_count: 0 },
        weather: { weather: '', formatted_weather: '', duration: 0 },
        location: { dimension: '', biome: '', light_level: 0 },
        nearby_blocks: [],
        nearby_entities: [],
      })
      break

    case 'LOGS':
      websocketDataStore.logs = []
      break

    case 'MCP_LOGS':
      websocketDataStore.mcpLogs = []
      break

    case 'TOKEN_USAGE':
      Object.assign(websocketDataStore.tokenUsage, {
        current_usage: 0,
        limit: 0,
        reset_time: '',
        usage_history: [],
      })
      break

    case 'TASK_MANAGER':
      websocketDataStore.tasks = []
      break
  }

  websocketDataStore.lastUpdated[endpoint] = 0
  websocketDataStore.messageCount[endpoint] = 0
}

// 获取数据存储的只读访问
export const useWebSocketData = () => {
  return {
    // 数据访问
    playerData: websocketDataStore.player,
    worldData: websocketDataStore.world,
    logs: websocketDataStore.logs,
    mcpLogs: websocketDataStore.mcpLogs,
    tokenUsage: websocketDataStore.tokenUsage,
    tasks: websocketDataStore.tasks,

    // 统计信息
    lastUpdated: websocketDataStore.lastUpdated,
    messageCount: websocketDataStore.messageCount,

    // 数据更新函数
    updatePlayerData,
    updateWorldData,
    addLogEntry,
    addMCPLogEntry,
    updateTokenUsage,
    updateTasks,
    updateEndpointData,
    clearEndpointData,
  }
}

// 导出数据存储（用于调试）
export const getWebSocketDataStore = () => websocketDataStore

console.log('[WebSocketStore] 全局WebSocket数据存储已初始化')
