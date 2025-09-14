import WebSocket from 'ws'

// 创建WebSocket服务器
const wss = new WebSocket.Server({
  port: 8000,
  perMessageDeflate: false,
})

console.log('🚀 Mock WebSocket服务器启动在 ws://localhost:8000')
console.log('📡 日志WebSocket端点: ws://localhost:8000/ws/logs')

// 模拟日志消息数据
const logMessages = [
  {
    type: 'log',
    timestamp: Date.now(),
    level: 'INFO',
    module: 'MCPClient',
    message: 'MCP客户端连接成功',
  },
  {
    type: 'log',
    timestamp: Date.now() + 1000,
    level: 'INFO',
    module: 'MaiAgent',
    message: 'AI代理初始化完成',
  },
  {
    type: 'log',
    timestamp: Date.now() + 2000,
    level: 'WARNING',
    module: 'System',
    message: '检测到内存使用率较高',
  },
  {
    type: 'log',
    timestamp: Date.now() + 3000,
    level: 'ERROR',
    module: 'TaskManager',
    message: '任务执行失败: 找不到指定方块',
  },
  {
    type: 'log',
    timestamp: Date.now() + 4000,
    level: 'SUCCESS',
    module: 'MCPClient',
    message: '成功挖掘钻石矿石',
  },
  {
    type: 'log',
    timestamp: Date.now() + 5000,
    level: 'INFO',
    module: 'EventHandler',
    message: '玩家EvilMai收集了 1 个钻石',
  },
  {
    type: 'log',
    timestamp: Date.now() + 6000,
    level: 'DEBUG',
    module: 'MaiAgent',
    message: '路径规划算法执行中...',
  },
  {
    type: 'log',
    timestamp: Date.now() + 7000,
    level: 'INFO',
    module: 'System',
    message: '系统状态检查完成',
  },
]

// 存储连接的客户端
const clients = new Set()

// 生成随机日志消息
function generateRandomLog() {
  const levels = ['TRACE', 'DEBUG', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']
  const modules = ['MCPClient', 'MaiAgent', 'System', 'TaskManager', 'EventHandler']

  const messages = [
    '正在扫描周围环境...',
    'AI决策算法运行中...',
    '移动到坐标 (100, 64, 200)',
    '收集到 3 个圆石',
    '合成工作台成功',
    '检测到生命值降低',
    '寻路算法计算路径中...',
    '任务进度更新: 45%',
    '背包整理完成',
    '与MCP服务器通信中...',
    '异常情况处理完成',
    '系统资源监控正常',
  ]

  return {
    type: 'log',
    timestamp: Date.now(),
    level: levels[Math.floor(Math.random() * levels.length)],
    module: modules[Math.floor(Math.random() * modules.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  }
}

// 心跳检查
setInterval(() => {
  clients.forEach((client) => {
    if (client.isAlive === false) {
      console.log('💔 客户端无响应，断开连接')
      return client.terminate()
    }

    client.isAlive = false
    client.ping()
  })
}, 30000)

// 定期发送模拟日志
let messageIndex = 0
const logInterval = setInterval(() => {
  if (clients.size > 0) {
    const message =
      messageIndex < logMessages.length ? logMessages[messageIndex] : generateRandomLog()

    message.timestamp = Date.now()

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })

    console.log(`📤 发送日志: [${message.level}] ${message.module}: ${message.message}`)
    messageIndex++
  }
}, 2000) // 每2秒发送一条日志

// 处理WebSocket连接
wss.on('connection', (ws, req) => {
  const url = req.url
  console.log(`🔗 新客户端连接: ${req.socket.remoteAddress}:${req.socket.remotePort}`)
  console.log(`📍 请求路径: ${url}`)

  // 添加到客户端集合
  clients.add(ws)
  ws.isAlive = true

  // 处理客户端消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📨 收到客户端消息:', message)

      switch (message.type) {
        case 'subscribe':
          console.log(
            `📋 客户端订阅 - 级别: ${message.levels?.join(', ') || '全部'}, 模块: ${message.modules?.join(', ') || '全部'}`,
          )
          ws.send(
            JSON.stringify({
              type: 'log',
              timestamp: Date.now(),
              level: 'INFO',
              module: 'System',
              message: `订阅成功! 级别: ${message.levels?.join(', ') || '全部'}, 模块: ${message.modules?.join(', ') || '全部'}`,
            }),
          )
          break

        case 'ping':
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: Date.now(),
            }),
          )
          break

        default:
          console.log('❓ 未知消息类型:', message.type)
      }
    } catch (error) {
      console.error('❌ 解析客户端消息失败:', error.message)
    }
  })

  // 处理心跳响应
  ws.on('pong', () => {
    ws.isAlive = true
  })

  // 处理连接关闭
  ws.on('close', () => {
    console.log('🔌 客户端断开连接')
    clients.delete(ws)
  })

  // 处理错误
  ws.on('error', (error) => {
    console.error('⚠️ WebSocket错误:', error.message)
    clients.delete(ws)
  })

  // 发送欢迎消息
  ws.send(
    JSON.stringify({
      type: 'log',
      timestamp: Date.now(),
      level: 'INFO',
      module: 'System',
      message: '欢迎连接到MaicraftAgent日志服务器!',
    }),
  )

  // 发送服务器信息
  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'log',
        timestamp: Date.now(),
        level: 'INFO',
        module: 'System',
        message: '服务器运行中...正在生成模拟日志数据',
      }),
    )
  }, 1000)
})

// 处理服务器错误
wss.on('error', (error) => {
  console.error('🚨 服务器错误:', error.message)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...')

  // 停止日志发送
  clearInterval(logInterval)

  // 关闭所有客户端连接
  clients.forEach((client) => {
    client.close(1000, '服务器关闭')
  })

  // 关闭服务器
  wss.close(() => {
    console.log('✅ 服务器已关闭')
    process.exit(0)
  })
})

console.log('\n🎯 使用说明:')
console.log('1. 在前端页面点击"连接服务器"按钮')
console.log('2. 观察实时日志推送')
console.log('3. 使用筛选器测试不同级别的日志')
console.log('4. 按 Ctrl+C 停止服务器')
console.log('\n📊 模拟功能:')
console.log('- 每2秒自动推送随机日志')
console.log('- 支持心跳检测(30秒间隔)')
console.log('- 处理订阅消息')
console.log('- 模拟各种日志级别和模块')
console.log('')
