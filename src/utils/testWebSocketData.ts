// 测试WebSocket数据存储的工具函数
import { updatePlayerData, updateWorldData, addLogEntry } from '../stores/websocketData'

// 模拟玩家数据更新
export const simulatePlayerData = () => {
  updatePlayerData({
    name: 'TestPlayer',
    health: 18,
    max_health: 20,
    food: 15,
    max_food: 20,
    level: 10,
    experience: 250,
    gamemode: 'survival',
    position: {
      x: 100.5,
      y: 64.0,
      z: 200.3,
      yaw: 45.0,
      pitch: 0.0,
      on_ground: true,
    },
  })
  console.log('模拟玩家数据已更新')
}

// 模拟世界数据更新
export const simulateWorldData = () => {
  updateWorldData({
    time: {
      time_of_day: 6000,
      formatted_time: '正午',
      day_count: 5,
    },
    weather: {
      weather: 'clear',
      formatted_weather: '晴朗',
      duration: 1000,
    },
    location: {
      dimension: 'overworld',
      biome: 'plains',
      light_level: 15,
    },
  })
  console.log('模拟世界数据已更新')
}

// 模拟日志条目
export const simulateLogEntry = () => {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    module: 'TestModule',
    message: `测试日志消息 - ${new Date().toLocaleTimeString()}`,
  })
  console.log('模拟日志条目已添加')
}

// 运行所有模拟测试
export const runAllSimulations = () => {
  simulatePlayerData()
  simulateWorldData()
  simulateLogEntry()

  console.log('所有模拟数据已生成，请查看监控页面验证数据显示')
}

// 在开发模式下将函数暴露到全局
if (import.meta.env.DEV) {
  ;(window as any).testWebSocketData = {
    simulatePlayerData,
    simulateWorldData,
    simulateLogEntry,
    runAllSimulations,
  }
  console.log('测试函数已暴露到 window.testWebSocketData')
}
