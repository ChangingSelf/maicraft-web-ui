<template>
  <LogViewerComponent
    title="MCP Server 日志查看器"
    ws-url="ws://localhost:209145/ws/mcp-logs"
    :max-logs="1000"
    :auto-scroll="true"
  />
</template>

<script setup lang="ts">
import LogViewerComponent from '@/components/LogViewerComponent.vue'

// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'MCPServerLogViewer',
})
</script>

<style scoped>
/* 页面特定的样式可以在这里添加 */
</style>
