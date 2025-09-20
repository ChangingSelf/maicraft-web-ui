import versionConfig from '../config/version.json'
import { httpClient } from './httpClient'
import type { ApiException } from '../types/api'

// 类型定义
export interface VersionInfo {
  version: string
  name: string
  description: string
  buildDate: string
  buildTime: string
  buildInfo: string
  author: string
  repository: string
  license: string
  lastUpdated: string
}

// Conventional Commits 类型定义
export type CommitType =
  | 'feat' // 新功能
  | 'fix' // 修复bug
  | 'docs' // 文档更改
  | 'style' // 代码风格更改
  | 'refactor' // 重构
  | 'perf' // 性能优化
  | 'test' // 测试
  | 'chore' // 构建工具或辅助工具的变动
  | 'ci' // CI配置
  | 'build' // 构建过程或外部依赖的变动

export interface VersionChanges {
  feat?: string[]
  fix?: string[]
  docs?: string[]
  style?: string[]
  refactor?: string[]
  perf?: string[]
  test?: string[]
  chore?: string[]
  ci?: string[]
  build?: string[]
  [key: string]: string[] | undefined // 支持其他自定义类型
}

export interface VersionHistory {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  changes: VersionChanges
  summary: string
}

export interface FeatureInfo {
  name: string
  description: string
  version: string
  status: 'stable' | 'beta' | 'planned' | 'deprecated'
}

// 版本服务错误类型
export class VersionServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'VersionServiceError'
  }
}

// 版本管理服务类
class VersionService {
  private versionConfig = versionConfig
  private packageVersion = ''
  private isPackageVersionLoaded = false
  private packageVersionLoadPromise: Promise<void> | null = null

  constructor() {
    this.loadPackageVersion()
  }

  // 从 package.json 加载版本信息（简化版本，直接使用本地导入）
  private async loadPackageVersion(): Promise<void> {
    if (this.isPackageVersionLoaded) {
      return
    }

    if (this.packageVersionLoadPromise) {
      return this.packageVersionLoadPromise
    }

    this.packageVersionLoadPromise = this.loadPackageVersionFromImport()

    try {
      await this.packageVersionLoadPromise
    } catch (error) {
      // 即使加载失败也不要抛出异常，只记录警告
      console.warn('VersionService: Failed to load package version:', error)
      // 使用配置文件中的版本作为兜底
      this.packageVersion = this.versionConfig.current
    } finally {
      this.isPackageVersionLoaded = true
    }
  }

  private async loadPackageVersionFromImport(): Promise<void> {
    try {
      // 直接使用配置文件中的版本，避免动态导入JSON文件的复杂性
      this.packageVersion = this.versionConfig.current
    } catch (error) {
      console.warn('VersionService: Failed to load package version:', error)
      // 使用配置文件中的版本作为兜底
      this.packageVersion = this.versionConfig.current
    }
  }

  // 获取当前版本信息
  async getVersionInfo(): Promise<VersionInfo> {
    const version = await this.getCurrentVersion()
    return {
      version,
      name: this.versionConfig.name,
      description: this.versionConfig.description,
      buildDate: this.versionConfig.buildDate,
      buildTime: this.versionConfig.buildTime,
      buildInfo: this.versionConfig.buildInfo,
      author: this.versionConfig.author,
      repository: this.versionConfig.repository,
      license: this.versionConfig.license,
      lastUpdated: this.versionConfig.changelog.lastUpdated,
    }
  }

  // 同步版本的getVersionInfo（向后兼容）
  getVersionInfoSync(): VersionInfo {
    return {
      version: this.getCurrentVersionSync(),
      name: this.versionConfig.name,
      description: this.versionConfig.description,
      buildDate: this.versionConfig.buildDate,
      buildTime: this.versionConfig.buildTime,
      buildInfo: this.versionConfig.buildInfo,
      author: this.versionConfig.author,
      repository: this.versionConfig.repository,
      license: this.versionConfig.license,
      lastUpdated: this.versionConfig.changelog.lastUpdated,
    }
  }

  // 获取当前版本号（优先使用 package.json，否则使用配置文件）
  async getCurrentVersion(): Promise<string> {
    // 确保package.json已加载
    await this.loadPackageVersion()
    return this.packageVersion || this.versionConfig.current
  }

