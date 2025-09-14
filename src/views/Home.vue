<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">欢迎使用 MaiCraft Web UI</h1>
        <p class="welcome-description">这是一个用于管理和监控Minecraft服务器的现代化Web界面</p>
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

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h2>快速操作</h2>
      <div class="action-buttons">
        <el-button type="primary" icon="VideoPlay" size="large"> 启动服务器 </el-button>
        <el-button type="success" icon="Refresh" size="large"> 重启服务器 </el-button>
        <el-button type="warning" icon="VideoPause" size="large"> 停止服务器 </el-button>
        <el-button type="info" icon="Setting" size="large"> 服务器设置 </el-button>
      </div>
    </div>

    <!-- 系统状态 -->
    <div class="status-overview">
      <h2>系统状态</h2>
      <div class="status-cards">
        <div class="status-card">
          <div class="status-header">
            <el-icon class="status-icon"><Monitor /></el-icon>
            <span>服务器状态</span>
          </div>
          <div class="status-value">
            <el-tag type="success">运行中</el-tag>
          </div>
        </div>
        <div class="status-card">
          <div class="status-header">
            <el-icon class="status-icon"><User /></el-icon>
            <span>在线玩家</span>
          </div>
          <div class="status-value">
            <span class="player-count">0</span>
          </div>
        </div>
        <div class="status-card">
          <div class="status-header">
            <el-icon class="status-icon"><Operation /></el-icon>
            <span>CPU使用率</span>
          </div>
          <div class="status-value">
            <span class="cpu-usage">15%</span>
          </div>
        </div>
        <div class="status-card">
          <div class="status-header">
            <el-icon class="status-icon"><Files /></el-icon>
            <span>内存使用</span>
          </div>
          <div class="status-value">
            <span class="memory-usage">2.1GB / 8GB</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Monitor,
  Document,
  Setting,
  VideoPlay,
  Refresh,
  VideoPause,
  User,
  Operation,
  Files,
} from '@element-plus/icons-vue'
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

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.quick-actions h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.action-buttons .el-button {
  height: 50px;
  font-size: 16px;
  font-weight: 500;
}

.status-overview {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.status-overview h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.status-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: box-shadow 0.3s ease;
}

.status-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-icon {
  font-size: 24px;
  color: #409eff;
}

.status-header span {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.status-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.player-count {
  color: #52c41a;
}

.cpu-usage {
  color: #409eff;
}

.memory-usage {
  color: #faad14;
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

  .action-buttons {
    grid-template-columns: 1fr;
  }

  .status-cards {
    grid-template-columns: 1fr;
  }
}
</style>
