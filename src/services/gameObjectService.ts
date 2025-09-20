// 容器和方块管理API服务
import { httpClient } from './httpClient'
import type { ApiResponse } from '../types/api'
import type { Position, Position2D, Container, Block, BlockType } from '../types/game'

// 重新导出类型以保持向后兼容
export type { Position, Position2D, Container, Block, BlockType }

// 容器列表接口
export interface ContainerList {
  containers: Container[]
  total: number
  center_position: Position
  range: number
}

// 容器统计接口
export interface ContainerStats {
  total_containers: number
  chest_count: number
  furnace_count: number
  dispenser_count: number
  dropper_count: number
  hopper_count: number
  barrel_count: number
  shulker_box_count: number
  verified_containers: number
  unverified_containers: number
}

// Block和BlockType类型已从game.ts导入

// 方块统计接口
export interface BlockStats {
  total_blocks: number
  cached_blocks: number
  memory_usage_mb: number
  cache_hit_rate: number
  last_cleanup: string
}

// 区域查询接口
export interface RegionQuery {
  x: number
  z: number
  radius: number
  include_types?: string[]
  exclude_types?: string[]
}

// 搜索查询接口
export interface BlockSearchQuery {
  name?: string
  type?: string
  position?: Position
  radius?: number
  limit?: number
}

// 方块区域响应接口
export interface BlockRegionResponse {
  blocks: Block[]
  total: number
  center: Position2D
  radius: number
  query_time: number
}

// 搜索响应接口
export interface BlockSearchResponse {
  blocks: Block[]
  total: number
  search_term: string
  query_time: number
}

// 游戏对象服务类
export class GameObjectService {
  // ====================
  // 容器管理相关方法
  // ====================

  // 获取容器列表
  async getContainers(query?: {
    type?: string
    range?: number
    center_x?: number
    center_y?: number
    center_z?: number
    verified_only?: boolean
  }): Promise<ApiResponse<ContainerList>> {
    const params: Record<string, any> = {}
    if (query?.type) params.type = query.type
    if (query?.range) params.range = query.range
    if (query?.center_x !== undefined) params.center_x = query.center_x
    if (query?.center_y !== undefined) params.center_y = query.center_y
    if (query?.center_z !== undefined) params.center_z = query.center_z
    if (query?.verified_only) params.verified_only = query.verified_only

    return httpClient.get<ContainerList>('/containers', params)
  }

  // 验证容器存在
  async verifyContainer(
    x: number,
    y: number,
    z: number,
  ): Promise<
    ApiResponse<{
      exists: boolean
      position: Position
      type: string
      inventory: Record<string, number>
      verified: boolean
    }>
  > {
    return httpClient.get(`/containers/verify/${x}/${y}/${z}`)
  }

  // 获取容器统计
  async getContainerStats(): Promise<ApiResponse<ContainerStats>> {
    return httpClient.get<ContainerStats>('/containers/stats')
  }

  // 清理无效容器
  async cleanupInvalidContainers(): Promise<
    ApiResponse<{
      removed_count: number
      message: string
      removed_positions: Position[]
    }>
  > {
    return httpClient.delete('/containers/invalid')
  }

  // 获取容器内容
  async getContainerInventory(
    x: number,
    y: number,
    z: number,
  ): Promise<
    ApiResponse<{
      position: Position
      type: string
      inventory: Record<string, number>
      last_updated: string
    }>
  > {
    return httpClient.get(`/containers/inventory/${x}/${y}/${z}`)
  }

  // 更新容器内容
  async updateContainerInventory(
    x: number,
    y: number,
    z: number,
    inventory: Record<string, number>,
  ): Promise<ApiResponse<{ message: string }>> {
    return httpClient.put(`/containers/inventory/${x}/${y}/${z}`, { inventory })
  }

  // ====================
  // 方块管理相关方法
  // ====================

  // 获取方块统计
  async getBlockStats(): Promise<ApiResponse<BlockStats>> {
    return httpClient.get<BlockStats>('/blocks/stats')
  }

