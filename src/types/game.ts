// 游戏相关的通用类型定义
// 基于API文档的通用类型定义

// 基础位置类型
export interface Position {
  x: number
  y: number
  z: number
}

// 2D位置类型
export interface Position2D {
  x: number
  z: number
}

// 物品栏物品类型
export interface InventoryItem {
  slot: number
  name: string
  display_name: string
  count: number
  damage: number
  max_damage: number
}

// 物品栏类型
export interface Inventory {
  occupied_slots: number
  total_slots: number
  items: InventoryItem[]
}

// 装备物品类型
export interface EquipmentItem {
  name: string
  display_name: string
  count: number
  damage: number
  max_damage: number
}

// 日志条目类型
export interface LogEntry {
  timestamp: number
  level: string
  module: string
  message: string
  file?: string
  line?: number
  extra?: Record<string, any>
}

// 日志配置类型
export interface LogConfig {
  level: string
}

// 日志级别信息类型
export interface LogLevelInfo {
  current_level: string
  available_levels: string[]
}

// 日志统计类型
export interface LogStats {
  total_logs: number
  level_counts: Record<string, number>
  module_counts: Record<string, number>
}

// 日志查询参数类型
export interface LogQueryParams {
  limit?: number
  level?: string
  module?: string
  message_contains?: string
  since_minutes?: number
}

// 日志响应类型
export interface LogResponse {
  logs: LogEntry[]
  total: number
  has_more: boolean
}

// 玩家信息类型 - 根据API文档调整
export interface PlayerInfo {
  name: string
  health: number
  max_health: number
  food: number
  max_food: number
  position: Position & {
    yaw?: number
    pitch?: number
  }
  gamemode: string
  equipment?: {
    main_hand?: EquipmentItem
  }
}

// 世界信息类型
export interface WorldInfo {
  time?: {
    time_of_day: number
    formatted_time: string
    day_count: number
  }
  weather?: {
    weather: string
    formatted_weather: string
    duration: number
  }
  location?: {
    dimension: string
    biome: string
    light_level: number
  }
}

// 实体类型
export interface Entity {
  name: string
  display_name: string
  type: string
  distance: number
  position: Position
  health: number
  max_health: number
}

// 位置点类型
export interface Location {
  name: string
  info: string
  position: Position
  created_time: number | null
  visit_count: number
}

// 位置列表响应类型
export interface LocationListResponse {
  locations: Location[]
  total: number
}

// 位置统计类型
export interface LocationStats {
  total_locations: number
  type_distribution: Record<string, number>
}

// 位置创建/更新请求类型
export interface LocationRequest {
  name: string
  info: string
  position: Position
}

// 标记点类型（用于环境快照）
export interface Marker {
  name: string
  position: Position
  type?: string
  color?: string
}

// 环境快照类型
export interface EnvironmentSnapshot {
  player: PlayerInfo
  world: WorldInfo
  markers: Marker[]
  timestamp: number
}

// 容器类型
export interface Container {
  position: Position
  type: string
  inventory: Record<string, number> // slot -> count
  verified: boolean
  last_verified?: number
}

// 容器列表响应类型
export interface ContainerListResponse {
  containers: Container[]
  total: number
  center_position: Position
  range: number
}

// 容器验证响应类型
export interface ContainerVerificationResponse {
  exists: boolean
  position: Position
  type: string
  inventory: Record<string, any>
}

// 容器清理响应类型
export interface ContainerCleanupResponse {
  removed_count: number
  message: string
}

// 容器统计类型
export interface ContainerStats {
  total_containers: number
  chest_count: number
  furnace_count: number
}

// 方块类型
export interface Block {
  position: Position
  type: string
  name: string
  last_updated: string
  update_count: number
  distance: number
}

// 方块类型信息
export interface BlockType {
  type: string
  count: number
  names: string[]
}

// 方块统计类型
export interface BlockStats {
  total_blocks: number
  cached_blocks: number
  memory_usage_mb: number
}

// 区域方块响应类型
export interface BlockRegionResponse {
  blocks: Block[]
  total: number
  center: Position2D
  radius: number
}

// 方块搜索响应类型
export interface BlockSearchResponse {
  blocks: Block[]
  total: number
  search_term: string
}

// 方块类型列表响应类型
export interface BlockTypesResponse {
  types: BlockType[]
  total_types: number
}

// 位置方块响应类型
export interface BlockPositionResponse extends Block {
  exists: boolean
}

// 方块缓存清理响应类型
export interface BlockCacheCleanupResponse {
  cleared_blocks: number
  message: string
}

// Token使用量类型
export interface TokenUsage {
  model_name: string
  total_prompt_tokens: number
  total_completion_tokens: number
  total_tokens: number
  total_calls: number
  total_cost: number
  first_call_time: number
  last_call_time: number
  last_updated: number
}

