<template>
  <div class="agent-manager-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>Agent 管理</h2>
      <div class="header-description">启动和管理 Maicraft Agent 进程</div>
    </div>

    <!-- 主要内容 -->
    <div class="agent-content">
      <el-row :gutter="20">
        <!-- Agent状态面板 -->
        <el-col :span="24">
          <el-card class="status-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>Agent 状态</span>
                <el-tag :type="agentStatusTagType" size="small">
                  {{ agentStatusText }}
                </el-tag>
              </div>
            </template>

            <div class="agent-status">
              <el-row :gutter="20">
                <el-col :span="6">
                  <div class="status-item">
                    <span class="label">运行状态:</span>
                    <span class="value">{{ agentStatusText }}</span>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="status-item">
                    <span class="label">进程ID:</span>
                    <span class="value">{{ agentPid || '无' }}</span>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="status-item">
                    <span class="label">运行时间:</span>
                    <span class="value">{{ formatUptime(agentUptime) }}</span>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="status-item">
                    <span class="label">环境类型:</span>
                    <span class="value">{{ envManagerType }}</span>
                  </div>
                </el-col>
              </el-row>

              <el-divider />

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-button
                    type="success"
                    :icon="VideoPlay"
                    :loading="agentActionLoading"
                    :disabled="agentStatus === 'running' || agentStatus === 'starting'"
                    @click="startAgent"
                    style="width: 100%"
                  >
                    启动 Agent
                  </el-button>
                </el-col>
                <el-col :span="8">
                  <el-button
                    type="danger"
                    :icon="VideoPause"
                    :loading="agentActionLoading"
                    :disabled="agentStatus !== 'running'"
                    @click="stopAgent"
                    style="width: 100%"
                  >
                    停止 Agent
                  </el-button>
                </el-col>
                <el-col :span="8">
                  <el-button
                    type="warning"
                    :icon="Refresh"
                    :loading="cleanupLoading"
                    @click="cleanupProcesses"
                    style="width: 100%"
                  >
                    清理进程
                  </el-button>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <!-- Agent配置 -->
        <el-col :span="12">
          <el-card class="config-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>Agent 配置</span>
              </div>
            </template>

            <div class="config-form">
              <el-form-item label="环境管理器:">
                <el-select
                  v-model="agentConfig.envManager"
                  placeholder="选择环境管理器"
                  style="width: 100%"
                  @change="onEnvManagerChange"
                >
                  <el-option label="Conda" value="conda" />
                  <el-option label="Virtualenv" value="venv" />
                  <el-option label="Poetry" value="poetry" />
                  <el-option label="Pipenv" value="pipenv" />
                  <el-option label="uv" value="uv" />
                  <el-option label="手动配置" value="manual" />
                </el-select>
              </el-form-item>

              <el-form-item v-if="agentConfig.envManager === 'conda'" label="Conda环境:">
                <el-select
                  v-model="agentConfig.envName"
                  placeholder="选择conda环境"
                  style="width: 100%"
                  :loading="condaLoading"
                  @visible-change="loadCondaEnvs"
                >
                  <el-option
                    v-for="env in condaEnvs"
                    :key="env.name"
                    :label="env.name"
                    :value="env.name"
                  />
                </el-select>
              </el-form-item>

              <el-form-item v-else-if="agentConfig.envManager === 'venv'" label="虚拟环境路径:">
                <el-input
                  v-model="agentConfig.venvPath"
                  placeholder="venv目录路径"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item v-else-if="agentConfig.envManager === 'poetry'" label="Poetry项目路径:">
                <el-input
                  v-model="agentConfig.poetryPath"
                  placeholder="包含pyproject.toml的目录"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item v-else-if="agentConfig.envManager === 'pipenv'" label="Pipenv项目路径:">
                <el-input
                  v-model="agentConfig.pipenvPath"
                  placeholder="包含Pipfile的目录"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item v-else-if="agentConfig.envManager === 'uv'" label="uv项目路径:">
                <el-input
                  v-model="agentConfig.uvPath"
                  placeholder="包含pyproject.toml的目录"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item v-else-if="agentConfig.envManager === 'manual'" label="Python路径:">
                <el-input
                  v-model="agentConfig.pythonPath"
                  placeholder="Python可执行文件路径"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item label="工作目录:" required>
                <el-input
                  v-model="agentConfig.workDir"
                  placeholder="请输入Agent项目路径"
                  style="width: 100%"
                />
                <div class="form-tip">必须指定包含main.py的Agent项目目录</div>
              </el-form-item>
            </div>
          </el-card>
        </el-col>

        <!-- 环境信息 -->
        <el-col :span="12">
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>环境信息</span>
              </div>
            </template>

            <div class="env-info">
              <el-alert
                title="当前配置"
                :description="getCurrentConfigDescription()"
                type="info"
                :closable="false"
                style="margin-bottom: 15px"
              />

              <el-alert
                title="使用说明"
                :description="getUsageInstructions()"
                type="warning"
                :closable="false"
              />

              <div class="env-details" style="margin-top: 15px">
                <h4>检测到的环境:</h4>
                <div class="env-list">
                  <div v-if="detectedEnvs.conda && detectedEnvs.conda.length > 0" class="env-item">
                    <el-tag type="success" size="small">Conda</el-tag>
                    <span>可用环境: {{ detectedEnvs.conda.length }}</span>
                  </div>
                  <div v-if="detectedEnvs.python" class="env-item">
                    <el-tag type="info" size="small">Python</el-tag>
                    <span>{{ detectedEnvs.python }}</span>
                  </div>
                  <div v-if="detectedEnvs.poetry" class="env-item">
                    <el-tag type="primary" size="small">Poetry</el-tag>
                    <span>已安装</span>
                  </div>
                  <div v-if="detectedEnvs.pipenv" class="env-item">
                    <el-tag type="primary" size="small">Pipenv</el-tag>
                    <span>已安装</span>
                  </div>
                  <div v-if="detectedEnvs.uv" class="env-item">
                    <el-tag type="success" size="small">uv</el-tag>
                    <span>已安装</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { VideoPlay, VideoPause, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'AgentManager',
})

