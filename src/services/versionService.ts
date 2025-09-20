import versionConfig from '../config/version.json'

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
  [key: string]: string[] // key 为 CommitType，value 为变更列表
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

// 版本管理服务类
class VersionService {
  private versionConfig = versionConfig
  private packageVersion = ''

  constructor() {
    this.loadPackageVersion()
  }

  // 从 package.json 加载版本信息
  private async loadPackageVersion() {
    try {
      const packageJson = await fetch('/package.json')
      const packageData = await packageJson.json()
      this.packageVersion = packageData.version || '0.0.0'
    } catch (error) {
      console.warn('无法加载 package.json 版本信息:', error)
      this.packageVersion = '0.0.0'
    }
  }

  // 获取当前版本信息
  getVersionInfo(): VersionInfo {
    return {
      version: this.getCurrentVersion(),
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
  getCurrentVersion(): string {
    return this.packageVersion || this.versionConfig.current
  }

  // 获取版本历史
  getVersionHistory(): VersionHistory[] {
    return this.versionConfig.changelog.versions.map((version) => ({
      version: version.version,
      date: version.date,
      type: (version.semverType || version.type) as 'major' | 'minor' | 'patch',
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
    try {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      return date
    }
  }

  // 获取构建信息
  getBuildInfo(): string {
    const versionInfo = this.getVersionInfo()
    return `${versionInfo.buildInfo} (${versionInfo.buildDate})`
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
    const currentVersion = this.getCurrentVersion()
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

  // 检查是否有新版本可用（模拟）
  async checkForUpdates(): Promise<{
    hasUpdate: boolean
    latestVersion?: string
    currentVersion: string
  }> {
    // 这里可以实现实际的版本检查逻辑，比如从服务器API获取最新版本
    const currentVersion = this.getCurrentVersion()
    const latestVersion = this.getLatestVersion()?.version || currentVersion

    return {
      hasUpdate: this.compareVersions(latestVersion, currentVersion) > 0,
      latestVersion,
      currentVersion,
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
      if (type in stats) {
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
        Object.values(version.changes).reduce((typeSum, changes) => typeSum + changes.length, 0)
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
        if (type in typeStats) {
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

// 导出便捷函数
export const getCurrentVersion = () => versionService.getCurrentVersion()
export const getVersionInfo = () => versionService.getVersionInfo()
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