// MCP工具类型
export interface Tool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

// MCP工具列表响应类型
export interface ToolListResponse {
  tools: Tool[]
  total: number
}

// MCP工具调用请求类型
export interface ToolCallRequest {
  tool_name: string
  arguments: Record<string, any>
}

// MCP工具调用响应类型
export interface ToolCallResponse {
  tool_name: string
  arguments: Record<string, any>
  result: ToolResult
}

// MCP工具调用结果
export interface ToolResult {
  content: Array<{
    type: string
    text: string
  }>
  is_error: boolean
  data?: any
}

// 动作类型枚举
export type ActionType =
  | 'move'
  | 'mine_block'
  | 'mine_block_by_position'
  | 'mine_in_direction'
  | 'craft'
  | 'use_furnace'
  | 'use_chest'
  | 'eat'
  | 'kill_mob'
  | 'toss_item'
  | 'use_item'
  | 'place_block'
  | 'interact_block'

// 动作信息类型
export interface ActionInfo {
  action_type: ActionType
  name: string
  description: string
  parameters: Record<string, any>
  category: string
  enabled: boolean
}

// 动作结果类型
export interface ActionResult {
  success: boolean
  message: string
  data?: any
  execution_time?: number
  timestamp: number
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: string
  timestamp: number
  data?: any
}

// WebSocket错误消息类型
export interface WSErrorMessage extends WebSocketMessage {
  type: 'error'
  errorCode: string
  message: string
}

// WebSocket订阅消息类型（通用）
export interface WSSubscribeMessage extends WebSocketMessage {
  type: 'subscribe'
  update_interval?: number
  [key: string]: any
}

export interface WSHeartbeatMessage extends WebSocketMessage {
  type: 'ping' | 'pong'
}

export interface WSLogMessage extends WebSocketMessage {
  type: 'log'
  level: string
  module: string
  message: string
  file?: string
  line?: number
}

// WebSocket日志订阅消息类型
export interface WSLogSubscribeMessage extends WebSocketMessage {
  type: 'subscribe'
  levels?: string[]
  modules?: string[]
}

export interface WSPlayerMessage extends WebSocketMessage {
  type: 'player_update'
  data: PlayerInfo
}

export interface WSWorldMessage extends WebSocketMessage {
  type: 'world_update'
  data: WorldInfo
}

export interface WSMarkerMessage extends WebSocketMessage {
  type: 'marker_update'
  data: any
}

// WebSocket游戏状态订阅消息类型
export interface WSGameSubscribeMessage extends WebSocketMessage {
  type: 'subscribe'
  update_interval: number
}

export interface WSTokenMessage extends WebSocketMessage {
  type: 'token_usage_update'
  data: {
    model_name: string
    usage: TokenUsage
    summary: {
      total_cost: number
      total_prompt_tokens: number
      total_completion_tokens: number
      total_tokens: number
      total_calls: number
      model_count: number
    }
  }
}

// Token使用量订阅消息类型
export interface WSTokenSubscribeMessage extends WebSocketMessage {
  type: 'subscribe'
  update_interval: number
  model_filter: string | null
}

// 任务管理相关类型
export interface Task {
  id: string
  details: string
  done_criteria?: string
  progress?: string
  done: boolean
}

export interface TaskStats {
  total: number
  completed: number
  pending: number
  goal: string
  is_done: boolean
}

// 任务WebSocket消息类型
export interface WSTaskSubscribeMessage extends WebSocketMessage {
  type: 'subscribe'
  update_interval: number
}

export interface WSTaskListMessage extends WebSocketMessage {
  type: 'get_tasks'
}

export interface WSTaskAddMessage extends WebSocketMessage {
  type: 'add_task'
  details: string
  done_criteria: string
  progress?: string
}

export interface WSTaskUpdateMessage extends WebSocketMessage {
  type: 'update_task'
  task_id: string
  progress: string
}

export interface WSTaskDeleteMessage extends WebSocketMessage {
  type: 'delete_task'
  task_id: string
}

export interface WSTaskMarkDoneMessage extends WebSocketMessage {
  type: 'mark_done'
  task_id: string
}

export interface WSTaskUnsubscribeMessage extends WebSocketMessage {
  type: 'unsubscribe'
}

// 任务响应消息类型
export interface WSTaskResponse extends WebSocketMessage {
  type:
    | 'subscribed'
    | 'unsubscribed'
    | 'task_added'
    | 'task_updated'
    | 'task_deleted'
    | 'task_marked_done'
  message: string
  data?: any
  timestamp: number
}

export interface WSTasksListResponse extends WebSocketMessage {
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

export interface WSTasksUpdateResponse extends WebSocketMessage {
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