// Agent相关状态
const agentStatus = ref('stopped') // stopped, starting, running, stopping
const agentPid = ref<number | null>(null)
const agentUptime = ref(0)
const agentActionLoading = ref(false)
const cleanupLoading = ref(false)

// 环境管理器类型
const envManagerType = ref('未知')

// Conda环境相关
const condaEnvs = ref<Array<{ name: string; path: string }>>([])
const condaLoading = ref(false)

// 检测到的环境
const detectedEnvs = reactive({
  conda: [] as string[],
  python: '',
  poetry: false,
  pipenv: false,
  uv: false,
})

// Agent配置
const agentConfig = reactive({
  envManager: 'conda', // conda, venv, poetry, pipenv, uv, manual
  envName: 'maicraft', // conda环境名
  venvPath: '', // venv路径
  poetryPath: '', // poetry项目路径
  pipenvPath: '', // pipenv项目路径
  uvPath: '', // uv项目路径
  pythonPath: '', // 手动Python路径
  workDir: '', // 工作目录
})

// 计算属性
const agentStatusText = computed(() => {
  switch (agentStatus.value) {
    case 'stopped':
      return '已停止'
    case 'starting':
      return '启动中'
    case 'running':
      return '运行中'
    case 'stopping':
      return '停止中'
    default:
      return '未知'
  }
})

const agentStatusTagType = computed(() => {
  switch (agentStatus.value) {
    case 'stopped':
      return 'danger'
    case 'starting':
      return 'warning'
    case 'running':
      return 'success'
    case 'stopping':
      return 'warning'
    default:
      return 'info'
  }
})

// 从localStorage加载配置
const loadAgentConfig = () => {
  try {
    const saved = localStorage.getItem('agent-config')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(agentConfig, parsed)
    }
  } catch (error) {
    console.error('加载Agent配置失败:', error)
  }
}

