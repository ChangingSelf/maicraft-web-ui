<template>
  <div class="world-info">
    <div class="page-header">
      <h2>世界信息</h2>
      <div class="header-actions">
        <el-button type="primary" @click="connect" v-if="!isConnected">
          <el-icon><VideoPlay /></el-icon>
          连接
        </el-button>
        <el-button type="danger" @click="disconnect" v-else>
          <el-icon><VideoPause /></el-icon>
          断开
        </el-button>
        <el-tag :type="connectionStatus.type" size="large">
          <el-icon><component :is="connectionStatus.icon" /></el-icon>
          {{ connectionStatus.text }}
        </el-tag>
      </div>
    </div>

    <div class="world-content">
      <!-- 世界概览 -->
      <el-card class="world-overview" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><House /></el-icon>
            <span>世界概览</span>
          </div>
        </template>
        <div class="overview-grid">
          <div class="overview-item">
            <div class="item-label">时间</div>
            <div class="item-value">{{ worldData.time?.formatted_time || '未知' }}</div>
          </div>
          <div class="overview-item">
            <div class="item-label">天气</div>
            <div class="item-value">{{ worldData.weather?.formatted_weather || '未知' }}</div>
          </div>
          <div class="overview-item">
            <div class="item-label">维度</div>
            <div class="item-value">{{ worldData.location?.dimension || '未知' }}</div>
          </div>
          <div class="overview-item">
            <div class="item-label">生物群系</div>
            <div class="item-value">{{ worldData.location?.biome || '未知' }}</div>
          </div>
          <div class="overview-item">
            <div class="item-label">光照等级</div>
            <div class="item-value">{{ worldData.location?.light_level || '未知' }}</div>
          </div>
          <div class="overview-item">
            <div class="item-label">游戏天数</div>
            <div class="item-value">{{ worldData.time?.day_count || '未知' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 附近方块 -->
      <el-card class="nearby-blocks" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Box /></el-icon>
            <span>附近方块 ({{ nearbyBlocks.length }})</span>
          </div>
        </template>
        <div v-if="nearbyBlocks.length > 0" class="blocks-grid">
          <el-card
            v-for="(block, index) in nearbyBlocks"
            :key="index"
            class="block-item"
            size="small"
          >
            <div class="block-info">
              <div class="block-name">{{ block.name }}</div>
              <div class="block-position">
                ({{ block.position.x }}, {{ block.position.y }}, {{ block.position.z }})
              </div>
              <div class="block-distance">{{ block.distance.toFixed(1) }}m</div>
            </div>
          </el-card>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无附近方块信息"></el-empty>
        </div>
      </el-card>

      <!-- 附近实体 -->
      <el-card class="nearby-entities" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Share /></el-icon>
            <span>附近实体 ({{ nearbyEntities.length }})</span>
          </div>
        </template>
        <div v-if="nearbyEntities.length > 0" class="entities-grid">
          <el-card
            v-for="(entity, index) in nearbyEntities"
            :key="index"
            class="entity-item"
            size="small"
          >
            <div class="entity-info">
              <div class="entity-name">{{ entity.display_name }}</div>
              <div class="entity-type">{{ entity.type }}</div>
              <div class="entity-health">
                <el-progress
                  :percentage="(entity.health / entity.max_health) * 100"
                  :show-text="false"
                  :stroke-width="4"
                  :color="getHealthColor(entity.health, entity.max_health)"
                />
                <span>{{ entity.health }}/{{ entity.max_health }}</span>
              </div>
              <div class="entity-distance">{{ entity.distance.toFixed(1) }}m</div>
            </div>
          </el-card>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无附近实体信息"></el-empty>
        </div>
      </el-card>
    </div>

    <!-- WebSocket连接状态显示在页面头部 -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay,
  VideoPause,
  House,
  Box,
  Share,
  CircleCheck,
  CircleClose,
} from '@element-plus/icons-vue'
import {
  getWebSocketManager,
  connectWorldWS,
  disconnectWorldWS,
  subscribeWorldWS,
} from '../services/websocket'
import { reactive } from 'vue'

// 本地世界数据存储
const worldDataStore = reactive({
  time: {
    time_of_day: 0,
    formatted_time: '',
    day_count: 0,
  },
  weather: {
    weather: '',
    formatted_weather: '',
    duration: 0,
  },
  location: {
    dimension: '',
    biome: '',
    light_level: 0,
  },
  nearby_blocks: [],
  nearby_entities: [],
})

// WebSocket管理器
const worldWSManager = getWebSocketManager('WORLD')

// 连接状态
const isConnected = computed(() => worldWSManager.isConnected)

// 世界数据
const worldData = computed(() => worldDataStore)
const nearbyBlocks = computed(() => worldDataStore.nearby_blocks || [])
const nearbyEntities = computed(() => worldDataStore.nearby_entities || [])

// 连接状态显示
const connectionStatus = computed(() => {
  if (isConnected.value) {
    return {
      type: 'success' as const,
      icon: CircleCheck,
      text: '已连接',
    }
  } else {
    return {
      type: 'danger' as const,
      icon: CircleClose,
      text: '未连接',
    }
  }
})

// 连接WebSocket
const connect = () => {
  connectWorldWS()
  ElMessage.success('正在连接世界数据...')
}

// 断开WebSocket
const disconnect = () => {
  disconnectWorldWS()
  ElMessage.info('已断开连接')
}

// 获取健康状态颜色
const getHealthColor = (health: number, maxHealth: number) => {
  const percentage = health / maxHealth
  if (percentage > 0.6) return '#67C23A'
  if (percentage > 0.3) return '#E6A23C'
  return '#F56C6C'
}

// 消息处理器
const handleWorldMessage = (message: any) => {
  if (message.type === 'world_update') {
    // 更新世界数据
    Object.assign(worldDataStore, message.data)
  } else if (message.type === 'pong') {
    console.log('[WorldInfo] Heartbeat received')
  }
}

// 连接状态变化处理
const handleConnectionChange = (connected: boolean) => {
  if (connected) {
    subscribeWorldWS(2000) // 2秒更新一次
    ElMessage.success('世界数据连接成功')
  } else {
    ElMessage.warning('世界数据连接断开')
  }
}

// 组件挂载和卸载
onMounted(() => {
  // 添加消息处理器
  worldWSManager.addMessageHandler(handleWorldMessage)
  // 添加连接状态监听器
  worldWSManager.addConnectionHandler(handleConnectionChange)
})

onUnmounted(() => {
  // 移除消息处理器
  worldWSManager.removeMessageHandler(handleWorldMessage)
  // 移除连接状态监听器
  worldWSManager.removeConnectionHandler(handleConnectionChange)
  // 断开连接
  disconnectWorldWS()
})
</script>

<style scoped>
.world-info {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.world-content {
  display: grid;
  gap: 20px;
}

.world-overview {
  background: white;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.overview-item {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.item-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.item-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.nearby-blocks,
.nearby-entities {
  background: white;
}

.blocks-grid,
.entities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.block-item,
.entity-item {
  background: #fafafa;
  border: 1px solid #e6e6e6;
}

.block-info,
.entity-info {
  text-align: center;
}

.block-name,
.entity-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.block-position {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.block-distance,
.entity-distance {
  font-size: 12px;
  color: #999;
}

.entity-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  text-transform: capitalize;
}

.entity-health {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.entity-health span {
  font-size: 12px;
  color: #666;
}

.empty-state {
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .blocks-grid,
  .entities-grid {
    grid-template-columns: 1fr;
  }
}
</style>
