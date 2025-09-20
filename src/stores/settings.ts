import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

// 设置接口定义
export interface AppSettings {
  // WebSocket配置
  websocket: {
    host: string
    port: number
    enableHeartbeat: boolean
    heartbeatInterval: number
    reconnectInterval: number
    maxReconnectAttempts: number
    enableAutoReconnect: boolean
  }
  // API配置
  api: {
    host: string
    port: number
    timeout: number
  }
}

// 默认设置
const defaultSettings: AppSettings = {
  websocket: {
    host: 'localhost',
    port: 20914,
    enableHeartbeat: true,
    heartbeatInterval: 10000,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    enableAutoReconnect: true,
  },
  api: {
    host: 'localhost',
    port: 20914,
    timeout: 10000,
  },
}

// 从环境变量和本地存储加载设置
const loadSettings = (): AppSettings => {
  try {
    // 首先从环境变量读取基础配置
    const envSettings: Partial<AppSettings> = {}

    // WebSocket配置从环境变量
    if (import.meta.env.VITE_WS_HOST) {
      envSettings.websocket = { ...defaultSettings.websocket, host: import.meta.env.VITE_WS_HOST }
    }
    if (import.meta.env.VITE_WS_PORT) {
      envSettings.websocket = {
        ...envSettings.websocket,
        ...defaultSettings.websocket,
        port: parseInt(import.meta.env.VITE_WS_PORT),
      }
    }

    // API配置从环境变量
    if (import.meta.env.VITE_API_HOST) {
      envSettings.api = { ...defaultSettings.api, host: import.meta.env.VITE_API_HOST }
    }
    if (import.meta.env.VITE_API_PORT) {
      envSettings.api = {
        ...envSettings.api,
        ...defaultSettings.api,
        port: parseInt(import.meta.env.VITE_API_PORT),
      }
    }

    // 从本地存储加载用户设置
    const savedSettings = localStorage.getItem('maicraft-settings')
    const userSettings = savedSettings ? JSON.parse(savedSettings) : {}

    // 合并：环境变量 > 用户设置 > 默认设置
    return {
      ...defaultSettings,
      ...userSettings,
      ...envSettings,
      // 深度合并嵌套对象
      websocket: {
        ...defaultSettings.websocket,
        ...userSettings.websocket,
        ...envSettings.websocket,
      },
      api: { ...defaultSettings.api, ...userSettings.api, ...envSettings.api },
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    return defaultSettings
  }
}

// 保存设置到本地存储
const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem('maicraft-settings', JSON.stringify(settings))
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // 响应式设置状态
  const settings = reactive<AppSettings>(loadSettings())

  // 计算属性 - WebSocket URL
  const wsBaseUrl = computed(() => {
    return `ws://${settings.websocket.host}:${settings.websocket.port}`
  })

  // API Base URL
  const apiBaseUrl = computed(() => {
    return `http://${settings.api.host}:${settings.api.port}/api`
  })

  // 更新设置
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    Object.assign(settings, newSettings)
    saveSettings(settings)
  }

  // 更新特定配置节
  const updateSection = <K extends keyof AppSettings>(
    section: K,
    data: Partial<AppSettings[K]>,
  ) => {
    Object.assign(settings[section], data)
    saveSettings(settings)
  }

  // 重置为默认设置
  const resetSettings = () => {
    Object.assign(settings, defaultSettings)
    saveSettings(settings)
  }

  // 导出设置
  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2)
  }

  // 导入设置
  const importSettings = (settingsJson: string) => {
    try {
      const imported = JSON.parse(settingsJson)
      // 验证导入的数据结构
      if (typeof imported === 'object' && imported !== null) {
        Object.assign(settings, imported)
        saveSettings(settings)
        return true
      }
      return false
    } catch (error) {
      console.error('导入设置失败:', error)
      return false
    }
  }

  // 获取WebSocket配置
  const getWebSocketConfig = () => {
    return {
      url: '', // 由具体端点决定
      heartbeatInterval: settings.websocket.heartbeatInterval,
      reconnectInterval: settings.websocket.reconnectInterval,
      maxReconnectAttempts: settings.websocket.maxReconnectAttempts,
      autoReconnect: settings.websocket.enableAutoReconnect,
      enableHeartbeat: settings.websocket.enableHeartbeat,
    }
  }

  return {
    // 状态
    settings,

    // 计算属性
    wsBaseUrl,
    apiBaseUrl,

    // 方法
    updateSettings,
    updateSection,
    resetSettings,
    exportSettings,
    importSettings,
    getWebSocketConfig,
  }
})
