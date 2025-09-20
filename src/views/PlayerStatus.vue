<template>
  <div class="player-status">
    <div class="page-header">
      <h2>玩家状态</h2>
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

    <div class="player-content">
      <!-- 玩家基本信息 -->
      <el-card class="player-basic" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>玩家信息</span>
          </div>
        </template>
        <div class="basic-grid">
          <div class="basic-item">
            <div class="item-label">玩家名称</div>
            <div class="item-value">{{ playerData.name || '未知' }}</div>
          </div>
          <div class="basic-item">
            <div class="item-label">游戏模式</div>
            <div class="item-value">{{ playerData.gamemode || '未知' }}</div>
          </div>
          <div class="basic-item">
            <div class="item-label">经验等级</div>
            <div class="item-value">{{ playerData.level || 0 }}</div>
          </div>
          <div class="basic-item">
            <div class="item-label">经验值</div>
            <div class="item-value">{{ playerData.experience || 0 }}</div>
          </div>
        </div>
      </el-card>

      <!-- 生命值和饥饿值 -->
      <el-card class="player-health" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Heart /></el-icon>
            <span>生命状态</span>
          </div>
        </template>
        <div class="health-grid">
          <div class="health-item">
            <div class="health-label">
              <span>生命值</span>
              <span class="health-text"
                >{{ playerData.health || 0 }}/{{ playerData.max_health || 20 }}</span
              >
            </div>
            <el-progress
              :percentage="getHealthPercentage()"
              :stroke-width="12"
              :color="getHealthColor()"
              :show-text="false"
            />
          </div>
          <div class="health-item">
            <div class="health-label">
              <span>饥饿值</span>
              <span class="health-text"
                >{{ playerData.food || 0 }}/{{ playerData.max_food || 20 }}</span
              >
            </div>
            <el-progress
              :percentage="getFoodPercentage()"
              :stroke-width="12"
              :color="getFoodColor()"
              :show-text="false"
            />
          </div>
        </div>
      </el-card>

      <!-- 位置信息 -->
      <el-card class="player-position" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Location /></el-icon>
            <span>位置信息</span>
          </div>
        </template>
        <div class="position-info">
          <div class="coordinates">
            <div class="coord-item">
              <span class="coord-label">X:</span>
              <span class="coord-value">{{ playerData.position?.x?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Y:</span>
              <span class="coord-value">{{ playerData.position?.y?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Z:</span>
              <span class="coord-value">{{ playerData.position?.z?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>
          <div class="orientation">
            <div class="orient-item">
              <span class="orient-label">偏航角:</span>
              <span class="orient-value">{{ playerData.position?.yaw?.toFixed(1) || '0.0' }}°</span>
            </div>
            <div class="orient-item">
              <span class="orient-label">俯仰角:</span>
              <span class="orient-value"
                >{{ playerData.position?.pitch?.toFixed(1) || '0.0' }}°</span
              >
            </div>
            <div class="orient-item">
              <span class="orient-label">接地状态:</span>
              <span class="orient-value">{{ playerData.position?.on_ground ? '是' : '否' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 装备信息 -->
      <el-card class="player-equipment" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Shield /></el-icon>
            <span>装备信息</span>
          </div>
        </template>
        <div class="equipment-grid">
          <div class="equipment-item">
            <div class="equip-slot">主手</div>
            <div class="equip-content">
              <div v-if="playerData.equipment?.main_hand" class="equip-info">
                <div class="equip-name">{{ playerData.equipment.main_hand.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ playerData.equipment.main_hand.count }}</span>
                  <span v-if="playerData.equipment.main_hand.damage"
                    >耐久: {{ playerData.equipment.main_hand.damage }}/{{
                      playerData.equipment.main_hand.max_damage
                    }}</span
                  >
                </div>
                <el-progress
                  v-if="playerData.equipment.main_hand.max_damage"
                  :percentage="getDurabilityPercentage(playerData.equipment.main_hand)"
                  :stroke-width="6"
                  :color="getDurabilityColor(playerData.equipment.main_hand)"
                  :show-text="false"
                />
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>

          <div class="equipment-item">
            <div class="equip-slot">头盔</div>
            <div class="equip-content">
              <div v-if="playerData.equipment?.helmet" class="equip-info">
                <div class="equip-name">{{ playerData.equipment.helmet.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ playerData.equipment.helmet.count }}</span>
                  <span v-if="playerData.equipment.helmet.damage"
                    >耐久: {{ playerData.equipment.helmet.damage }}/{{
                      playerData.equipment.helmet.max_damage
                    }}</span
                  >
                </div>
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>

          <div class="equipment-item">
            <div class="equip-slot">胸甲</div>
            <div class="equip-content">
              <div v-if="playerData.equipment?.chestplate" class="equip-info">
                <div class="equip-name">{{ playerData.equipment.chestplate.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ playerData.equipment.chestplate.count }}</span>
                </div>
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>

          <div class="equipment-item">
            <div class="equip-slot">护腿</div>
            <div class="equip-content">
              <div v-if="playerData.equipment?.leggings" class="equip-info">
                <div class="equip-name">{{ playerData.equipment.leggings.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ playerData.equipment.leggings.count }}</span>
                </div>
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>

          <div class="equipment-item">
            <div class="equip-slot">靴子</div>
            <div class="equip-content">
              <div v-if="playerData.equipment?.boots" class="equip-info">
                <div class="equip-name">{{ playerData.equipment.boots.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ playerData.equipment.boots.count }}</span>
                </div>
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 物品栏信息 -->
      <el-card class="player-inventory" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Box /></el-icon>
            <span
              >物品栏 ({{ playerData.inventory?.occupied_slots || 0 }}/{{
                playerData.inventory?.total_slots || 36
              }})</span
            >
          </div>
        </template>
        <div v-if="playerData.inventory?.items?.length > 0" class="inventory-grid">
          <el-card
            v-for="item in playerData.inventory.items"
            :key="item.slot"
            class="inventory-item"
            size="small"
          >
            <div class="item-info">
              <div class="item-name">{{ item.display_name }}</div>
              <div class="item-details">
                <span>槽位: {{ item.slot }}</span>
                <span>数量: {{ item.count }}</span>
                <span v-if="item.damage">耐久: {{ item.damage }}/{{ item.max_damage }}</span>
              </div>
              <el-progress
                v-if="item.max_damage"
                :percentage="getDurabilityPercentage(item)"
                :stroke-width="4"
                :color="getDurabilityColor(item)"
                :show-text="false"
              />
            </div>
          </el-card>
        </div>
        <div v-else class="empty-state">
          <el-empty description="物品栏为空"></el-empty>
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
  User,
  Location,
  Box,
  CircleCheck,
  CircleClose,
} from '@element-plus/icons-vue'
import {
  getWebSocketManager,
  connectPlayerWS,
  disconnectPlayerWS,
  subscribePlayerWS,
} from '../services/websocket'
import { reactive } from 'vue'

// 装备物品类型定义
interface EquipmentItem {
  display_name: string
  count: number
  damage: number
  max_damage: number
}

// 背包物品类型定义
interface InventoryItem {
  slot: number
  display_name: string
  count: number
  damage: number
  max_damage: number
}

// 本地玩家数据存储
const playerDataStore = reactive({
  name: '',
  health: 0,
  max_health: 0,
  food: 0,
  max_food: 0,
  experience: 0,
  level: 0,
  gamemode: '',
  position: {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    pitch: 0,
    on_ground: true,
  },
  equipment: {
    main_hand: null as EquipmentItem | null,
    helmet: null as EquipmentItem | null,
    chestplate: null as EquipmentItem | null,
    leggings: null as EquipmentItem | null,
    boots: null as EquipmentItem | null,
  },
  inventory: {
    occupied_slots: 0,
    total_slots: 0,
    empty_slots: 0,
    items: [] as InventoryItem[],
  },
})

// 玩家数据计算属性
const playerData = computed(() => playerDataStore)

// WebSocket管理器
const playerWSManager = getWebSocketManager('PLAYER')

// 连接状态
const isConnected = computed(() => playerWSManager.isConnected)

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
  connectPlayerWS()
  ElMessage.success('正在连接玩家数据...')
}

// 断开WebSocket
const disconnect = () => {
  disconnectPlayerWS()
  ElMessage.info('已断开连接')
}

// 获取生命值百分比
const getHealthPercentage = () => {
  if (!playerDataStore.health || !playerDataStore.max_health) return 0
  return (playerDataStore.health / playerDataStore.max_health) * 100
}

// 获取饥饿值百分比
const getFoodPercentage = () => {
  if (!playerDataStore.food || !playerDataStore.max_food) return 0
  return (playerDataStore.food / playerDataStore.max_food) * 100
}

// 获取生命值颜色
const getHealthColor = () => {
  const percentage = getHealthPercentage()
  if (percentage > 60) return '#67C23A'
  if (percentage > 30) return '#E6A23C'
  return '#F56C6C'
}

// 获取饥饿值颜色
const getFoodColor = () => {
  const percentage = getFoodPercentage()
  if (percentage > 60) return '#67C23A'
  if (percentage > 30) return '#E6A23C'
  return '#F56C6C'
}

// 获取耐久度百分比
const getDurabilityPercentage = (item: any) => {
  if (!item.damage || !item.max_damage) return 100
  return ((item.max_damage - item.damage) / item.max_damage) * 100
}

// 获取耐久度颜色
const getDurabilityColor = (item: any) => {
  const percentage = getDurabilityPercentage(item)
  if (percentage > 60) return '#67C23A'
  if (percentage > 30) return '#E6A23C'
  return '#F56C6C'
}

// 消息处理器
const handlePlayerMessage = (message: any) => {
  if (message.type === 'player_update') {
    // 更新玩家数据
    Object.assign(playerDataStore, message.data)
  } else if (message.type === 'pong') {
    console.log('[PlayerStatus] Heartbeat received')
  }
}

// 连接状态变化处理
const handleConnectionChange = (connected: boolean) => {
  if (connected) {
    subscribePlayerWS(500) // 500ms高频更新
    ElMessage.success('玩家数据连接成功')
  } else {
    ElMessage.warning('玩家数据连接断开')
  }
}

// 组件挂载和卸载
onMounted(() => {
  // 添加消息处理器
  playerWSManager.addMessageHandler(handlePlayerMessage)
  // 添加连接状态监听器
  playerWSManager.addConnectionHandler(handleConnectionChange)
})

onUnmounted(() => {
  // 移除消息处理器
  playerWSManager.removeMessageHandler(handlePlayerMessage)
  // 移除连接状态监听器
  playerWSManager.removeConnectionHandler(handleConnectionChange)
  // 断开连接
  disconnectPlayerWS()
})
</script>

<style scoped>
.player-status {
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

.player-content {
  display: grid;
  gap: 20px;
}

.player-basic,
.player-health,
.player-position,
.player-equipment,
.player-inventory {
  background: white;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.basic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.basic-item {
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

.health-grid {
  display: grid;
  gap: 20px;
}

.health-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.health-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.health-text {
  font-size: 14px;
  color: #666;
}

.position-info {
  display: grid;
  gap: 20px;
}

.coordinates,
.orientation {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.coord-item,
.orient-item {
  text-align: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
  min-width: 80px;
}

.coord-label,
.orient-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.coord-value,
.orient-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.equipment-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.equip-slot {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  text-align: center;
}

.equip-content {
  text-align: center;
}

.equip-info {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e6e6e6;
}

.equip-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.equip-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.equip-empty {
  padding: 20px;
  color: #999;
  font-style: italic;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.inventory-item {
  background: #fafafa;
  border: 1px solid #e6e6e6;
}

.item-info {
  padding: 12px;
}

.item-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
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

  .basic-grid,
  .equipment-grid,
  .inventory-grid {
    grid-template-columns: 1fr;
  }

  .coordinates,
  .orientation {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
