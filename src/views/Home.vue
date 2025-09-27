<template>
  <div class="home">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">Maicraft Web UI</h1>
      <p class="page-description">选择功能模块开始使用</p>
    </div>

    <!-- 页面卡片网格 -->
    <div class="page-grid">
      <!-- 主页 -->
      <div class="page-card" @click="navigateTo('/')">
        <el-icon class="page-icon"><House /></el-icon>
        <h3>主页</h3>
        <p>欢迎页面，展示系统概览</p>
      </div>

      <!-- Agent 日志 -->
      <div class="page-card" @click="navigateTo('/logs')">
        <el-icon class="page-icon"><Document /></el-icon>
        <h3>Agent 日志</h3>
        <p>查看和管理Maicraft Agent的运行日志</p>
      </div>

      <!-- MCP Server 日志 -->
      <div class="page-card" @click="navigateTo('/mcp-logs')">
        <el-icon class="page-icon"><Document /></el-icon>
        <h3>MCP Server 日志</h3>
        <p>监控MCP服务器的详细日志信息</p>
      </div>

      <!-- 游戏状态 -->
      <div class="page-card" @click="navigateTo('/game-monitoring/world-player-dashboard')">
        <el-icon class="page-icon"><Monitor /></el-icon>
        <h3>游戏状态</h3>
        <p>实时监控游戏世界和玩家状态</p>
      </div>

      <!-- MCP 工具 -->
      <div class="page-card" @click="navigateTo('/mcp-tools')">
        <el-icon class="page-icon"><Tools /></el-icon>
        <h3>MCP 工具</h3>
        <p>管理和调用MCP协议的各种工具</p>
      </div>

      <!-- Token 监控 -->
      <div class="page-card" @click="navigateTo('/token-usage')">
        <el-icon class="page-icon"><Histogram /></el-icon>
        <h3>Token 监控</h3>
        <p>监控AI模型的Token使用量和成本</p>
      </div>

      <!-- 任务管理 -->
      <div class="page-card" @click="navigateTo('/task-manager')">
        <el-icon class="page-icon"><List /></el-icon>
        <h3>任务管理</h3>
        <p>管理和监控后台任务的执行状态</p>
      </div>

      <!-- 设置 -->
      <div class="page-card" @click="navigateTo('/settings')">
        <el-icon class="page-icon"><Setting /></el-icon>
        <h3>设置</h3>
        <p>系统配置和个性化设置</p>
      </div>

      <!-- 调试工具分组标题 -->
      <div class="debug-section-title">
        <h2>调试工具</h2>
      </div>

      <!-- WebSocket 监控 -->
      <div class="page-card debug-card" @click="navigateTo('/websocket-monitor')">
        <el-icon class="page-icon"><Monitor /></el-icon>
        <h3>WebSocket 监控</h3>
        <p>实时监控WebSocket连接状态</p>
      </div>

      <!-- WebSocket 调试 -->
      <div class="page-card debug-card" @click="navigateTo('/websocket-debugger')">
        <el-icon class="page-icon"><Monitor /></el-icon>
        <h3>WebSocket 调试</h3>
        <p>调试WebSocket消息和连接</p>
      </div>

      <!-- WebSocket 模拟器 -->
      <div class="page-card debug-card" @click="navigateTo('/websocket-simulator')">
        <el-icon class="page-icon"><Monitor /></el-icon>
        <h3>WebSocket 模拟器</h3>
        <p>模拟WebSocket数据用于测试</p>
      </div>

      <!-- 心跳测试 -->
      <div class="page-card debug-card" @click="navigateTo('/heartbeat-test')">
        <el-icon class="page-icon"><Monitor /></el-icon>
        <h3>心跳测试</h3>
        <p>测试WebSocket心跳连接稳定性</p>
      </div>
    </div>

    <!-- 项目介绍区域 -->
    <div class="projects-section">
      <div class="projects-header">
        <h2 class="projects-title">项目生态</h2>
        <p class="projects-description">了解Maicraft系列项目的整体架构</p>
      </div>

      <div class="projects-links">
        <el-tooltip content="专注于 群组聊天 的赛博网友（比较专注）多平台智能体" placement="top">
          <a href="https://github.com/MaiM-with-u/MaiBot" target="_blank" class="project-link-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>MaiBot (智能聊天)</span>
          </a>
        </el-tooltip>

        <el-tooltip
          content="Amadeus的Typo形态，MaiBot的Vtuber项目，处理弹幕、tts、stt等直播任务"
          placement="top"
        >
          <a
            href="https://github.com/MaiM-with-u/Amaidesu"
            target="_blank"
            class="project-link-item"
          >
            <el-icon><Star /></el-icon>
            <span>Amaidesu (Vtuber)</span>
          </a>
        </el-tooltip>

        <el-tooltip
          content="基于大语言模型的智能Minecraft代理系统核心项目，结合LLM、Mineflayer和Agent技术，实现自主游戏任务执行"
          placement="top"
        >
          <a
            href="https://github.com/MaiM-with-u/Maicraft"
            target="_blank"
            class="project-link-item"
          >
            <el-icon><Grid /></el-icon>
            <span>Maicraft (游戏代理)</span>
          </a>
        </el-tooltip>

        <el-tooltip
          content="MCP（Minecraft Control Protocol）服务器实现，为Web界面和外部工具提供Minecraft游戏控制接口"
          placement="top"
        >
          <a
            href="https://github.com/ChangingSelf/maicraft-mcp-server"
            target="_blank"
            class="project-link-item"
          >
            <el-icon><Tools /></el-icon>
            <span>MCP Server (游戏控制)</span>
          </a>
        </el-tooltip>

        <el-tooltip
          content="Vue.js开发的现代化Web界面，提供直观的Minecraft代理系统管理和监控功能，支持实时日志、任务管理和WebSocket调试"
          placement="top"
        >
          <a
            href="https://github.com/ChangingSelf/maicraft-web-ui"
            target="_blank"
            class="project-link-item current"
          >
            <el-icon><Monitor /></el-icon>
            <span>Web UI (调试工具)</span>
          </a>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Monitor,
  Document,
  Setting,
  House,
  Tools,
  Histogram,
  List,
  Grid,
  Link,
  ChatDotRound,
  Star,
} from '@element-plus/icons-vue'

