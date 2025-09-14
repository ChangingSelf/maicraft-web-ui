import { WebSocket } from 'ws'

console.log('🔗 测试WebSocket客户端连接...')

const ws = new WebSocket('ws://localhost:20914/ws/logs')

ws.on('open', () => {
  console.log('✅ 连接成功!')

  // 发送订阅消息
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      levels: ['INFO', 'WARNING', 'ERROR'],
      modules: ['MCPClient', 'MaiAgent'],
    }),
  )

  console.log('📤 已发送订阅消息')
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString())
    console.log('📨 收到消息:', message)
  } catch (error) {
    console.log('📨 收到原始消息:', data.toString())
  }
})

ws.on('close', () => {
  console.log('🔌 连接已关闭')
})

ws.on('error', (error) => {
  console.error('❌ 连接错误:', error.message)
})

// 5秒后关闭连接
setTimeout(() => {
  console.log('⏰ 测试完成，关闭连接')
  ws.close()
}, 10000)
