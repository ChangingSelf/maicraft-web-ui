import express from 'express'
import cors from 'cors'
import { spawn, exec } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import iconv from 'iconv-lite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 25106

// 中间件
app.use(cors())
app.use(express.json())

// 全局变量存储agent进程
let agentProcess = null
let agentStatus = 'stopped' // stopped, starting, running, stopping
let agentStartTime = null // 启动时间戳
let agentProcessId = null // 记录我们启动的进程ID

// 检查conda环境是否存在
async function checkCondaEnvironment(envName) {
  return new Promise((resolve) => {
    exec(`conda env list`, (error, stdout, stderr) => {
      if (error) {
        console.error('检查conda环境失败:', error)
        resolve(false)
        return
      }

      const envExists = stdout.includes(envName)
      resolve(envExists)
    })
  })
}

// 生成启动命令
async function generateStartCommand({
  envManager,
  envName,
  venvPath,
  poetryPath,
  pipenvPath,
  pythonPath,
  uvPath,
  isWindows,
}) {
  switch (envManager) {
    case 'conda':
      // 验证conda环境
      const envExists = await checkCondaEnvironment(envName)
      if (!envExists) {
        throw new Error(`Conda环境 '${envName}' 不存在`)
      }
      return `conda activate ${envName} && python main.py`

    case 'venv':
      if (!venvPath) {
        throw new Error('未指定虚拟环境路径')
      }
      const activateScript = isWindows
        ? `${venvPath}\\Scripts\\activate.bat`
        : `${venvPath}/bin/activate`
      return `source ${activateScript} && python main.py`

    case 'poetry':
      if (!poetryPath) {
        throw new Error('未指定Poetry项目路径')
      }
      return `cd ${poetryPath} && poetry run python main.py`

    case 'pipenv':
      if (!pipenvPath) {
        throw new Error('未指定Pipenv项目路径')
      }
      return `cd ${pipenvPath} && pipenv run python main.py`

    case 'uv':
      if (!uvPath) {
        throw new Error('未指定uv项目路径')
      }
      return `cd ${uvPath} && uv run python main.py`

    case 'manual':
      if (!pythonPath) {
        throw new Error('未指定Python可执行文件路径')
      }
      return `${pythonPath} main.py`

    default:
      throw new Error(`不支持的环境管理器: ${envManager}`)
  }
}

// 智能编码处理函数
function decodeOutput(data) {
  // 首先尝试UTF-8
  let text = data.toString('utf8')

  // 检查是否包含乱码特征（中文字符乱码）
  if (text.includes('�')) {
    try {
      // 如果UTF-8失败，尝试GBK（Windows中文环境常见）
      text = iconv.decode(data, 'gbk')
    } catch (error) {
      // 如果都失败，保持UTF-8
      console.warn('编码检测失败，使用UTF-8')
    }
  }

  return text.trim()
}

// 检测系统环境
async function detectSystemEnvs() {
  const result = {
    conda: [],
    python: '',
    poetry: false,
    pipenv: false,
    uv: false,
  }

  // 检测conda环境
  try {
    const condaResult = await new Promise((resolve) => {
      exec('conda env list', (error, stdout) => {
        if (!error) {
          const lines = stdout.split('\n').filter((line) => line.trim() && !line.startsWith('#'))
          const envs = lines
            .map((line) => {
              const parts = line.trim().split(/\s+/)
              return parts[0]
            })
            .filter((env) => env && env !== 'base')
          resolve(envs)
        } else {
          resolve([])
        }
      })
    })
    result.conda = condaResult
  } catch (error) {
    console.error('检测conda环境失败:', error)
  }

  // 检测Python
  try {
    const pythonResult = await new Promise((resolve) => {
      exec('python --version', (error, stdout) => {
        if (!error) {
          resolve(stdout.trim())
        } else {
          resolve('')
        }
      })
    })
    result.python = pythonResult
  } catch (error) {
    console.error('检测Python失败:', error)
  }

  // 检测Poetry
  try {
    const poetryResult = await new Promise((resolve) => {
      exec('poetry --version', (error) => {
        resolve(!error)
      })
    })
    result.poetry = poetryResult
  } catch (error) {
    console.error('检测Poetry失败:', error)
  }

  // 检测Pipenv
  try {
    const pipenvResult = await new Promise((resolve) => {
      exec('pipenv --version', (error) => {
        resolve(!error)
      })
    })
    result.pipenv = pipenvResult
  } catch (error) {
    console.error('检测Pipenv失败:', error)
  }

  // 检测uv
  try {
    const uvResult = await new Promise((resolve) => {
      exec('uv --version', (error) => {
        resolve(!error)
      })
    })
    result.uv = uvResult
  } catch (error) {
    console.error('检测uv失败:', error)
  }

  return result
}

