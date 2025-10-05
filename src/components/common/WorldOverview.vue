<template>
  <!-- 世界概览紧凑显示组件 -->
  <div class="world-overview-compact">
    <!-- 第一行：时间和天气 -->
    <div class="world-row">
      <div class="world-item">
        <span class="world-label">时间:</span>
        <span class="world-value">{{ world.time?.formatted_time || '未知' }}</span>
      </div>
      <div class="world-item">
        <span class="world-label">天气:</span>
        <span class="world-value">{{ world.weather?.formatted_weather || '未知' }}</span>
      </div>
    </div>

    <!-- 第二行：维度和生物群系 -->
    <div class="world-row">
      <div class="world-item">
        <span class="world-label">维度:</span>
        <span class="world-value">{{ world.location?.dimension || '未知' }}</span>
      </div>
      <div class="world-item">
        <span class="world-label">生物群系:</span>
        <span class="world-value">{{ world.location?.biome || '未知' }}</span>
      </div>
    </div>

    <!-- 第三行：光照等级和游戏天数 -->
    <div class="world-row">
      <div class="world-item">
        <span class="world-label">光照等级:</span>
        <span class="world-value">{{ world.location?.light_level || '未知' }}</span>
      </div>
      <div class="world-item">
        <span class="world-label">游戏天数:</span>
        <span class="world-value">{{ world.time?.day_count || '未知' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWebSocketDataStore } from '../../stores/websocketData'

// 使用全局WebSocket数据存储
const store = useWebSocketDataStore()
const { world } = store
</script>

<style scoped>
.world-overview-compact {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.world-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.world-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.world-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  min-width: 60px;
}

.world-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .world-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .world-item {
    padding: 6px 10px;
  }

  .world-label {
    min-width: auto;
    font-size: 12px;
  }

  .world-value {
    font-size: 13px;
  }
}
</style>
