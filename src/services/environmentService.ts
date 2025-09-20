// 环境信息API服务
import { httpClient } from './httpClient'
import type { ApiResponse } from '../types/api'
import type {
  PlayerInfo,
  Inventory,
  InventoryItem,
  WorldInfo,
  Marker,
  Entity,
  EnvironmentSnapshot,
} from '../types/game'

// 重新导出类型以保持向后兼容
export type { PlayerInfo, Inventory, InventoryItem, WorldInfo, Marker, Entity, EnvironmentSnapshot }

// 装备物品接口（从game.ts导入）
export type { EquipmentItem } from '../types/game'

// 附近实体查询接口
export interface NearbyEntitiesQuery {
  range_limit?: number // 默认16, 1-64
}

// 附近实体响应接口
export interface NearbyEntitiesResponse {
  entities: Entity[]
  count: number
  range: number
}

// 环境服务类
export class EnvironmentService {
  // 获取环境快照
  async getSnapshot(): Promise<ApiResponse<EnvironmentSnapshot>> {
    return httpClient.get<EnvironmentSnapshot>('/api/environment/snapshot')
  }

  // 获取玩家信息
  async getPlayerInfo(): Promise<ApiResponse<PlayerInfo>> {
    return httpClient.get<PlayerInfo>('/api/environment/player')
  }

  // 获取物品栏信息
  async getInventory(): Promise<ApiResponse<Inventory>> {
    return httpClient.get<Inventory>('/api/environment/inventory')
  }

  // 获取世界信息
  async getWorldInfo(): Promise<ApiResponse<WorldInfo>> {
    return httpClient.get<WorldInfo>('/api/environment/world')
  }

  // 获取附近实体
  async getNearbyEntities(
    query?: NearbyEntitiesQuery,
  ): Promise<ApiResponse<NearbyEntitiesResponse>> {
    const params: Record<string, any> = {}
    if (query?.range_limit) {
      params.range_limit = query.range_limit
    }
    return httpClient.get<NearbyEntitiesResponse>('/api/environment/nearby/entities', params)
  }

  // 获取标记点列表
  async getMarkers(): Promise<ApiResponse<Marker[]>> {
    return httpClient.get<Marker[]>('/environment/markers')
  }

  // 获取指定标记点
  async getMarker(name: string): Promise<ApiResponse<Marker>> {
    return httpClient.get<Marker>(`/environment/markers/${name}`)
  }

  // 创建标记点
  async createMarker(
    marker: Omit<Marker, 'created_time' | 'visit_count'>,
  ): Promise<ApiResponse<Marker>> {
    return httpClient.post<Marker>('/environment/markers', marker)
  }

  // 更新标记点
  async updateMarker(name: string, marker: Partial<Marker>): Promise<ApiResponse<Marker>> {
    return httpClient.put<Marker>(`/environment/markers/${name}`, marker)
  }

  // 删除标记点
  async deleteMarker(name: string): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(`/environment/markers/${name}`)
  }
}

// 导出单例实例
export const environmentService = new EnvironmentService()

// 便捷的全局方法
export const getPlayerInfo = () => environmentService.getPlayerInfo()
export const getWorldInfo = () => environmentService.getWorldInfo()
export const getInventory = () => environmentService.getInventory()
export const getNearbyEntities = (query?: NearbyEntitiesQuery) =>
  environmentService.getNearbyEntities(query)
export const getEnvironmentSnapshot = () => environmentService.getSnapshot()