// 启动agent
app.post('/api/agent/start', async (req, res) => {
  try {
    if (agentStatus === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Agent已经在运行中',
      })
    }

    if (agentStatus === 'starting') {
      return res.status(400).json({
        success: false,
        message: 'Agent正在启动中，请稍候',
      })
    }

    const {
      envManager = 'conda',
      envName = 'maicraft',
      venvPath,
      poetryPath,
      pipenvPath,
      pythonPath,
      uvPath,
      workDir,
    } = req.body

    // 验证工作目录（必填）
    if (!workDir || workDir.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '工作目录不能为空',
      })
    }

    agentStatus = 'starting'

    console.log(`启动Maicraft Agent...`)
    console.log(`环境管理器: ${envManager}`)
    console.log(`工作目录: ${workDir}`)

    // 根据环境管理器生成启动命令
    const isWindows = process.platform === 'win32'
    let command, args

    try {
      const startCommand = await generateStartCommand({
        envManager,
        envName,
        venvPath,
        poetryPath,
        pipenvPath,
        pythonPath,
        uvPath,
        isWindows,
      })

      if (isWindows) {
        command = 'cmd'
        args = ['/c', startCommand]
      } else {
        command = 'bash'
        args = ['-c', startCommand]
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    // 设置工作目录（必填）
    const cwd = path.resolve(workDir)

    // 启动进程
    agentProcess = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      detached: false,
    })

    // 记录启动时间和进程ID
    agentStartTime = Date.now()
    agentProcessId = agentProcess.pid

    // 设置进程监听
    agentProcess.stdout.on('data', (data) => {
      const output = decodeOutput(data)
      console.log(`Agent输出: ${output}`)
    })

    agentProcess.stderr.on('data', (data) => {
      const output = decodeOutput(data)
      console.error(`Agent错误: ${output}`)
    })

    agentProcess.on('close', (code) => {
      console.log(`Agent进程退出，退出码: ${code}`)
      agentStatus = 'stopped'
      agentProcess = null
      agentStartTime = null
      agentProcessId = null
    })

    agentProcess.on('error', (error) => {
      console.error('Agent启动失败:', error)
      agentStatus = 'stopped'
      agentProcess = null
      agentStartTime = null
      agentProcessId = null
    })

    // 等待一段时间检查进程是否成功启动
    setTimeout(() => {
      if (agentProcess && !agentProcess.killed) {
        agentStatus = 'running'
        res.json({
          success: true,
          message: 'Agent启动成功',
          status: 'running',
        })
      } else {
        agentStatus = 'stopped'
        res.status(500).json({
          success: false,
          message: 'Agent启动失败，请检查日志',
        })
      }
    }, 3000)
  } catch (error) {
    console.error('启动Agent失败:', error)
    agentStatus = 'stopped'
    res.status(500).json({
      success: false,
      message: '启动失败: ' + error.message,
    })
  }
})