// 保存配置到localStorage
const saveAgentConfig = () => {
  try {
    localStorage.setItem('agent-config', JSON.stringify(agentConfig))
  } catch (error) {
    console.error('保存Agent配置失败:', error)
  }
}

// 监听配置变化并保存
watch(
  () => agentConfig,
  () => {
    saveAgentConfig()
  },
  { deep: true },
)

// 获取Agent状态
const getAgentStatus = async () => {
  try {
    const response = await fetch('http://localhost:25106/api/agent/status')
    const data = await response.json()
    agentStatus.value = data.status
    agentPid.value = data.pid
    agentUptime.value = data.uptime
  } catch (error) {
    console.error('获取Agent状态失败:', error)
  }
}

// 格式化运行时间
const formatUptime = (milliseconds: number) => {
  if (!milliseconds || milliseconds < 0) return '0秒'

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
}

// 检测系统环境
const detectSystemEnvs = async () => {
  try {
    const response = await fetch('http://localhost:25106/api/system/envs')
    const data = await response.json()
    if (data.success) {
      Object.assign(detectedEnvs, data.environments)
    }
  } catch (error) {
    console.error('检测系统环境失败:', error)
  }
}

// 加载Conda环境列表
const loadCondaEnvs = async (visible: boolean) => {
  if (!visible || condaEnvs.value.length > 0) return

  try {
    condaLoading.value = true
    const response = await fetch('http://localhost:25106/api/conda/envs')
    const data = await response.json()

    if (data.success) {
      condaEnvs.value = data.environments
    } else {
      ElMessage.warning('获取Conda环境失败')
    }
  } catch (error) {
    console.error('加载Conda环境失败:', error)
    ElMessage.error('无法连接到代理服务器，请确保已启动')
  } finally {
    condaLoading.value = false
  }
}

// 环境管理器变化处理
const onEnvManagerChange = () => {
  // 清空其他配置
  agentConfig.envName = 'maicraft'
  agentConfig.venvPath = ''
  agentConfig.poetryPath = ''
  agentConfig.pipenvPath = ''
  agentConfig.uvPath = ''
  agentConfig.pythonPath = ''
}

// 获取当前配置描述
const getCurrentConfigDescription = () => {
  switch (agentConfig.envManager) {
    case 'conda':
      return `使用Conda环境: ${agentConfig.envName}, 工作目录: ${agentConfig.workDir}`
    case 'venv':
      return `使用Virtualenv: ${agentConfig.venvPath}, 工作目录: ${agentConfig.workDir}`
    case 'poetry':
      return `使用Poetry项目: ${agentConfig.poetryPath}, 工作目录: ${agentConfig.workDir}`
    case 'pipenv':
      return `使用Pipenv项目: ${agentConfig.pipenvPath}, 工作目录: ${agentConfig.workDir}`
    case 'uv':
      return `使用uv项目: ${agentConfig.uvPath}, 工作目录: ${agentConfig.workDir}`
    case 'manual':
      return `使用Python路径: ${agentConfig.pythonPath}, 工作目录: ${agentConfig.workDir}`
    default:
      return '未配置'
  }
}

// 获取使用说明
const getUsageInstructions = () => {
  return '1. 选择合适的Python环境管理器；2. 指定Agent项目路径；3. 点击启动按钮；4. Agent将在后台运行main.py'
}

