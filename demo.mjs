#!/usr/bin/env node

/**
 * Maicraft Web UI Demo Script
 *
 * 这个脚本演示如何使用Mock WebSocket服务器和前端应用
 * 用于在没有真实后端的情况下测试日志查看功能
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🎯 Maicraft Web UI Demo')
console.log('==============================')
console.log('')

// 检查Node.js版本
const nodeVersion = process.versions.node
console.log(`📋 Node.js版本: ${nodeVersion}`)

// 检查pnpm是否可用
console.log('🔍 检查pnpm...')

const checkPnpm = spawn('pnpm', ['--version'], { stdio: 'pipe' })

checkPnpm.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ pnpm未安装或不可用')
    console.log('请先安装pnpm: npm install -g pnpm')
    process.exit(1)
  }

  console.log('✅ pnpm可用')
  console.log('')
  startDemo()
})

function startDemo() {
  console.log('🚀 启动演示环境...')
  console.log('')
  console.log('步骤:')
  console.log('1. 启动Mock WebSocket服务器')
  console.log('2. 启动前端开发服务器')
  console.log('3. 打开浏览器访问 http://localhost:5173')
  console.log('4. 点击"连接服务器"按钮开始测试')
  console.log('')

  // 启动Mock服务器
  console.log('📡 启动Mock WebSocket服务器...')
  const mockServer = spawn('pnpm', ['mock-ws'], {
    cwd: __dirname,
    stdio: 'inherit',
    detached: true,
  })

  // 等待服务器启动
  setTimeout(() => {
    console.log('')
    console.log('🌐 启动前端开发服务器...')
    const devServer = spawn('pnpm', ['dev'], {
      cwd: __dirname,
      stdio: 'inherit',
      detached: true,
    })

    // 处理进程退出
    process.on('SIGINT', () => {
      console.log('')
      console.log('🛑 正在关闭演示环境...')

      try {
        process.kill(-mockServer.pid)
        process.kill(-devServer.pid)
      } catch (error) {
        // 忽略错误
      }

      console.log('✅ 演示环境已关闭')
      process.exit(0)
    })

    console.log('')
    console.log('🎉 演示环境启动成功!')
    console.log('')
    console.log('📋 使用说明:')
    console.log('- 前端应用: http://localhost:5173')
    console.log('- WebSocket服务器: ws://localhost:20914/ws/logs')
    console.log('- 按 Ctrl+C 停止演示')
    console.log('')
    console.log('💡 测试功能:')
    console.log('- 点击"连接服务器"建立WebSocket连接')
    console.log('- 观察每2秒推送的模拟日志')
    console.log('- 尝试不同级别的日志筛选')
    console.log('- 测试断开/重连功能')
    console.log('')
  }, 2000)
}
