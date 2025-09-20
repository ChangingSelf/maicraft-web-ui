<template>
  <div class="settings-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>配置管理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="loadConfig" :loading="loading">
          刷新配置
        </el-button>
        <el-button type="success" :icon="Download" @click="exportConfig"> 导出配置 </el-button>
        <el-button type="warning" :icon="Upload" @click="showImportDialog = true">
          导入配置
        </el-button>
        <el-button type="danger" :icon="RefreshLeft" @click="resetConfig"> 重置配置 </el-button>
      </div>
    </div>

    <!-- 配置内容 -->
    <div class="config-content">
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <!-- 内部配置 -->
        <el-tab-pane label="内部配置" name="inner">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>内部配置</span>
                  <el-button type="primary" size="small" @click="editSection('inner')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>版本:</label>
                  <span>{{ config.inner?.version || 'N/A' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- API配置 -->
        <el-tab-pane label="API配置" name="api">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>API配置</span>
                  <el-button type="primary" size="small" @click="editSection('api')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>主机:</label>
                  <span>{{ config.api?.host || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>端口:</label>
                  <span>{{ config.api?.port || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>启用CORS:</label>
                  <el-tag :type="config.api?.enable_cors ? 'success' : 'info'">
                    {{ config.api?.enable_cors ? '是' : '否' }}
                  </el-tag>
                </div>
                <div class="config-item">
                  <label>日志级别:</label>
                  <span>{{ config.api?.log_level || 'N/A' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 机器人配置 -->
        <el-tab-pane label="机器人配置" name="bot">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>机器人配置</span>
                  <el-button type="primary" size="small" @click="editSection('bot')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>玩家名称:</label>
                  <span>{{ config.bot?.player_name || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>机器人名称:</label>
                  <span>{{ config.bot?.bot_name || 'N/A' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 游戏配置 -->
        <el-tab-pane label="游戏配置" name="game">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>游戏配置</span>
                  <el-button type="primary" size="small" @click="editSection('game')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>目标任务:</label>
                  <span>{{ config.game?.goal || 'N/A' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- LLM配置 -->
        <el-tab-pane label="LLM配置" name="llm">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>LLM配置</span>
                  <el-button type="primary" size="small" @click="editSection('llm')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>模型:</label>
                  <span>{{ config.llm?.model || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>温度:</label>
                  <span>{{ config.llm?.temperature || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>最大Tokens:</label>
                  <span>{{ config.llm?.max_tokens || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>API密钥:</label>
                  <span>{{ config.llm?.api_key ? '***已设置***' : '未设置' }}</span>
                </div>
                <div class="config-item">
                  <label>Base URL:</label>
                  <span>{{ config.llm?.base_url || 'N/A' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 快速LLM配置 -->
        <el-tab-pane label="快速LLM配置" name="llm_fast">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>快速LLM配置</span>
                  <el-button type="primary" size="small" @click="editSection('llm_fast')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>模型:</label>
                  <span>{{ config.llm_fast?.model || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>温度:</label>
                  <span>{{ config.llm_fast?.temperature || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>最大Tokens:</label>
                  <span>{{ config.llm_fast?.max_tokens || 'N/A' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 视觉配置 -->
        <el-tab-pane label="视觉配置" name="visual">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>视觉配置</span>
                  <el-button type="primary" size="small" @click="editSection('visual')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>启用:</label>
                  <el-tag :type="config.visual?.enable ? 'success' : 'info'">
                    {{ config.visual?.enable ? '启用' : '禁用' }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- VLM配置 -->
        <el-tab-pane label="VLM配置" name="vlm">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>VLM配置</span>
                  <el-button type="primary" size="small" @click="editSection('vlm')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>模型:</label>
                  <span>{{ config.vlm?.model || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>温度:</label>
                  <span>{{ config.vlm?.temperature || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>最大Tokens:</label>
                  <span>{{ config.vlm?.max_tokens || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>API密钥:</label>
                  <span>{{ config.vlm?.api_key ? '***已设置***' : '未设置' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 日志配置 -->
        <el-tab-pane label="日志配置" name="logging">
          <div class="config-section">
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>日志配置</span>
                  <el-button type="primary" size="small" @click="editSection('logging')">
                    编辑
                  </el-button>
                </div>
              </template>

              <div class="config-items">
                <div class="config-item">
                  <label>日志级别:</label>
                  <span>{{ config.logging?.level || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>启用JSON格式:</label>
                  <el-tag :type="config.logging?.enable_json ? 'success' : 'info'">
                    {{ config.logging?.enable_json ? '是' : '否' }}
                  </el-tag>
                </div>
                <div class="config-item">
                  <label>写入文件:</label>
                  <el-tag :type="config.logging?.log_to_file ? 'success' : 'info'">
                    {{ config.logging?.log_to_file ? '是' : '否' }}
                  </el-tag>
                </div>
                <div class="config-item">
                  <label>日志目录:</label>
                  <span>{{ config.logging?.log_dir || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>轮转周期:</label>
                  <span>{{ config.logging?.rotation || 'N/A' }}</span>
                </div>
                <div class="config-item">
                  <label>保留时间:</label>
                  <span>{{ config.logging?.retention || 'N/A' }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 编辑配置对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="`编辑 ${editingSection} 配置`"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="120px">
        <template v-for="[key, value] in Object.entries(editForm)" :key="key">
          <el-form-item :label="key" :prop="key">
            <el-input
              v-if="typeof value === 'string'"
              v-model="editForm[key]"
              :placeholder="`输入 ${key}`"
            />
            <el-input-number
              v-else-if="typeof value === 'number'"
              v-model="editForm[key]"
              :placeholder="`输入 ${key}`"
              style="width: 100%"
            />
            <el-switch
              v-else-if="typeof value === 'boolean'"
              v-model="editForm[key]"
              :active-text="key"
            />
            <el-input v-else v-model="editForm[key]" :placeholder="`输入 ${key}`" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveConfig"> 保存 </el-button>
      </template>
    </el-dialog>

    <!-- 导入配置对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入配置"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="import-form">
        <el-alert
          title="导入说明"
          description="请选择配置文件（TOML格式）进行导入，导入操作将覆盖现有配置。"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-upload
          ref="uploadRef"
          :action="''"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".toml"
        >
          <el-button type="primary">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">只能上传 .toml 文件，且不超过 10MB</div>
          </template>
        </el-upload>
      </div>

      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importing"
          :disabled="!selectedFile"
          @click="importConfig"
        >
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Refresh, Download, Upload, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'Settings',
})

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const importing = ref(false)

const config = reactive<any>({})
const activeTab = ref('inner')
const editingSection = ref('')
const selectedFile = ref<File | null>(null)

const showEditDialog = ref(false)
const showImportDialog = ref(false)

const editForm = reactive<Record<string, any>>({})
const uploadRef = ref()

// 表单验证规则
const editFormRules = {}

// 加载配置
const loadConfig = async () => {
  try {
    loading.value = true
    // TODO: 替换为实际API调用
    // const response = await configApi.getConfig()

    // 模拟数据
    Object.assign(config, {
      inner: {
        version: '0.4.0',
      },
      api: {
        host: '0.0.0.0',
        port: 20914,
        enable_cors: true,
        log_level: 'warning',
      },
      bot: {
        player_name: 'EvilMai',
        bot_name: '麦麦',
      },
      game: {
        goal: '以合适的步骤，建立营地，挖到16个钻石，并存储',
      },
      llm: {
        model: 'qwen3-next-80b-a3b-instruct',
        temperature: 0.2,
        max_tokens: 1024,
        api_key: '***masked***',
        base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      },
      llm_fast: {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 1024,
      },
      visual: {
        enable: false,
      },
      vlm: {
        model: 'Pro/THUDM/GLM-4.1V-9B-Thinking',
        temperature: 0.3,
        max_tokens: 1024,
        api_key: '***masked***',
      },
      logging: {
        level: 'INFO',
        enable_json: false,
        log_to_file: true,
        log_dir: 'logs',
        rotation: '1 day',
        retention: '7 days',
      },
    })
  } catch (error) {
    ElMessage.error('加载配置失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 编辑配置节
const editSection = (section: string) => {
  editingSection.value = section
  Object.assign(editForm, config[section] || {})
  showEditDialog.value = true
}

// 保存配置
const saveConfig = async () => {
  try {
    saving.value = true

    // TODO: 替换为实际API调用
    // await configApi.updateConfig(editingSection.value, editForm)

    // 模拟保存
    Object.assign(config[editingSection.value], editForm)

    ElMessage.success('配置保存成功')
    showEditDialog.value = false
  } catch (error) {
    ElMessage.error('保存配置失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

// 重置配置
const resetConfig = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有配置吗？此操作将恢复默认设置。', '确认重置', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // TODO: 替换为实际API调用
    // await configApi.resetConfig()

    // 模拟重置
    await loadConfig()
    ElMessage.success('配置已重置')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置配置失败')
      console.error(error)
    }
  }
}

// 导出配置
const exportConfig = async () => {
  try {
    // TODO: 替换为实际API调用
    // const response = await configApi.exportConfig()

    // 模拟导出
    const configText = JSON.stringify(config, null, 2)
    const blob = new Blob([configText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'maicraft-config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('配置导出成功')
  } catch (error) {
    ElMessage.error('导出配置失败')
    console.error(error)
  }
}

// 处理文件选择
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

// 导入配置
const importConfig = async () => {
  if (!selectedFile.value) return

  try {
    importing.value = true

    // 读取文件内容
    const text = await selectedFile.value.text()
    const importedConfig = JSON.parse(text)

    // TODO: 替换为实际API调用
    // await configApi.importConfig(importedConfig)

    // 模拟导入
    Object.assign(config, importedConfig)

    ElMessage.success('配置导入成功')
    showImportDialog.value = false
    selectedFile.value = null
  } catch (error) {
    ElMessage.error('导入配置失败')
    console.error(error)
  } finally {
    importing.value = false
  }
}

// 处理标签页变化
const handleTabChange = (tab: any) => {
  activeTab.value = tab.props.name
}

// 组件挂载时加载配置
onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.config-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.config-section {
  padding: 20px;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.config-item label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
}

.config-item span {
  color: #333;
  font-weight: 500;
}

.import-form {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .config-items {
    grid-template-columns: 1fr;
  }

  .config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .config-item label {
    min-width: auto;
  }
}
</style>

<style scoped>
.settings {
  padding: 20px;
  height: 100%;
}

.page-header {
  background: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.coming-soon {
  background: white;
  padding: 60px 30px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
