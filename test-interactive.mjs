#!/usr/bin/env node

import { spawn } from 'child_process'

console.log('🧪 测试交互式版本更新...')

const child = spawn(
  'node',
  ['scripts/version-manager.js', 'patch', '--skip-git', '--skip-changelog'],
  {
    stdio: ['pipe', 'pipe', 'pipe'],
  },
)

// 模拟用户输入
const inputs = ['fix 修复登录问题', 'feat 添加用户注册功能', 'docs 更新API文档', 'done']

let inputIndex = 0
let output = ''

child.stdout.on('data', (data) => {
  const text = data.toString()
  output += text
  console.log('输出:', text.trim())

  // 当看到输入提示时，发送下一个输入
  if (text.includes('>') && inputIndex < inputs.length) {
    setTimeout(() => {
      child.stdin.write(inputs[inputIndex] + '\n')
      inputIndex++
    }, 100)
  }
})

child.stderr.on('data', (data) => {
  console.error('错误:', data.toString())
})

child.on('close', (code) => {
  console.log(`\n测试完成，退出码: ${code}`)
  if (code === 0) {
    console.log('✅ 交互式功能测试成功！')
  } else {
    console.log('❌ 交互式功能测试失败')
  }
})
