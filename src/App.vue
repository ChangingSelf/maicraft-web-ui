<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

// 动态决定要缓存的组件
const cachedComponents = computed(() => {
  // 需要保持状态的组件（WebSocket连接、复杂表单等）
  const componentsToCache = [
    'LogViewer', // 日志查看器 - 需要保持WebSocket连接
    'EventViewer', // 事件查看器 - 实时事件数据
    'Monitoring', // 系统监控 - 监控数据状态
    'MCPTools', // MCP工具管理 - 工具状态和配置
  ]

  // 可以在这里添加动态条件
  // 例如：根据用户权限、路由参数等决定是否缓存某些组件

  return componentsToCache
})

// 获取当前路由组件名（用于调试或条件判断）
const currentRouteName = computed(() => {
  // 这里可以根据需要获取当前路由信息
  return ''
})

// 调试keep-alive是否工作
const handleRouteChange = () => {
  console.log('路由切换，缓存组件列表:', cachedComponents.value)
}
</script>

<template>
  <el-container class="app-container">
    <Sidebar />
    <el-main class="main-content">
      <RouterView v-slot="{ Component }">
        <keep-alive :include="cachedComponents">
          <component :is="Component" />
        </keep-alive>
      </RouterView>
    </el-main>
  </el-container>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  font-family:
    'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑',
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  height: 100vh;
  overflow: hidden;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Element Plus 样式覆盖 */
.el-button {
  font-weight: 500;
}

.el-dialog {
  border-radius: 8px;
}

.el-message {
  border-radius: 8px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