// 启动Agent
const startAgent = async () => {
  try {
    agentActionLoading.value = true

    // 验证配置
    if (!validateConfig()) {
      return
    }

    const payload = {
      envManager: agentConfig.envManager,
      envName: agentConfig.envName,
      venvPath: agentConfig.venvPath,
      poetryPath: agentConfig.poetryPath,
      pipenvPath: agentConfig.pipenvPath,
      uvPath: agentConfig.uvPath,
      pythonPath: agentConfig.pythonPath,
      workDir: agentConfig.workDir || undefined,
    }

    const response = await fetch('http://localhost:25106/api/agent/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.success) {
      ElMessage.success(data.message)
      agentStatus.value = 'starting'
      envManagerType.value = agentConfig.envManager

      // 延迟获取状态
      setTimeout(() => {
        getAgentStatus()
      }, 2000)
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    console.error('启动Agent失败:', error)
    ElMessage.error('启动失败，无法连接到代理服务器')
  } finally {
    agentActionLoading.value = false
  }
}

// 验证配置
const validateConfig = () => {
  // 验证工作目录（所有环境类型都必填）
  if (!agentConfig.workDir || agentConfig.workDir.trim() === '') {
    ElMessage.error('请输入Agent项目路径')
    return false
  }

  switch (agentConfig.envManager) {
    case 'conda':
      if (!agentConfig.envName) {
        ElMessage.error('请选择Conda环境')
        return false
      }
      break
    case 'venv':
      if (!agentConfig.venvPath) {
        ElMessage.error('请输入虚拟环境路径')
        return false
      }
      break
    case 'poetry':
      if (!agentConfig.poetryPath) {
        ElMessage.error('请输入Poetry项目路径')
        return false
      }
      break
    case 'pipenv':
      if (!agentConfig.pipenvPath) {
        ElMessage.error('请输入Pipenv项目路径')
        return false
      }
      break
    case 'uv':
      if (!agentConfig.uvPath) {
        ElMessage.error('请输入uv项目路径')
        return false
      }
      break
    case 'manual':
      if (!agentConfig.pythonPath) {
        ElMessage.error('请输入Python可执行文件路径')
        return false
      }
      break
  }
  return true
}

// 停止Agent
const stopAgent = async () => {
  try {
    agentActionLoading.value = true

    const response = await fetch('http://localhost:25106/api/agent/stop', {
      method: 'POST',
    })

    const data = await response.json()

    if (data.success) {
      ElMessage.success(data.message)
      agentStatus.value = 'stopping'

      // 延迟获取状态
      setTimeout(() => {
        getAgentStatus()
      }, 1000)
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    console.error('停止Agent失败:', error)
    ElMessage.error('停止失败，无法连接到代理服务器')
  } finally {
    agentActionLoading.value = false
  }
}

// 清理僵尸进程
const cleanupProcesses = async () => {
  try {
    cleanupLoading.value = true

    const response = await fetch('http://localhost:25106/api/agent/cleanup', {
      method: 'POST',
    })

    const data = await response.json()

    if (data.success) {
      const message =
        data.cleanupCount > 0 ? `成功清理 ${data.cleanupCount} 个进程` : '未发现需要清理的进程'

      ElMessage.success(message)

      // 清理后重新获取状态
      setTimeout(() => {
        getAgentStatus()
      }, 1000)
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    console.error('清理进程失败:', error)
    ElMessage.error('清理失败，无法连接到代理服务器')
  } finally {
    cleanupLoading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  loadAgentConfig()
  detectSystemEnvs()

  // 立即获取一次Agent状态
  getAgentStatus()

  // 设置定时器定期更新Agent状态
  const statusInterval = setInterval(() => {
    getAgentStatus()
  }, 5000) // 每5秒更新一次

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(statusInterval)
  })
})
</script>

<style scoped>
.agent-manager-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-description {
  color: #666;
  font-size: 14px;
}

.agent-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.status-card,
.config-card,
.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-status {
  padding: 20px 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.status-item .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.status-item .value {
  color: #333;
  font-weight: 500;
}

.config-form {
  padding: 20px 0;
}

.config-form .el-form-item {
  margin-bottom: 20px;
}

.config-form .el-form-item__label {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.env-info {
  padding: 20px 0;
}

.env-list {
  margin-top: 10px;
}

.env-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.env-item .el-tag {
  min-width: 60px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .agent-manager-page {
    padding: 10px;
  }

  .agent-content {
    padding: 15px;
  }

  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .status-item .label {
    min-width: auto;
  }
}
</style>
