<template>
  <div class="component-test">
    <PageHeader title="组件测试页面" description="测试重构后的通用组件">
      <template #actions>
        <el-button type="primary" @click="testAction">测试按钮</el-button>
        <ConnectionStatus
          :is-connected="isConnected"
          :connecting="connecting"
          :disconnecting="disconnecting"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
        />
      </template>
    </PageHeader>

    <div class="test-content">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <h3>StatusDisplay 组件测试</h3>
            </template>
            <StatusDisplay :items="statusItems" />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <h3>ModeSwitch 组件测试</h3>
            </template>
            <ModeSwitch
              v-model="testMode"
              active-text="开启"
              inactive-text="关闭"
              active-label="测试模式"
              inactive-label="正常模式"
              show-status
              status-text="当前状态"
              @change="handleModeChange"
            />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card>
            <template #header>
              <h3>EmptyState 组件测试</h3>
            </template>
            <EmptyState
              v-if="showEmpty"
              title="暂无测试数据"
              description="这是一个空状态组件的演示"
              action-text="重新加载"
              @action="handleEmptyAction"
            />
            <div v-else>
              <p>有数据时的内容显示</p>
              <el-button @click="showEmpty = true">显示空状态</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  PageHeader,
  ConnectionStatus,
  StatusDisplay,
  ModeSwitch,
  EmptyState,
} from '@/components/common'

// 测试数据
const isConnected = ref(false)
const connecting = ref(false)
const disconnecting = ref(false)
const testMode = ref(false)
const showEmpty = ref(true)

const statusItems = ref([
  {
    key: 'users',
    label: '在线用户',
    value: '156',
    description: '当前活跃用户数',
  },
  {
    key: 'messages',
    label: '消息数',
    value: '2,345',
    valueStyle: { color: '#67c23a' },
  },
  {
    key: 'errors',
    label: '错误数',
    value: '3',
    class: 'error-status',
    valueStyle: { color: '#f56c6c' },
  },
  {
    key: 'uptime',
    label: '运行时间',
    value: '7天',
    description: '系统持续运行时间',
  },
])

// 事件处理
const testAction = () => {
  ElMessage.success('测试按钮点击成功！')
}

const handleConnect = () => {
  connecting.value = true
  setTimeout(() => {
    connecting.value = false
    isConnected.value = true
    ElMessage.success('连接成功！')
  }, 1500)
}

const handleDisconnect = () => {
  disconnecting.value = true
  setTimeout(() => {
    disconnecting.value = false
    isConnected.value = false
    ElMessage.info('连接已断开')
  }, 1000)
}

const handleModeChange = (value: boolean) => {
  ElMessage.info(`模式切换为: ${value ? '测试模式' : '正常模式'}`)
}

const handleEmptyAction = () => {
  showEmpty.value = false
  ElMessage.success('重新加载成功！')
}

defineOptions({
  name: 'ComponentTest',
})
</script>

<style scoped>
@import '@/styles/common.css';

.component-test {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.test-content {
  margin-top: 20px;
}

.error-status {
  border-color: #f56c6c !important;
  background-color: #fef0f0 !important;
}
</style>
