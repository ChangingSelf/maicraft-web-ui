<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">欢迎使用 Maicraft Web UI</h1>
        <p class="welcome-description">这是一个用于管理和监控Maicraft Agent的Web界面</p>
        <div class="feature-cards">
          <div class="feature-card">
            <el-icon class="feature-icon"><Monitor /></el-icon>
            <h3>实时监控</h3>
            <p>实时查看服务器状态和性能指标</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><Document /></el-icon>
            <h3>日志查看</h3>
            <p>实时查看和筛选服务器日志信息</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><Setting /></el-icon>
            <h3>配置管理</h3>
            <p>便捷的服务器配置和插件管理</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor, Document, Setting } from '@element-plus/icons-vue'
</script>

<style scoped>
.home {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 30px;
  overflow: hidden;
}

.welcome-content {
  padding: 60px 40px;
  color: white;
  text-align: center;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.welcome-description {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 30px 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.feature-card p {
  opacity: 0.8;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .welcome-content {
    padding: 40px 20px;
  }

  .welcome-title {
    font-size: 28px;
  }

  .welcome-description {
    font-size: 16px;
  }

  .feature-cards {
    grid-template-columns: 1fr;
  }
}
</style>