  // 获取区域方块
  async getBlocksInRegion(query: RegionQuery): Promise<ApiResponse<BlockRegionResponse>> {
    return httpClient.get<BlockRegionResponse>('/blocks/region', query)
  }

  // 搜索方块
  async searchBlocks(query: BlockSearchQuery): Promise<ApiResponse<BlockSearchResponse>> {
    return httpClient.get<BlockSearchResponse>('/blocks/search', query)
  }

  // 获取方块类型列表
  async getBlockTypes(): Promise<
    ApiResponse<{
      types: BlockType[]
      total_types: number
      last_updated: string
    }>
  > {
    return httpClient.get('/blocks/types')
  }

  // 获取指定位置的方块
  async getBlockAt(
    x: number,
    y: number,
    z: number,
  ): Promise<ApiResponse<Block & { exists: boolean }>> {
    return httpClient.get(`/blocks/position/${x}/${y}/${z}`)
  }

  // 更新方块信息
  async updateBlock(
    x: number,
    y: number,
    z: number,
    updates: Partial<Block>,
  ): Promise<ApiResponse<Block>> {
    return httpClient.put(`/blocks/position/${x}/${y}/${z}`, updates)
  }

  // 批量更新方块
  async batchUpdateBlocks(
    updates: Array<{
      position: Position
      updates: Partial<Block>
    }>,
  ): Promise<
    ApiResponse<{
      updated_count: number
      failed_count: number
      results: Array<{ position: Position; success: boolean; error?: string }>
    }>
  > {
    return httpClient.post('/blocks/batch-update', { updates })
  }

  // 清空方块缓存
  async clearBlockCache(): Promise<
    ApiResponse<{
      cleared_blocks: number
      message: string
      memory_freed_mb: number
    }>
  > {
    return httpClient.delete('/blocks/cache')
  }

  // 获取缓存信息
  async getCacheInfo(): Promise<
    ApiResponse<{
      total_cached_blocks: number
      memory_usage: number
      cache_regions: Array<{
        center: Position2D
        radius: number
        block_count: number
        last_accessed: string
      }>
      hit_rate: number
    }>
  > {
    return httpClient.get('/blocks/cache')
  }

  // ====================
  // 高级查询方法
  // ====================

  // 查找路径上的方块
  async getBlocksAlongPath(
    start: Position,
    end: Position,
    options?: {
      include_air?: boolean
      max_blocks?: number
      block_types?: string[]
    },
  ): Promise<
    ApiResponse<{
      blocks: Block[]
      path_length: number
      total_blocks: number
    }>
  > {
    return httpClient.post('/blocks/path', {
      start,
      end,
      ...options,
    })
  }

  // 获取区域统计
  async getRegionStats(query: RegionQuery): Promise<
    ApiResponse<{
      region: { center: Position2D; radius: number }
      total_blocks: number
      block_type_counts: Record<string, number>
      average_height: number
      surface_blocks: number
      underground_blocks: number
    }>
  > {
    return httpClient.post('/blocks/region-stats', query)
  }

  // 导出区域数据
  async exportRegion(
    query: RegionQuery,
    format: 'json' | 'csv' = 'json',
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`/blocks/export?format=${format}`, query)
  }
}

// 导出单例实例
export const gameObjectService = new GameObjectService()

// 便捷的全局方法
export const getContainers = (query?: any) => gameObjectService.getContainers(query)
export const getContainerStats = () => gameObjectService.getContainerStats()
export const verifyContainer = (x: number, y: number, z: number) =>
  gameObjectService.verifyContainer(x, y, z)

export const getBlockStats = () => gameObjectService.getBlockStats()
export const getBlocksInRegion = (query: RegionQuery) => gameObjectService.getBlocksInRegion(query)
export const searchBlocks = (query: BlockSearchQuery) => gameObjectService.searchBlocks(query)
export const getBlockAt = (x: number, y: number, z: number) => gameObjectService.getBlockAt(x, y, z)
