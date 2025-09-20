<template>
  <div class="task-manager-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>任务管理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          新建任务
        </el-button>
        <el-button type="success" :icon="List" @click="showBatchDialog = true">
          批量操作
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          @click="clearAllTasks"
          :disabled="tasks.length === 0"
        >
          清空所有
        </el-button>
        <el-button type="info" :icon="Refresh" @click="refreshTasks" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 任务统计 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ tasks.length }}</div>
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
                <el-icon><Loading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.in_progress }}</div>
                <div class="stat-label">进行中</div>
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
        <el-col :span="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.total_time || 0 }}</div>
                <div class="stat-label">总耗时(s)</div>
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
            <div class="filters">
              <el-select
                v-model="statusFilter"
                placeholder="状态筛选"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" value="" />
                <el-option label="待处理" value="pending" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
              </el-select>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
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
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'TaskManager',
})

// 接口定义
interface Task {
  id: string
  details: string
  done_criteria?: string
  progress?: string
  done: boolean
}

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const batchOperating = ref(false)
const updatingTask = ref<string | null>(null)

const tasks = ref<Task[]>([])
const selectedTask = ref<Task | null>(null)
const editingTask = ref<Task | null>(null)

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showBatchDialog = ref(false)

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

// 计算属性
const taskStats = computed(() => {
  const stats = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    total: tasks.value.length,
    is_all_done: false,
    total_time: 0,
  }

  tasks.value.forEach((task) => {
    if (task.done) {
      stats.completed++
    } else {
      stats.pending++
    }
  })

  stats.is_all_done = stats.completed === stats.total && stats.total > 0

  return stats
})

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

// 加载任务列表
const loadTasks = async () => {
  try {
    loading.value = true
    // TODO: 替换为实际API调用
    // const response = await taskApi.getTasks()

    // 模拟数据
    tasks.value = [
      {
        id: '1',
        details: '建立营地，建造基础庇护所和工作台',
        done_criteria: '完成基础庇护所建造，工作台可用',
        progress: '已建造工作台，正在收集木材',
        done: false,
      },
      {
        id: '2',
        details: '收集基础资源：木材和石头',
        done_criteria: '物品栏中有足够的木材和石头',
        progress: '已完成',
        done: true,
      },
      {
        id: '3',
        details: '挖到16个钻石并存储',
        done_criteria: '获得16个钻石并安全存储',
        progress: '已找到钻石矿，正在挖掘',
        done: false,
      },
    ]
  } catch (error) {
    ElMessage.error('加载任务列表失败')
    console.error(error)
  } finally {
    loading.value = false
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

    // TODO: 替换为实际API调用
    // await taskApi.deleteTask(task.id)

    // 模拟删除
    const index = tasks.value.findIndex((t) => t.id === task.id)
    if (index >= 0) {
      tasks.value.splice(index, 1)
      ElMessage.success('任务删除成功')
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

    // TODO: 替换为实际API调用
    // await taskApi.clearAllTasks()

    // 模拟清空
    tasks.value = []
    ElMessage.success('所有任务已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空任务失败')
      console.error(error)
    }
  }
}

// 保存任务（创建或更新）
const saveTask = async () => {
  try {
    saving.value = true

    if (editingTask.value) {
      // 更新任务
      // TODO: 替换为实际API调用
      // await taskApi.updateTask(editingTask.value.id, taskForm)

      // 模拟更新
      Object.assign(editingTask.value, taskForm)
      ElMessage.success('任务更新成功')
    } else {
      // 创建任务
      // TODO: 替换为实际API调用
      // const newTask = await taskApi.createTask(taskForm)

      // 模拟创建
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskForm,
      }
      tasks.value.push(newTask)
      ElMessage.success('任务创建成功')
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

    // TODO: 替换为实际API调用
    // await taskApi.updateTaskStatus(task.id, !task.done)

    // 模拟更新
    task.done = !task.done
    ElMessage.success(`任务已${task.done ? '完成' : '标记为待处理'}`)
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

    if (batchForm.operation === 'complete') {
      // 批量完成
      // TODO: 替换为实际API调用
      // await taskApi.batchCompleteTasks(batchForm.selectedTasks)

      // 模拟批量完成
      batchForm.selectedTasks.forEach((taskId) => {
        const task = tasks.value.find((t) => t.id === taskId)
        if (task) {
          task.done = true
        }
      })
      ElMessage.success(`已完成 ${batchForm.selectedTasks.length} 个任务`)
    } else if (batchForm.operation === 'delete') {
      // 批量删除
      // TODO: 替换为实际API调用
      // await taskApi.batchDeleteTasks(batchForm.selectedTasks)

      // 模拟批量删除
      tasks.value = tasks.value.filter((t) => !batchForm.selectedTasks.includes(t.id))
      ElMessage.success(`已删除 ${batchForm.selectedTasks.length} 个任务`)
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

// 组件挂载时加载数据
onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-manager-page {
  padding: 20px;
  max-width: 1400px;
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

.stats-section {
  margin-bottom: 24px;
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