// 停止agent
app.post('/api/agent/stop', (req, res) => {
  try {
    if (!agentProcess || agentStatus !== 'running') {
      return res.status(400).json({
        success: false,
        message: 'Agent未在运行',
      })
    }

    agentStatus = 'stopping'
    console.log('正在停止Agent...')

    // 优雅停止进程
    if (process.platform === 'win32') {
      // Windows下使用taskkill
      exec(`taskkill /pid ${agentProcess.pid} /t /f`, (error) => {
        if (error) {
          console.error('停止Agent失败:', error)
          agentStatus = 'running' // 恢复状态
          return res.status(500).json({
            success: false,
            message: '停止失败: ' + error.message,
          })
        }

        agentStatus = 'stopped'
        agentProcess = null
        res.json({
          success: true,
          message: 'Agent已停止',
        })
      })
    } else {
      // Unix-like系统
      process.kill(-agentProcess.pid, 'SIGTERM')

      setTimeout(() => {
        if (agentProcess && !agentProcess.killed) {
          agentProcess.kill('SIGKILL')
        }
        agentStatus = 'stopped'
        agentProcess = null
        res.json({
          success: true,
          message: 'Agent已停止',
        })
      }, 5000)
    }
  } catch (error) {
    console.error('停止Agent失败:', error)
    agentStatus = 'running' // 恢复状态
    res.status(500).json({
      success: false,
      message: '停止失败: ' + error.message,
    })
  }
})

// 获取agent状态
app.get('/api/agent/status', (req, res) => {
  res.json({
    status: agentStatus,
    pid: agentProcess ? agentProcess.pid : null,
    uptime: agentStartTime ? Date.now() - agentStartTime : 0,
  })
})

// 获取conda环境列表
app.get('/api/conda/envs', (req, res) => {
  exec('conda env list', (error, stdout, stderr) => {
    if (error) {
      console.error('获取conda环境失败:', error)
      return res.status(500).json({
        success: false,
        message: '获取conda环境失败: ' + error.message,
      })
    }

    // 解析环境列表
    const lines = stdout.split('\n').filter((line) => line.trim() && !line.startsWith('#'))
    const envs = lines
      .map((line) => {
        const parts = line.trim().split(/\s+/)
        return {
          name: parts[0],
          path: parts.length > 1 ? parts.slice(1).join(' ') : '',
        }
      })
      .filter((env) => env.name && env.name !== 'base')

    res.json({
      success: true,
      environments: envs,
    })
  })
})

// 获取系统环境信息
app.get('/api/system/envs', async (req, res) => {
  try {
    const envInfo = await detectSystemEnvs()
    res.json({
      success: true,
      environments: envInfo,
    })
  } catch (error) {
    console.error('获取系统环境信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取系统环境信息失败: ' + error.message,
    })
  }
})

// 清理僵尸进程
app.post('/api/agent/cleanup', (req, res) => {
  try {
    console.log('正在清理僵尸进程...')
    let cleanupCount = 0

    // 1. 优先清理当前管理的进程
    if (agentProcess && !agentProcess.killed) {
      console.log(`终止当前管理的进程: ${agentProcess.pid}`)
      agentProcess.kill('SIGKILL')
      agentProcess = null
      agentStatus = 'stopped'
      agentStartTime = null
      agentProcessId = null
    }

    // 2. 清理已记录的进程ID（如果进程仍然存在）
    if (agentProcessId) {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${agentProcessId} /f /t 2>nul`, (error) => {
          if (!error) {
            console.log(`已清理记录的进程: ${agentProcessId}`)
            cleanupCount++
          }
        })
      } else {
        exec(`kill -9 ${agentProcessId} 2>/dev/null`, (error) => {
          if (!error) {
            console.log(`已清理记录的进程: ${agentProcessId}`)
            cleanupCount++
          }
        })
      }
    }

    // 延迟返回结果，给清理操作一些时间
    setTimeout(() => {
      const message =
        cleanupCount > 0
          ? `清理完成，共清理 ${cleanupCount} 个进程`
          : '清理完成，未发现需要清理的进程'

      res.json({
        success: true,
        message,
        cleanupCount,
      })
    }, 2000)
  } catch (error) {
    console.error('清理僵尸进程失败:', error)
    res.status(500).json({
      success: false,
      message: '清理失败: ' + error.message,
    })
  }
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    agent: {
      status: agentStatus,
      pid: agentProcess ? agentProcess.pid : null,
    },
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Proxy Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...')

  if (agentProcess) {
    console.log('正在停止Agent进程...')
    agentProcess.kill()
  }

  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务器...')

  if (agentProcess) {
    console.log('正在停止Agent进程...')
    agentProcess.kill()
  }

  process.exit(0)
})