const router = useRouter()

// 页面跳转函数
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.home {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: #f5f5f5;
}

/* 页面标题区域 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px 0;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* 项目介绍区域 */
.projects-section {
  margin-top: 60px;
  padding: 30px 20px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #e6e6e6;
}

.projects-header {
  text-align: center;
  margin-bottom: 24px;
}

.projects-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.projects-description {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 项目链接区域 */
.projects-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.project-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.project-link-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.project-link-item.current {
  border-color: #67c23a;
  background: #f0f9ff;
  color: #67c23a;
}

.project-link-item .el-icon {
  font-size: 16px;
}

/* 页面卡片网格 */
.page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面卡片样式 */
.page-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  border: 1px solid #e6e6e6;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.page-card.debug-card {
  border-color: #e6a23c;
}

.page-card.debug-card:hover {
  border-color: #e6a23c;
  box-shadow: 0 8px 25px rgba(230, 162, 60, 0.2);
}

.page-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
  display: block;
}

.debug-card .page-icon {
  color: #e6a23c;
}

.page-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.page-card p {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* 调试工具分组标题 */
.debug-section-title {
  grid-column: 1 / -1;
  text-align: center;
  margin: 40px 0 20px 0;
  padding: 20px 0;
  border-top: 2px solid #e6e6e6;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-radius: 8px;
}

.debug-section-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #856404;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home {
    padding: 15px;
  }

  .page-header {
    margin-bottom: 30px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-description {
    font-size: 14px;
  }

  /* 项目介绍区域响应式 */
  .projects-section {
    margin-top: 40px;
    padding: 20px 15px;
  }

  .projects-title {
    font-size: 18px;
  }

  .projects-description {
    font-size: 13px;
  }

  .projects-links {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .project-link-item {
    padding: 10px 12px;
    font-size: 13px;
  }

  .project-link-item .el-icon {
    font-size: 14px;
  }

  .page-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-card {
    padding: 20px;
  }

  .page-icon {
    font-size: 40px;
  }

  .page-card h3 {
    font-size: 16px;
  }

  .page-card p {
    font-size: 13px;
  }

  .debug-section-title {
    margin: 30px 0 15px 0;
  }

  .debug-section-title h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .page-card {
    padding: 16px;
  }

  .page-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }

  .page-card h3 {
    font-size: 15px;
  }

  .page-card p {
    font-size: 12px;
  }
}
</style>
