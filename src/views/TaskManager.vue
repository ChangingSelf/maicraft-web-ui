<template>
  <div class="task-manager-page">
    <!-- 页面头部 -->
    <PageHeader title="任务管理" :showConnectionStatus="true" :isConnected="isConnected">
      <template #actions>
        <el-button
          v-if="!isConnected"
          type="primary"
          :icon="Connection"
          @click="connectToTaskService"
          :loading="connecting"
        >
          连接
        </el-button>
      </template>
    </PageHeader>

    <!-- 任务统计 -->
    <div class="stats-section">
      <div v-if="taskStats.goal" class="goal-section">
        <el-alert
          :title="`当前目标: ${taskStats.goal}`"
          :type="taskStats.is_all_done ? 'success' : 'info'"
          :closable="false"
          show-icon
        />
      </div>
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.total }}</div>
                <div class="stat-label">总任务</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.pending }}</div>
                <div class="stat-label">待处理</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.is_all_done ? '是' : '否' }}</div>
                <div class="stat-label">全部完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-section">
      <el-card class="tasks-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>任务列表</span>
            <div class="header-actions">
              <el-button
                type="primary"
                :icon="Plus"
                @click="showCreateDialog = true"
                :disabled="!isConnected"
                size="small"
              >
                新建任务
              </el-button>
              <el-button
                type="success"
                :icon="List"
                @click="showBatchDialog = true"
                :disabled="!isConnected"
                size="small"
              >
                批量操作
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                @click="clearAllTasks"
                :disabled="tasks.length === 0 || !isConnected"
                size="small"
              >
                清空所有
              </el-button>
              <div class="filters">
                <el-select
                  v-model="statusFilter"
                  placeholder="状态筛选"
                  clearable
                  style="width: 120px"
                  size="small"
                >
                  <el-option label="全部" value="" />
                  <el-option label="待处理" value="pending" />
                  <el-option label="进行中" value="in_progress" />
                  <el-option label="已完成" value="completed" />
                </el-select>
              </div>
            </div>
          </div>
        </template>

        <div class="tasks-list">
          <el-empty v-if="filteredTasks.length === 0" description="暂无任务数据">
            <el-button type="primary" @click="showCreateDialog = true">创建第一个任务</el-button>
          </el-empty>

          <div v-else class="task-items">
            <el-card
              v-for="task in filteredTasks"
              :key="task.id"
              class="task-item"
              :class="`task-${task.done ? 'completed' : 'pending'}`"
              shadow="hover"
            >
              <div class="task-content">
                <div class="task-header">
                  <div class="task-title">
                    <el-checkbox
                      :model-value="task.done"
                      @change="toggleTaskStatus(task)"
                      :disabled="updatingTask === task.id"
                    />
                    <h3 :class="{ 'completed-text': task.done }">{{ task.details }}</h3>
                  </div>
                  <div class="task-actions">
                    <el-tag :type="getTaskStatusType(task)" size="small">
                      {{ getTaskStatusText(task) }}
                    </el-tag>
                    <el-button size="small" type="text" @click="showTaskDetail(task)">
                      详情
                    </el-button>
                    <el-button size="small" type="text" @click="editTask(task)"> 编辑 </el-button>
                    <el-button size="small" type="danger" @click="deleteTask(task)">
                      删除
                    </el-button>
                  </div>
                </div>

                <div class="task-meta">
                  <div class="task-id">ID: {{ task.id }}</div>
                  <div class="task-done-criteria" v-if="task.done_criteria">
                    <strong>完成条件:</strong> {{ task.done_criteria }}
                  </div>
                </div>

                <div class="task-progress" v-if="task.progress">
                  <div class="progress-label">进度:</div>
                  <div class="progress-content">{{ task.progress }}</div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTask ? '编辑任务' : '创建任务'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskFormRules" label-width="100px">
        <el-form-item label="任务详情" prop="details">
          <el-input
            v-model="taskForm.details"
            type="textarea"
            :rows="3"
            placeholder="输入任务的详细描述"
          />
        </el-form-item>

        <el-form-item label="完成条件" prop="done_criteria">
          <el-input
            v-model="taskForm.done_criteria"
            type="textarea"
            :rows="2"
            placeholder="描述任务完成的标准"
          />
        </el-form-item>

        <el-form-item label="初始进度">
          <el-input
            v-model="taskForm.progress"
            type="textarea"
            :rows="2"
            placeholder="任务的初始进度描述（可选）"
          />
        </el-form-item>

        <el-form-item label="任务状态">
          <el-radio-group v-model="taskForm.done">
            <el-radio :value="false">待处理</el-radio>
            <el-radio :value="true">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">
          {{ editingTask ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="任务详情" width="700px">
      <div v-if="selectedTask" class="task-detail">
        <div class="detail-row"><strong>任务ID:</strong> {{ selectedTask.id }}</div>
        <div class="detail-row">
          <strong>状态:</strong>
          <el-tag :type="getTaskStatusType(selectedTask)">
            {{ getTaskStatusText(selectedTask) }}
          </el-tag>
        </div>
        <div class="detail-row"><strong>详情:</strong> {{ selectedTask.details }}</div>
        <div class="detail-row" v-if="selectedTask.done_criteria">
          <strong>完成条件:</strong> {{ selectedTask.done_criteria }}
        </div>
        <div class="detail-row" v-if="selectedTask.progress">
          <strong>进度:</strong> {{ selectedTask.progress }}
        </div>
      </div>
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量操作"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="batch-form">
        <el-alert
          title="批量操作说明"
          description="可以对选中的任务执行批量完成、删除等操作"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-form :model="batchForm" label-width="120px">
          <el-form-item label="选择任务">
            <el-checkbox-group v-model="batchForm.selectedTasks">
              <el-checkbox v-for="task in tasks" :key="task.id" :label="task.id" :value="task.id">
                {{ task.details.slice(0, 50) }}{{ task.details.length > 50 ? '...' : '' }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="操作类型">
            <el-radio-group v-model="batchForm.operation">
              <el-radio value="complete">标记完成</el-radio>
              <el-radio value="delete">删除任务</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="batchOperating"
          :disabled="batchForm.selectedTasks.length === 0"
          @click="executeBatchOperation"
        >
          执行批量操作
        </el-button>
      </template>
    </el-dialog>

    <!-- 连接帮助对话框 -->
    <el-dialog v-model="showHelpDialog" title="连接帮助" width="700px">
      <div class="connection-help">
        <el-alert
          title="WebSocket连接失败"
          description="无法连接到任务管理服务，请检查以下配置："
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <div class="help-content">
          <h4>🔧 检查项目</h4>
          <ul>
            <li><strong>后端服务状态：</strong>确保MaicraftAgent后端服务正在运行</li>
            <li><strong>端口配置：</strong>后端服务应运行在端口 <code>20914</code></li>
            <li><strong>WebSocket端点：</strong>确保后端支持 <code>/ws/tasks</code> 端点</li>
          </ul>

          <h4>📡 连接信息</h4>
          <div class="connection-info">
            <p><strong>WebSocket URL:</strong> <code>ws://localhost:20914/ws/tasks</code></p>
            <p>
              <strong>状态:</strong>
              <span :class="{ 'text-success': isConnected, 'text-danger': !isConnected }">
                {{ isConnected ? '已连接' : '未连接' }}
              </span>
            </p>
          </div>

          <h4>🔍 故障排除步骤</h4>
          <ol>
            <li>检查后端服务是否在运行：<code>netstat -ano | findstr 20914</code></li>
            <li>检查防火墙设置，确保端口20914未被阻止</li>
            <li>查看后端服务日志，确认WebSocket服务已启动</li>
            <li>尝试重启后端服务</li>
            <li>如果端口被占用，更改配置中的端口号</li>
          </ol>

          <h4>⚙️ 配置检查</h4>
          <p>当前WebSocket配置：</p>
          <pre>{{
            JSON.stringify({ host: 'localhost', port: 20914, endpoint: '/ws/tasks' }, null, 2)
          }}</pre>
        </div>
      </div>

      <template #footer>
        <el-button @click="showHelpDialog = false">关闭</el-button>
        <el-button type="primary" @click="connectToTaskService" :disabled="connecting">
          {{ connecting ? '连接中...' : '重新连接' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { PageHeader } from '@/components/common'
import {
  Plus,
  List,
  Delete,
  Refresh,
  Document,
  Clock,
  Loading,
  Check,
  Star,
  Timer,
  Connection,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { type Task } from '../services'
import { useWebSocketDataStore } from '@/stores/websocketData'
import {
  getGlobalConnectionStatus,
  connectSingleEndpoint,
  disconnectSingleEndpoint,
} from '@/services/globalWebSocketService'
import { getWebSocketManager } from '@/services/websocket'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'TaskManager',
})

// TaskManager现在使用全局WebSocket数据，不需要直接使用taskService

// 响应式数据
const saving = ref(false)
const batchOperating = ref(false)
const updatingTask = ref<string | null>(null)
const connecting = ref(false)

const selectedTask = ref<Task | null>(null)
const editingTask = ref<Task | null>(null)

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showBatchDialog = ref(false)
const showHelpDialog = ref(false)

const statusFilter = ref('')

// 表单数据
const taskForm = reactive({
  details: '',
  done_criteria: '',
  progress: '',
  done: false,
})

const batchForm = reactive({
  selectedTasks: [] as string[],
  operation: 'complete',
})

// 表单验证规则
const taskFormRules = {
  details: [{ required: true, message: '任务详情不能为空', trigger: 'blur' }],
  done_criteria: [{ required: true, message: '完成条件不能为空', trigger: 'blur' }],
}

// 计算属性 - 基于全局状态中的任务数据
const taskStats = computed(() => {
  const taskList = tasks.value || []
  const completed = taskList.filter((task) => task.done).length
  const pending = taskList.filter((task) => !task.done).length
  const total = taskList.length

  return {
    pending,
    in_progress: 0, // 接口中没有进行中状态，直接设为0
    completed,
    total,
    is_all_done: total > 0 && completed === total,
    is_done: total > 0 && completed === total,
    total_time: 0, // 接口中没有总耗时信息
    goal: '任务管理', // 默认目标
  }
})

// 使用全局状态中的任务数据
const store = useWebSocketDataStore()
const { tasks: globalTasks } = store
const tasks = computed(() => globalTasks)

const loading = ref(false)

// 使用全局连接状态
const globalConnectionStatus = getGlobalConnectionStatus()
const isConnected = computed(() => globalConnectionStatus.connectionStatus.TASK_MANAGER || false)

const filteredTasks = computed(() => {
  if (!statusFilter.value) {
    return tasks.value
  }

  return tasks.value.filter((task) => {
    switch (statusFilter.value) {
      case 'pending':
        return !task.done
      case 'completed':
        return task.done
      default:
        return true
    }
  })
})

// 获取任务状态类型
const getTaskStatusType = (task: Task) => {
  return task.done ? 'success' : 'warning'
}

// 获取任务状态文本
const getTaskStatusText = (task: Task) => {
  return task.done ? '已完成' : '待处理'
}

// 连接到任务服务
const connectToTaskService = async () => {
  if (connecting.value) return

  try {
    connecting.value = true
    await connectSingleEndpoint('TASK_MANAGER')

    // 连接成功后，通过WebSocket发送获取任务列表的消息
    setTimeout(() => {
      const manager = getWebSocketManager('TASK_MANAGER')
      if (manager && manager.isConnected) {
        manager.sendMessage({ type: 'get_tasks' })
      }
    }, 1000) // 延迟1秒确保连接稳定
  } catch (error) {
    console.error('连接任务服务失败:', error)
    ElMessage.error('连接任务服务失败，请检查后端服务是否运行')
  } finally {
    connecting.value = false
  }
}

// 加载任务列表（通过WebSocket）
const loadTasks = async () => {
  try {
    const manager = getWebSocketManager('TASK_MANAGER')
    if (manager && manager.isConnected) {
      manager.sendMessage({ type: 'get_tasks' })
    } else {
      ElMessage.warning('请先连接任务服务')
    }
  } catch (error) {
    ElMessage.error('加载任务列表失败')
    console.error(error)
  }
}

// 刷新任务列表
const refreshTasks = () => {
  loadTasks()
}

// 显示任务详情
const showTaskDetail = (task: Task) => {
  selectedTask.value = task
  showDetailDialog.value = true
}

// 编辑任务
const editTask = (task: Task) => {
  editingTask.value = task
  Object.assign(taskForm, {
    details: task.details,
    done_criteria: task.done_criteria || '',
    progress: task.progress || '',
    done: task.done,
  })
  showCreateDialog.value = true
}

// 删除任务
const deleteTask = async (task: Task) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务 "${task.details}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const manager = getWebSocketManager('TASK_MANAGER')
    if (manager && manager.isConnected) {
      manager.sendMessage({
        type: 'delete_task',
        task_id: task.id,
      })
      ElMessage.success('任务删除请求已发送')
    } else {
      ElMessage.warning('请先连接任务服务')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除任务失败')
      console.error(error)
    }
  }
}

// 清空所有任务
const clearAllTasks = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有任务吗？此操作不可恢复。', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 接口文档中没有批量删除API，通过逐个删除实现
    const manager = getWebSocketManager('TASK_MANAGER')
    if (!manager || !manager.isConnected) {
      ElMessage.warning('请先连接任务服务')
      return
    }

    const currentTasks = [...tasks.value]
    for (const task of currentTasks) {
      try {
        manager.sendMessage({
          type: 'delete_task',
          task_id: task.id,
        })
      } catch (error) {
        console.error(`删除任务 ${task.id} 失败:`, error)
      }
    }

    ElMessage.success('所有任务已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空任务失败')
      console.error(error)
    }
  }
}