  // 同步版本的getCurrentVersion（向后兼容）
  getCurrentVersionSync(): string {
    return this.packageVersion || this.versionConfig.current
  }

  // 获取版本历史
  getVersionHistory(): VersionHistory[] {
    return this.versionConfig.changelog.versions.map((version) => ({
      version: version.version,
      date: version.date,
      type: (version.type || 'patch') as 'major' | 'minor' | 'patch',
      changes: version.changes || {},
      summary: version.summary || `版本 ${version.version} 更新`,
    }))
  }

  // 获取最新版本信息
  getLatestVersion(): VersionHistory | null {
    const versions = this.getVersionHistory()
    return versions.length > 0 ? versions[0] : null
  }

  // 获取所有功能列表
  getFeatures(): FeatureInfo[] {
    return this.versionConfig.features.map((feature) => ({
      ...feature,
      status: feature.status as FeatureInfo['status'],
    }))
  }

  // 根据状态获取功能列表
  getFeaturesByStatus(status: FeatureInfo['status']): FeatureInfo[] {
    return this.versionConfig.features
      .filter((feature) => feature.status === status)
      .map((feature) => ({
        ...feature,
        status: feature.status as FeatureInfo['status'],
      }))
  }

  // 检查版本是否为最新
  isLatestVersion(version: string): boolean {
    const latestVersion = this.getLatestVersion()
    return latestVersion ? latestVersion.version === version : false
  }

  // 格式化版本显示
  formatVersion(version: string): string {
    return `v${version}`
  }

  // 格式化日期显示
  formatDate(date: string): string {
    if (!date || typeof date !== 'string') {
      console.warn('VersionService: Invalid date provided:', date)
      return '未知日期'
    }

    try {
      const dateObj = new Date(date)

      // 检查日期是否有效
      if (isNaN(dateObj.getTime())) {
        throw new VersionServiceError(`Invalid date format: ${date}`, 'INVALID_DATE_FORMAT')
      }

      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      console.warn('VersionService: Failed to format date:', date, error)
      return date // 返回原始字符串作为fallback
    }
  }

  // 获取构建信息
  getBuildInfo(): string {
    try {
      const versionInfo = this.getVersionInfoSync()
      return `${versionInfo.buildInfo} (${versionInfo.buildDate})`
    } catch (error) {
      console.warn('VersionService: Failed to get build info:', error)
      return '构建信息不可用'
    }
  }

