<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

// 不需要缓存的组件（黑名单机制）
const excludedComponents = computed(() => {
  // 不需要保持状态的组件（静态页面、简单表单等）
  const componentsToExclude = [
    'Home', // 主页 - 通常是静态的欢迎页面
    'Settings', // 设置页面 - 如果不需要保持表单状态
    'Changelog', // 版本信息页面 - 通常是静态内容
  ]

  // 可以在这里添加动态条件
  // 例如：根据路由参数、用户偏好等决定是否排除某些组件

  return componentsToExclude
})

// 获取当前路由组件名（用于调试或条件判断）
const currentRouteName = computed(() => {
  // 这里可以根据需要获取当前路由信息
  return ''
})

// 调试keep-alive是否工作
const handleRouteChange = () => {
  console.log('路由切换，不缓存组件列表:', excludedComponents.value)
}
</script>

<template>
  <el-container class="app-container">
    <Sidebar />
    <el-main class="main-content">
      <RouterView v-slot="{ Component }">
        <keep-alive :exclude="excludedComponents">
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