// 保存任务（创建或更新）- 通过WebSocket
const saveTask = async () => {
  try {
    saving.value = true
    const manager = getWebSocketManager('TASK_MANAGER')

    if (!manager || !manager.isConnected) {
      ElMessage.warning('请先连接任务服务')
      return
    }

    if (editingTask.value) {
      // 更新任务 - 通过更新进度来实现任务更新
      if (taskForm.progress) {
        manager.sendMessage({
          type: 'update_task',
          task_id: editingTask.value.id,
          progress: taskForm.progress,
        })
        ElMessage.success('任务进度更新请求已发送')
      }

      // 如果状态改变，需要标记完成或取消完成
      if (taskForm.done !== editingTask.value.done) {
        if (taskForm.done) {
          manager.sendMessage({
            type: 'mark_done',
            task_id: editingTask.value.id,
          })
          ElMessage.success('任务完成请求已发送')
        } else {
          // 接口中没有取消完成的功能，这里暂时不支持
          ElMessage.warning('当前不支持取消任务完成状态')
          return
        }
      }
    } else {
      // 创建任务
      manager.sendMessage({
        type: 'add_task',
        details: taskForm.details,
        done_criteria: taskForm.done_criteria,
      })
      ElMessage.success('任务创建请求已发送')
    }

    showCreateDialog.value = false
    resetTaskForm()
  } catch (error) {
    ElMessage.error(editingTask.value ? '更新任务失败' : '创建任务失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

// 重置任务表单
const resetTaskForm = () => {
  Object.assign(taskForm, {
    details: '',
    done_criteria: '',
    progress: '',
    done: false,
  })
  editingTask.value = null
}

// 切换任务状态
const toggleTaskStatus = async (task: Task) => {
  try {
    updatingTask.value = task.id
    const manager = getWebSocketManager('TASK_MANAGER')

    if (!manager || !manager.isConnected) {
      ElMessage.warning('请先连接任务服务')
      return
    }

    if (!task.done) {
      // 标记为完成
      manager.sendMessage({
        type: 'mark_done',
        task_id: task.id,
      })
      ElMessage.success('任务完成请求已发送')
    } else {
      // 接口中不支持取消完成，这里提示用户
      ElMessage.warning('当前不支持取消任务完成状态')
      return
    }
  } catch (error) {
    ElMessage.error('更新任务状态失败')
    console.error(error)
  } finally {
    updatingTask.value = null
  }
}

// 执行批量操作
const executeBatchOperation = async () => {
  if (batchForm.selectedTasks.length === 0) return

  try {
    batchOperating.value = true
    const manager = getWebSocketManager('TASK_MANAGER')

    if (!manager || !manager.isConnected) {
      ElMessage.warning('请先连接任务服务')
      return
    }

    if (batchForm.operation === 'complete') {
      // 批量完成
      for (const taskId of batchForm.selectedTasks) {
        try {
          manager.sendMessage({
            type: 'mark_done',
            task_id: taskId,
          })
        } catch (error) {
          console.error(`完成任务 ${taskId} 失败:`, error)
        }
      }
      ElMessage.success(`已发送 ${batchForm.selectedTasks.length} 个任务完成请求`)
    } else if (batchForm.operation === 'delete') {
      // 批量删除
      for (const taskId of batchForm.selectedTasks) {
        try {
          manager.sendMessage({
            type: 'delete_task',
            task_id: taskId,
          })
        } catch (error) {
          console.error(`删除任务 ${taskId} 失败:`, error)
        }
      }
      ElMessage.success(`已发送 ${batchForm.selectedTasks.length} 个任务删除请求`)
    }

    showBatchDialog.value = false
    batchForm.selectedTasks = []
  } catch (error) {
    ElMessage.error('批量操作失败')
    console.error(error)
  } finally {
    batchOperating.value = false
  }
}

// 组件挂载时不再自动连接，让用户手动连接
onMounted(async () => {
  console.log('任务管理器已加载，请手动连接任务服务')
})

// 组件卸载前不需要特殊处理，全局管理器会处理连接
onBeforeUnmount(() => {
  console.log('任务管理器组件卸载')
})
</script>

<style scoped>
.task-manager-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tasks-card .card-header .header-actions {
  flex-wrap: wrap;
  gap: 8px;
}

.stats-section {
  margin-bottom: 24px;
}

.goal-section {
  margin-bottom: 16px;
}

.stat-card {
  height: 80px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
  color: #409eff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.tasks-section {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 12px;
}

.tasks-list {
  max-height: 600px;
  overflow-y: auto;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  transition: transform 0.2s ease;
}

.task-item:hover {
  transform: translateY(-1px);
}

.task-completed {
  opacity: 0.7;
}

.task-content {
  width: 100%;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
}

.task-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.completed-text {
  text-decoration: line-through;
  color: #666;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.task-id {
  font-family: monospace;
  font-size: 12px;
  color: #999;
}

.task-done-criteria {
  font-size: 14px;
}

.task-progress {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.progress-label {
  font-weight: 500;
  color: #333;
}

.task-detail .detail-row {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.task-detail .detail-row strong {
  min-width: 80px;
  color: #333;
}

.batch-form {
  max-height: 400px;
  overflow-y: auto;
}

.connection-help {
  max-height: 500px;
  overflow-y: auto;
}

.help-content {
  line-height: 1.6;
}

.help-content h4 {
  margin-top: 24px;
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}

.help-content ul,
.help-content ol {
  margin: 8px 0 16px 20px;
}

.help-content li {
  margin-bottom: 4px;
}

.help-content code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.connection-info {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
}

.connection-info p {
  margin: 8px 0;
}

.text-success {
  color: #67c23a;
  font-weight: 500;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}

.help-content pre {
  background-color: #f6f8fa;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  line-height: 1.45;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .stats-section .el-col {
    margin-bottom: 16px;
  }

  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .task-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
