<template>
  <div class="settings-page">
    <!-- 页面头部 -->
    <PageHeader title="配置管理">
      <template #actions>
        <el-button type="primary" :icon="Check" @click="applySettings" :loading="saving">
          应用配置
        </el-button>
        <el-button type="success" :icon="Download" @click="exportConfig"> 导出配置 </el-button>
        <el-button type="warning" :icon="Upload" @click="showImportDialog = true">
          导入配置
        </el-button>
        <el-button type="danger" :icon="RefreshLeft" @click="resetConfig"> 重置配置 </el-button>
      </template>
    </PageHeader>

    <!-- 配置内容 -->
    <div class="config-content">
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <!-- 连接配置 -->
        <el-tab-pane label="连接配置" name="connection">
          <div class="config-section">
            <!-- WebSocket配置 -->
            <el-card class="config-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>WebSocket 连接</span>
                </div>
              </template>

              <div class="config-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="主机:">
                      <el-input v-model="draftSettings.websocket.host" placeholder="localhost" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="端口:">
                      <el-input-number
                        v-model="draftSettings.websocket.port"
                        :min="1"
                        :max="65535"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="启用心跳:">
                      <el-switch v-model="draftSettings.websocket.enableHeartbeat" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="心跳间隔(ms):">
                      <el-input-number
                        v-model="draftSettings.websocket.heartbeatInterval"
                        :min="1000"
                        :max="60000"
                        :step="1000"
                        style="width: 100%"
                        :disabled="!draftSettings.websocket.enableHeartbeat"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="自动重连:">
                      <el-switch v-model="draftSettings.websocket.enableAutoReconnect" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="重连间隔(ms):">
                      <el-input-number
                        v-model="draftSettings.websocket.reconnectInterval"
                        :min="1000"
                        :max="30000"
                        :step="1000"
                        style="width: 100%"
                        :disabled="!draftSettings.websocket.enableAutoReconnect"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="最大重连次数:">
                      <el-input-number
                        v-model="draftSettings.websocket.maxReconnectAttempts"
                        :min="1"
                        :max="20"
                        style="width: 100%"
                        :disabled="!draftSettings.websocket.enableAutoReconnect"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-card>

            <!-- API配置 -->
            <el-card class="config-card" shadow="never" style="margin-top: 20px">
              <template #header>
                <div class="card-header">
                  <span>HTTP API 连接</span>
                </div>
              </template>

              <div class="config-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="主机:">
                      <el-input v-model="draftSettings.api.host" placeholder="localhost" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="端口:">
                      <el-input-number
                        v-model="draftSettings.api.port"
                        :min="1"
                        :max="65535"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="超时时间(ms):">
                      <el-input-number
                        v-model="draftSettings.api.timeout"
                        :min="1000"
                        :max="60000"
                        :step="1000"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

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
          description="请选择配置文件（JSON格式）进行导入，导入操作将覆盖现有配置。"
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
          accept=".json"
        >
          <el-button type="primary">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">只能上传 .json 文件，且不超过 10MB</div>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { Refresh, Download, Upload, RefreshLeft, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PageHeader } from '@/components/common'
import { useSettingsStore } from '../stores/settings'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'Settings',
})

// 使用设置store
const settingsStore = useSettingsStore()

// 响应式数据
const saving = ref(false)
const importing = ref(false)

const activeTab = ref('connection')
const selectedFile = ref<File | null>(null)

const showImportDialog = ref(false)

const uploadRef = ref()

// 便捷访问配置
const config = settingsStore.settings

// 草稿设置（用于编辑）
const draftSettings = reactive(JSON.parse(JSON.stringify(settingsStore.settings)))

// 同步草稿设置
const syncDraftSettings = () => {
  Object.assign(draftSettings, JSON.parse(JSON.stringify(settingsStore.settings)))
}

// 监听配置变化，同步到草稿
watch(
  () => settingsStore.settings,
  () => {
    syncDraftSettings()
  },
  { deep: true, immediate: true },
)

// 应用配置
const applySettings = async () => {
  try {
    saving.value = true

    // 应用草稿设置到store
    settingsStore.updateSettings(draftSettings)

    ElMessage.success('配置已应用')
  } catch (error) {
    ElMessage.error('应用配置失败')
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

    // 使用store重置配置
    settingsStore.resetSettings()

    // TODO: 如果需要同步到服务器，可以在这里添加API调用
    // await configApi.resetConfig()

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
    // 使用store导出配置
    const configText = settingsStore.exportSettings()
    const blob = new Blob([configText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'maicraft-settings.json'
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

    // 使用store导入配置
    const success = settingsStore.importSettings(text)
    if (!success) {
      throw new Error('配置格式无效')
    }

    // TODO: 如果需要同步到服务器，可以在这里添加API调用
    // await configApi.importConfig(importedConfig)

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

// 组件挂载时同步草稿设置
onMounted(() => {
  syncDraftSettings()
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

.config-form .el-input__inner,
.config-form .el-input-number__inner {
  border-radius: 6px;
}

.config-form .el-textarea__inner {
  border-radius: 6px;
  resize: vertical;
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
