#!/usr/bin/env node

/**
 * Maicraft Web UI 版本管理脚本
 * 用于自动化版本更新和管理
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
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

// 获取当前日期
function getCurrentDate() {
  return new Date().toISOString().split('T')[0]
}

// 获取当前时间
function getCurrentTime() {
  return new Date().toTimeString().split(' ')[0]
}

// 读取版本配置文件
function readVersionConfig() {
  const configPath = path.join(__dirname, '..', 'src', 'config', 'version.json')
  try {
    const configContent = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(configContent)
  } catch (error) {
    log(colors.red, `读取版本配置文件失败: ${error.message}`)
    process.exit(1)
  }
}

// 写入版本配置文件
function writeVersionConfig(config) {
  const configPath = path.join(__dirname, '..', 'src', 'config', 'version.json')
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
    log(colors.green, '版本配置文件已更新')
  } catch (error) {
    log(colors.red, `写入版本配置文件失败: ${error.message}`)
    process.exit(1)
  }
}

// 读取 package.json
function readPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json')
  try {
    const packageContent = fs.readFileSync(packagePath, 'utf8')
    return JSON.parse(packageContent)
  } catch (error) {
    log(colors.red, `读取 package.json 失败: ${error.message}`)
    process.exit(1)
  }
}

// 写入 package.json
function writePackageJson(packageData) {
  const packagePath = path.join(__dirname, '..', 'package.json')
  try {
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8')
    log(colors.green, 'package.json 已更新')
  } catch (error) {
    log(colors.red, `写入 package.json 失败: ${error.message}`)
    process.exit(1)
  }
}

// 增加版本号
function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      return version
  }
}

// 交互式收集变更信息
async function collectChangesInteractively() {
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    const changes = {}
    const summaries = []

    function askForChange() {
      console.log('\n📝 添加变更信息')
      console.log('支持的类型: feat, fix, docs, style, refactor, perf, test, chore, ci, build')
      console.log('输入格式: <type> <message> 例如: fix 修复登录问题')
      console.log('输入 "done" 完成添加, "cancel" 取消')

      rl.question('> ', (input) => {
        const trimmed = input.trim()

        if (trimmed === 'done') {
          rl.close()
          resolve({ changes, summaries })
          return
        }

        if (trimmed === 'cancel') {
          rl.close()
          resolve({ changes: {}, summaries: [] })
          return
        }

        const match = trimmed.match(/^(\w+)\s+(.+)$/)
        if (!match) {
          log(colors.yellow, '❌ 格式错误，请使用: <type> <message>')
          askForChange()
          return
        }

        const [_, changeType, changeMessage] = match

        // 验证类型
        const validTypes = [
          'feat',
          'fix',
          'docs',
          'style',
          'refactor',
          'perf',
          'test',
          'chore',
          'ci',
          'build',
        ]
        if (!validTypes.includes(changeType)) {
          log(colors.yellow, `❌ 无效的类型: ${changeType}`)
          log(colors.yellow, `支持的类型: ${validTypes.join(', ')}`)
          askForChange()
          return
        }

        // 添加到changes对象
        if (!changes[changeType]) {
          changes[changeType] = []
        }
        changes[changeType].push(changeMessage)

        // 添加到summaries
        const typeTitle = getCommitTypeTitle(changeType).split(' / ')[0]
        summaries.push(`${typeTitle} - ${changeMessage}`)

        log(colors.green, `✅ 已添加: ${changeType} - ${changeMessage}`)

        askForChange()
      })
    }

    askForChange()
  })
}

// 更新版本的主要函数
async function updateVersion(type = 'patch', options = {}) {
  const { messages = [], skipChangelog = false, skipGit = false, commitTypes = [] } = options

  log(colors.cyan, `开始 ${type} 版本更新...`)

  // 读取当前配置
  const config = readVersionConfig()
  const packageData = readPackageJson()

  // 获取当前版本
  const currentVersion = packageData.version
  const newVersion = incrementVersion(currentVersion, type)

  log(colors.yellow, `版本更新: ${currentVersion} -> ${newVersion}`)

  // 更新 package.json
  packageData.version = newVersion
  writePackageJson(packageData)

  // 更新版本配置
  config.current = newVersion
  config.buildDate = getCurrentDate()
  config.buildTime = getCurrentTime()
  config.changelog.lastUpdated = getCurrentDate()

  // 添加新版本到版本历史
  let newVersionEntry

  // 收集变更信息
  let changes = {}
  let summaries = []

  // 处理命令行提供的变更
  if (messages.length > 0) {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      const commitType = commitTypes[i] || 'chore' // 默认类型

      if (!changes[commitType]) {
        changes[commitType] = []
      }
      changes[commitType].push(message)
      summaries.push(`${getCommitTypeTitle(commitType).split(' / ')[0]} - ${message}`)
    }
  } else {
    // 没有提供变更信息，进入交互模式
    log(colors.blue, '\n🔄 没有检测到变更信息，进入交互模式...')
    const result = await collectChangesInteractively()
    changes = result.changes
    summaries = result.summaries

    if (Object.keys(changes).length === 0) {
      log(colors.yellow, '⚠️  没有添加任何变更，使用默认消息')
      newVersionEntry = {
        version: newVersion,
        date: getCurrentDate(),
        type: type,
        changelog: [`版本 ${newVersion} 发布`],
      }
    }
  }

  // 如果有收集到changes，创建结构化版本条目
  if (Object.keys(changes).length > 0 && !newVersionEntry) {
    newVersionEntry = {
      version: newVersion,
      date: getCurrentDate(),
      type: type,
      changes: changes,
      summary: summaries.join('; '),
    }
  }

  config.changelog.versions.unshift(newVersionEntry)
  config.changelog.totalVersions = config.changelog.versions.length

  writeVersionConfig(config)

  // 更新 CHANGELOG.md（如果没有跳过）
  if (!skipChangelog) {
    updateChangelog(newVersionEntry)
  }

  // Git 操作（如果没有跳过）
  if (!skipGit) {
    try {
      const commitMessage = `chore: release v${newVersion}`
      execSync(`git add .`, { stdio: 'inherit' })
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
      execSync(`git tag v${newVersion}`, { stdio: 'inherit' })
      log(colors.green, `Git 标签 v${newVersion} 已创建`)
    } catch (error) {
      log(colors.yellow, `Git 操作失败: ${error.message}`)
    }
  }

  log(colors.green, `✅ 版本 ${newVersion} 更新完成！`)
}

// 更新 CHANGELOG.md 文件
function updateChangelog(versionEntry) {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')

  try {
    // 检查 CHANGELOG.md 文件是否存在
    if (!fs.existsSync(changelogPath)) {
      log(colors.yellow, 'CHANGELOG.md 文件不存在，跳过更新')
      log(colors.yellow, '提示：如果需要生成 CHANGELOG.md，可以手动创建或从备份恢复')
      return
    }

    // 读取现有内容
    let changelogContent = fs.readFileSync(changelogPath, 'utf8')

    // 创建备份目录（如果不存在）
    const backupDir = path.join(__dirname, '..', 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // 创建带时间戳的备份文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupPath = path.join(backupDir, `CHANGELOG.md.${timestamp}.bak`)
    fs.writeFileSync(backupPath, changelogContent, 'utf8')
    log(colors.blue, `CHANGELOG.md 备份已创建: ${path.relative(process.cwd(), backupPath)}`)

    // 同时创建最新备份的快捷方式
    const latestBackupPath = path.join(backupDir, 'CHANGELOG.md.latest.bak')
    fs.writeFileSync(latestBackupPath, changelogContent, 'utf8')

    // 检查是否已有此版本
    const versionPattern = new RegExp(`## \\[${versionEntry.version}\\]`, 'm')
    if (versionPattern.test(changelogContent)) {
      log(colors.yellow, `版本 ${versionEntry.version} 已存在于 CHANGELOG.md 中，跳过更新`)
      return
    }

    // 查找插入位置（在第一个版本标题之后）
    // 支持多种格式：## [v1.1.0] 或 ## [1.1.0]
    const insertPattern = /## \[(v?\d+\.\d+\.\d+)\]/m
    const match = changelogContent.match(insertPattern)

    if (match) {
      const insertPoint = match.index + match[0].length
      // 生成新的版本条目
      let newEntry = `

## [${versionEntry.version}] - ${versionEntry.date}
`

      // 如果有changes结构，转换为Markdown格式
      if (versionEntry.changes) {
        Object.entries(versionEntry.changes).forEach(([type, items]) => {
          if (items.length > 0) {
            const typeTitle = getCommitTypeTitle(type)
            newEntry += `
### ${typeTitle}
`
            items.forEach((item) => {
              newEntry += `- ${item}\n`
            })
          }
        })
      } else if (versionEntry.changelog && versionEntry.changelog.length > 0) {
        // 向后兼容旧格式
        newEntry += `
${versionEntry.changelog.map((item) => `- ${item}`).join('\n')}
`
      }

      newEntry += `\n`

      changelogContent =
        changelogContent.slice(0, insertPoint) + newEntry + changelogContent.slice(insertPoint)

      fs.writeFileSync(changelogPath, changelogContent, 'utf8')

      // 同时更新 public 目录下的 CHANGELOG.md
      const publicChangelogPath = path.join(__dirname, '..', 'public', 'CHANGELOG.md')
      fs.writeFileSync(publicChangelogPath, changelogContent, 'utf8')

      log(colors.green, 'CHANGELOG.md 已更新')
      log(colors.green, 'public/CHANGELOG.md 已同步更新')
      log(colors.blue, `新版本 ${versionEntry.version} 已添加到 CHANGELOG.md`)
    } else {
      log(colors.yellow, '未找到合适的插入位置，跳过 CHANGELOG.md 更新')
      log(colors.yellow, '提示：确保 CHANGELOG.md 包含格式如 "## [1.1.0] - 2025-01-19" 的版本标题')
      log(colors.yellow, '或者可以手动添加新版本信息到 CHANGELOG.md')
    }
  } catch (error) {
    log(colors.red, `更新 CHANGELOG.md 失败: ${error.message}`)
    log(colors.yellow, '原有文件未被修改，可以安全重试')
  }
}

// 显示当前版本信息
function showVersionInfo() {
  try {
    const config = readVersionConfig()
    const packageData = readPackageJson()

    console.log(`${colors.cyan}📦 当前版本信息:${colors.reset}`)
    console.log(`${colors.white}版本号: v${packageData.version}${colors.reset}`)
    console.log(`${colors.white}项目名称: ${config.name}${colors.reset}`)
    console.log(`${colors.white}构建日期: ${config.buildDate}${colors.reset}`)
    console.log(`${colors.white}最后更新: ${config.changelog.lastUpdated}${colors.reset}`)
    console.log(`${colors.white}总版本数: ${config.changelog.totalVersions}${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}获取版本信息失败: ${error.message}${colors.reset}`)
  }
}

// 显示帮助信息
function showHelp() {
  log(colors.cyan, '🚀 Maicraft Web UI 版本管理工具')
  log(colors.white, '')
  log(colors.white, '用法:')
  log(colors.white, '  node scripts/version-manager.js <command> [options]')
  log(colors.white, '')
  log(colors.white, '命令:')
  log(colors.white, '  patch          发布补丁版本 (1.0.0 -> 1.0.1)')
  log(colors.white, '  minor          发布次版本 (1.0.0 -> 1.1.0)')
  log(colors.white, '  major          发布主版本 (1.0.0 -> 2.0.0)')
  log(colors.white, '  info           显示当前版本信息')
  log(colors.white, '  help           显示帮助信息')
  log(colors.white, '')
  log(colors.white, '选项:')
  log(colors.white, '  --message, -m  指定更新说明 (可多次使用)')
  log(
    colors.white,
    '  --type, -t     指定更新类型 (feat, fix, docs, style, refactor, perf, test, chore, ci, build，可多次使用)',
  )
  log(colors.white, '  --skip-changelog  跳过 CHANGELOG.md 更新')
  log(colors.white, '  --skip-git       跳过 Git 操作')
  log(colors.white, '')
  log(colors.white, '更新类型:')
  log(colors.white, '  feat     ✨ 新功能 / New Features')
  log(colors.white, '  fix      🐛 修复 / Bug Fixes')
  log(colors.white, '  docs     📚 文档 / Documentation')
  log(colors.white, '  style    🎨 样式 / Style')
  log(colors.white, '  refactor 🔧 重构 / Refactoring')
  log(colors.white, '  perf     ⚡ 性能 / Performance')
  log(colors.white, '  test     🧪 测试 / Tests')
  log(colors.white, '  chore    🔨 构建 / Build')
  log(colors.white, '  ci       🔄 CI / CI')
  log(colors.white, '  build    🏗️ 构建 / Build')
  log(colors.white, '')
  log(colors.white, '示例:')
  log(colors.white, '  node scripts/version-manager.js patch -m "修复登录问题"')
  log(
    colors.white,
    '  node scripts/version-manager.js patch -t fix -m "修复登录问题" -t feat -m "添加用户注册"',
  )
  log(
    colors.white,
    '  node scripts/version-manager.js patch -t fix -m "修复问题1" -t fix -m "修复问题2"',
  )
  log(colors.white, '  node scripts/version-manager.js patch  # 进入交互模式，可添加多个变更')
  log(colors.white, '  node scripts/version-manager.js minor --skip-git')
}

// 主函数
function main() {
  console.log('版本管理脚本启动...')
  const args = process.argv.slice(2)
  const command = args[0]

  console.log('命令:', command)
  console.log('参数:', args)

  if (!command) {
    showHelp()
    process.exit(0)
  }

  // 解析选项
  const options = {
    messages: [],
    commitTypes: [],
    skipChangelog: false,
    skipGit: false,
  }
  const optionArgs = args.slice(1)

  for (let i = 0; i < optionArgs.length; i++) {
    const arg = optionArgs[i]
    if (arg === '--message' || arg === '-m') {
      if (i + 1 < optionArgs.length) {
        options.messages.push(optionArgs[i + 1])
        i++
      }
    } else if (arg === '--type' || arg === '-t') {
      if (i + 1 < optionArgs.length) {
        options.commitTypes.push(optionArgs[i + 1])
        i++
      }
    } else if (arg === '--skip-changelog') {
      options.skipChangelog = true
    } else if (arg === '--skip-git') {
      options.skipGit = true
    } else {
      log(colors.yellow, `警告: 未知参数 '${arg}' 将被忽略`)
    }
  }

  switch (command) {
    case 'patch':
    case 'minor':
    case 'major':
      updateVersion(command, options).catch((error) => {
        log(colors.red, `版本更新失败: ${error.message}`)
        process.exit(1)
      })
      break
    case 'info':
      showVersionInfo()
      break
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
    default:
      log(colors.red, `未知命令: ${command}`)
      showHelp()
      process.exit(1)
  }
}

// 如果直接运行此脚本
if (process.argv[1].includes('version-manager.js')) {
  main()
}

// 获取提交类型的标题
function getCommitTypeTitle(type) {
  const typeTitles = {
    feat: '✨ 新功能 / New Features',
    fix: '🐛 修复 / Bug Fixes',
    docs: '📚 文档 / Documentation',
    style: '🎨 样式 / Style',
    refactor: '🔧 重构 / Refactoring',
    perf: '⚡ 性能 / Performance',
    test: '🧪 测试 / Tests',
    chore: '🔨 构建 / Build',
    ci: '🔄 CI / CI',
    build: '🏗️ 构建 / Build',
  }
  return typeTitles[type] || `${type} / ${type.toUpperCase()}`
}

export { updateVersion, showVersionInfo, incrementVersion, getCommitTypeTitle }
