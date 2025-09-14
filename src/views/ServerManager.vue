<template>
  <div class="server-manager">
    <div class="page-header">
      <h1>服务器管理</h1>
      <p>管理您的Minecraft服务器</p>
    </div>
    <div class="coming-soon">
      <el-empty description="功能开发中，敬请期待..." />
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，供keep-alive识别
defineOptions({
  name: 'ServerManager',
})

// 占位组件
</script>

<style scoped>
.server-manager {
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
