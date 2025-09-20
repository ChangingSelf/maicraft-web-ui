#!/usr/bin/env node

/**
 * Maicraft Web UI 备份恢复脚本
 * 用于从备份文件恢复 CHANGELOG.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

// 获取备份目录
function getBackupDir() {
  return path.join(__dirname, '..', 'backups')
}

// 列出所有备份文件
function listBackups() {
  const backupDir = getBackupDir()

  if (!fs.existsSync(backupDir)) {
    log(colors.red, '备份目录不存在')
    return []
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((file) => file.startsWith('CHANGELOG.md.') && file.endsWith('.bak'))
    .map((file) => ({
      name: file,
      path: path.join(backupDir, file),
      timestamp: file.replace('CHANGELOG.md.', '').replace('.bak', ''),
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return files
}

// 显示备份列表
function showBackupList() {
  const backups = listBackups()

  if (backups.length === 0) {
    log(colors.yellow, '没有找到备份文件')
    return
  }

  log(colors.cyan, '📁 可用的备份文件:')
  backups.forEach((backup, index) => {
    const isLatest = backup.name.includes('latest')
    const marker = isLatest ? '🌟' : '📄'
    const label = isLatest ? ' (最新)' : ''
    log(colors.white, `${index + 1}. ${marker} ${backup.name}${label}`)
    log(colors.gray, `   时间: ${backup.timestamp}`)
  })
}

// 从备份恢复
function restoreFromBackup(backupName) {
  const backupDir = getBackupDir()
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')

  let backupPath
  if (backupName === 'latest') {
    backupPath = path.join(backupDir, 'CHANGELOG.md.latest.bak')
  } else {
    backupPath = path.join(backupDir, backupName)
  }

  // 检查备份文件是否存在
  if (!fs.existsSync(backupPath)) {
    log(colors.red, `备份文件不存在: ${backupName}`)
    return false
  }

  try {
    // 读取备份内容
    const backupContent = fs.readFileSync(backupPath, 'utf8')

    // 创建当前文件的备份（以防万一）
    if (fs.existsSync(changelogPath)) {
      const emergencyBackup = `${changelogPath}.emergency.${Date.now()}`
      fs.writeFileSync(emergencyBackup, fs.readFileSync(changelogPath, 'utf8'), 'utf8')
      log(colors.blue, `紧急备份已创建: ${path.basename(emergencyBackup)}`)
    }

    // 恢复文件
    fs.writeFileSync(changelogPath, backupContent, 'utf8')

    log(colors.green, `✅ 成功从备份恢复: ${backupName}`)
    return true
  } catch (error) {
    log(colors.red, `恢复失败: ${error.message}`)
    return false
  }
}

// 显示帮助信息
function showHelp() {
  log(colors.cyan, '🔄 Maicraft Web UI 备份恢复工具')
  log(colors.white, '')
  log(colors.white, '用法:')
  log(colors.white, '  node scripts/restore-backup.js <command> [options]')
  log(colors.white, '')
  log(colors.white, '命令:')
  log(colors.white, '  list              列出所有备份文件')
  log(colors.white, '  latest            从最新备份恢复')
  log(colors.white, '  <文件名>         从指定备份文件恢复')
  log(colors.white, '  help              显示帮助信息')
  log(colors.white, '')
  log(colors.white, '示例:')
  log(colors.white, '  node scripts/restore-backup.js list')
  log(colors.white, '  node scripts/restore-backup.js latest')
  log(colors.white, '  node scripts/restore-backup.js CHANGELOG.md.2025-09-20T00-30-37.bak')
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === 'help') {
    showHelp()
    return
  }

  switch (command) {
    case 'list':
      showBackupList()
      break

    case 'latest':
      log(colors.yellow, '即将从最新备份恢复 CHANGELOG.md...')
      if (restoreFromBackup('latest')) {
        log(colors.green, '恢复完成！')
      }
      break

    default:
      // 检查是否是有效的备份文件名
      const backups = listBackups()
      const backup = backups.find((b) => b.name === command)

      if (backup) {
        log(colors.yellow, `即将从备份恢复 CHANGELOG.md: ${command}`)
        log(colors.yellow, '这将覆盖当前的 CHANGELOG.md 文件')
        if (restoreFromBackup(command)) {
          log(colors.green, '恢复完成！')
        }
      } else {
        log(colors.red, `无效的命令或备份文件名: ${command}`)
        log(colors.white, '使用 "list" 命令查看可用备份')
        showHelp()
      }
      break
  }
}

// 如果直接运行此脚本
if (process.argv[1].includes('restore-backup.js')) {
  main()
}

export { listBackups, restoreFromBackup, showBackupList }
