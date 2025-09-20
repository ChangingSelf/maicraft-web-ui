// 位置管理API服务
import { httpClient } from './httpClient'
import type { ApiResponse } from '../types/api'
import type { Location, Position } from '../types/game'

// 重新导出类型以保持向后兼容
export type { Location, Position }

// 位置列表接口
export interface LocationList {
  locations: Location[]
  total: number
}

// 位置统计接口
export interface LocationStats {
  total_locations: number
  type_distribution: Record<string, number>
  most_visited: Location | null
  recently_created: Location | null
}

// 创建位置请求接口
export interface CreateLocationRequest {
  name: string
  info: string
  position: {
    x: number
    y: number
    z: number
  }
}

// 更新位置请求接口
export interface UpdateLocationRequest {
  name?: string
  info?: string
  position?: {
    x: number
    y: number
    z: number
  }
}

// 位置查询接口
export interface LocationQuery {
  search?: string
  sort_by?: 'name' | 'created_time' | 'visit_count' | 'distance'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 距离计算接口
export interface DistanceQuery {
  from_x: number
  from_y: number
  from_z: number
  max_distance?: number
  limit?: number
}

// 位置服务类
export class LocationService {
  // 获取所有位置点
  async getLocations(query?: LocationQuery): Promise<ApiResponse<LocationList>> {
    const params: Record<string, any> = {}
    if (query?.search) params.search = query.search
    if (query?.sort_by) params.sort_by = query.sort_by
    if (query?.sort_order) params.sort_order = query.sort_order
    if (query?.limit) params.limit = query.limit
    if (query?.offset) params.offset = query.offset

    return httpClient.get<LocationList>('/locations', params)
  }

  // 获取位置统计
  async getStats(): Promise<ApiResponse<LocationStats>> {
    return httpClient.get<LocationStats>('/locations/stats')
  }

  // 获取指定位置
  async getLocation(name: string): Promise<ApiResponse<Location>> {
    return httpClient.get<Location>(`/locations/${name}`)
  }

  // 创建位置点
  async createLocation(location: CreateLocationRequest): Promise<ApiResponse<Location>> {
    return httpClient.post<Location>('/locations', location)
  }

  // 更新位置点
  async updateLocation(
    name: string,
    updates: UpdateLocationRequest,
  ): Promise<ApiResponse<Location>> {
    return httpClient.put<Location>(`/locations/${name}`, updates)
  }

  // 删除位置点
  async deleteLocation(name: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/locations/${name}`)
  }

  // 批量删除位置点
  async batchDelete(
    names: string[],
  ): Promise<ApiResponse<{ deleted_count: number; message: string }>> {
    return httpClient.post('/locations/batch-delete', { names })
  }

  // 按距离查找位置点
  async findNearby(query: DistanceQuery): Promise<ApiResponse<LocationList>> {
    return httpClient.post<LocationList>('/locations/nearby', query)
  }

  // 导出位置数据
  async exportLocations(format: 'json' | 'csv' = 'json'): Promise<ApiResponse<any>> {
    return httpClient.get(`/locations/export?format=${format}`)
  }

  // 导入位置数据
  async importLocations(
    data: Location[],
    overwrite: boolean = false,
  ): Promise<ApiResponse<{ imported_count: number; message: string }>> {
    return httpClient.post('/locations/import', { locations: data, overwrite })
  }

  // 验证位置名称是否存在
  async validateName(name: string): Promise<ApiResponse<{ exists: boolean; available: boolean }>> {
    return httpClient.post('/locations/validate-name', { name })
  }

  // 获取位置点的访问历史
  async getVisitHistory(
    name: string,
    limit: number = 10,
  ): Promise<
    ApiResponse<{
      visits: Array<{
        timestamp: number
        action: 'visit' | 'create' | 'update'
      }>
      total_visits: number
    }>
  > {
    return httpClient.get(`/locations/${name}/history?limit=${limit}`)
  }

  // 计算两位置之间的距离
  async calculateDistance(
    fromName: string,
    toName: string,
  ): Promise<
    ApiResponse<{
      from: Location
      to: Location
      distance: number
      distance_2d: number // 平面距离
      height_difference: number
    }>
  > {
    return httpClient.post('/locations/distance', { from: fromName, to: toName })
  }

  // 获取位置点的路径规划
  async getPath(
    fromName: string,
    toName: string,
    options?: {
      max_distance?: number
      avoid_water?: boolean
      prefer_roads?: boolean
    },
  ): Promise<
    ApiResponse<{
      path: Array<{ x: number; y: number; z: number }>
      total_distance: number
      estimated_time: number
      waypoints: string[]
    }>
  > {
    return httpClient.post('/locations/path', {
      from: fromName,
      to: toName,
      ...options,
    })
  }

  // 搜索位置点
  async searchLocations(query: {
    text?: string
    position?: { x: number; y: number; z: number; radius: number }
    tags?: string[]
    created_after?: number
    created_before?: number
    min_visits?: number
    max_visits?: number
  }): Promise<ApiResponse<LocationList>> {
    return httpClient.post<LocationList>('/locations/search', query)
  }
}

// 导出单例实例
export const locationService = new LocationService()

// 便捷的全局方法
export const getLocations = (query?: LocationQuery) => locationService.getLocations(query)
export const getLocation = (name: string) => locationService.getLocation(name)
export const createLocation = (location: CreateLocationRequest) =>
  locationService.createLocation(location)
export const updateLocation = (name: string, updates: UpdateLocationRequest) =>
  locationService.updateLocation(name, updates)
export const deleteLocation = (name: string) => locationService.deleteLocation(name)