  // 获取版本比较信息
  compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number)
    const v2 = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0
      const num2 = v2[i] || 0

      if (num1 > num2) return 1
      if (num1 < num2) return -1
    }

    return 0
  }

  // 获取下一个版本号建议
  getNextVersion(type: 'major' | 'minor' | 'patch' = 'patch'): string {
    const currentVersion = this.getCurrentVersionSync()
    const [major, minor, patch] = currentVersion.split('.').map(Number)

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'patch':
        return `${major}.${minor}.${patch + 1}`
      default:
        return currentVersion
    }
  }

  // 检查是否有新版本可用
  async checkForUpdates(): Promise<{
    hasUpdate: boolean
    latestVersion?: string
    currentVersion: string
    error?: string
  }> {
    try {
      // 确保版本信息已加载
      await this.loadPackageVersion()

      const currentVersion = this.getCurrentVersionSync()

      // 这里可以实现实际的版本检查逻辑，比如从服务器API获取最新版本
      // 目前使用本地配置文件的最新版本作为示例
      const latestVersion = this.getLatestVersion()?.version || currentVersion

      // 比较版本
      let hasUpdate = false
      try {
        hasUpdate = this.compareVersions(latestVersion, currentVersion) > 0
      } catch (compareError) {
        console.warn('VersionService: Failed to compare versions:', compareError)
        // 如果比较失败，假设没有更新
        hasUpdate = false
      }

      return {
        hasUpdate,
        latestVersion,
        currentVersion,
      }
    } catch (error) {
      console.warn('VersionService: Failed to check for updates:', error)

      // 返回安全的结果
      const currentVersion = this.getCurrentVersionSync()
      return {
        hasUpdate: false,
        latestVersion: currentVersion,
        currentVersion,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // 根据提交类型推荐版本升级类型
  getRecommendedVersionType(commitTypes: CommitType[]): 'major' | 'minor' | 'patch' {
    if (commitTypes.includes('feat') || commitTypes.includes('perf')) {
      return 'minor' // 新功能或性能优化
    }
    if (commitTypes.includes('fix')) {
      return 'patch' // 修复bug
    }
    return 'patch' // 其他类型默认补丁版本
  }

  // 获取版本的提交类型统计
  getVersionCommitStats(version: VersionHistory): Record<CommitType, number> {
    const stats: Record<CommitType, number> = {
      feat: 0,
      fix: 0,
      docs: 0,
      style: 0,
      refactor: 0,
      perf: 0,
      test: 0,
      chore: 0,
      ci: 0,
      build: 0,
    }

    Object.entries(version.changes).forEach(([type, items]) => {
      if (type in stats && items) {
        stats[type as CommitType] = items.length
      }
    })

    return stats
  }

  // 获取版本的主要变更类型
  getVersionMainChangeType(version: VersionHistory): CommitType | null {
    const stats = this.getVersionCommitStats(version)
    let maxCount = 0
    let mainType: CommitType | null = null

    Object.entries(stats).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count
        mainType = type as CommitType
      }
    })

    return mainType
  }

  // 分析版本变化趋势
  analyzeVersionTrends(): {
    totalVersions: number
    avgChangesPerVersion: number
    mostCommonChangeType: CommitType | null
    versionFrequency: Record<string, number> // 按月份统计
  } {
    const versions = this.getVersionHistory()
    const totalVersions = versions.length

    if (totalVersions === 0) {
      return {
        totalVersions: 0,
        avgChangesPerVersion: 0,
        mostCommonChangeType: null,
        versionFrequency: {},
      }
    }

    // 计算平均变更数
    const totalChanges = versions.reduce((sum, version) => {
      return (
        sum +
        Object.values(version.changes).reduce(
          (typeSum, changes) => typeSum + (changes?.length || 0),
          0,
        )
      )
    }, 0)
    const avgChangesPerVersion = totalChanges / totalVersions

    // 统计最常见的变更类型
    const typeStats: Record<CommitType, number> = {
      feat: 0,
      fix: 0,
      docs: 0,
      style: 0,
      refactor: 0,
      perf: 0,
      test: 0,
      chore: 0,
      ci: 0,
      build: 0,
    }

    versions.forEach((version) => {
      Object.entries(version.changes).forEach(([type, changes]) => {
        if (type in typeStats && changes) {
          typeStats[type as CommitType] += changes.length
        }
      })
    })

    let mostCommonChangeType: CommitType | null = null
    let maxCount = 0
    Object.entries(typeStats).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count
        mostCommonChangeType = type as CommitType
      }
    })

    // 统计版本发布频率（按月份）
    const versionFrequency: Record<string, number> = {}
    versions.forEach((version) => {
      const month = version.date.substring(0, 7) // YYYY-MM
      versionFrequency[month] = (versionFrequency[month] || 0) + 1
    })

    return {
      totalVersions,
      avgChangesPerVersion: Math.round(avgChangesPerVersion * 100) / 100,
      mostCommonChangeType,
      versionFrequency,
    }
  }
}

// 导出单例实例
export const versionService = new VersionService()

// 导出便捷函数（异步版本）
export const getCurrentVersion = () => versionService.getCurrentVersion()
export const getVersionInfo = () => versionService.getVersionInfo()

// 导出便捷函数（同步版本，用于向后兼容）
export const getCurrentVersionSync = () => versionService.getCurrentVersionSync()
export const getVersionInfoSync = () => versionService.getVersionInfoSync()
export const getVersionHistory = () => versionService.getVersionHistory()
export const getFeatures = () => versionService.getFeatures()
export const formatVersion = (version: string) => versionService.formatVersion(version)
export const formatDate = (date: string) => versionService.formatDate(date)

// 分析函数
export const getRecommendedVersionType = (commitTypes: CommitType[]) =>
  versionService.getRecommendedVersionType(commitTypes)
export const getVersionCommitStats = (version: VersionHistory) =>
  versionService.getVersionCommitStats(version)
export const getVersionMainChangeType = (version: VersionHistory) =>
  versionService.getVersionMainChangeType(version)
export const analyzeVersionTrends = () => versionService.analyzeVersionTrends()

export default versionService
