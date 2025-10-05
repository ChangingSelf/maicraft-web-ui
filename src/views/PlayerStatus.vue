<template>
  <div class="player-status">
    <PageHeader title="玩家状态">
      <template #actions>
        <ConnectionStatus
          :is-connected="isConnected"
          :connecting="connecting"
          :disconnecting="disconnecting"
          @connect="connect"
          @disconnect="disconnect"
        />
      </template>
    </PageHeader>

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
            <div class="item-value">{{ player.name || '未知' }}</div>
          </div>
          <div class="basic-item">
            <div class="item-label">游戏模式</div>
            <div class="item-value">{{ player.gamemode || '未知' }}</div>
          </div>
          <div class="basic-item">
            <div class="item-label">经验等级</div>
            <div class="item-value">{{ player.level || 0 }}</div>
          </div>
          <div class="basic-item">
            <div class="item-label">经验值</div>
            <div class="item-value">{{ player.experience || 0 }}</div>
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
                >{{ player.health || 0 }}/{{ player.max_health || 20 }}</span
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
              <span class="health-text">{{ player.food || 0 }}/{{ player.max_food || 20 }}</span>
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
              <span class="coord-value">{{ player.position?.x?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Y:</span>
              <span class="coord-value">{{ player.position?.y?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Z:</span>
              <span class="coord-value">{{ player.position?.z?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>
          <div class="orientation">
            <div class="orient-item">
              <span class="orient-label">偏航角:</span>
              <span class="orient-value">{{ player.position?.yaw?.toFixed(1) || '0.0' }}°</span>
            </div>
            <div class="orient-item">
              <span class="orient-label">俯仰角:</span>
              <span class="orient-value">{{ player.position?.pitch?.toFixed(1) || '0.0' }}°</span>
            </div>
            <div class="orient-item">
              <span class="orient-label">接地状态:</span>
              <span class="orient-value">{{ player.position?.on_ground ? '是' : '否' }}</span>
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
              <div v-if="player.equipment?.main_hand" class="equip-info">
                <div class="equip-name">{{ player.equipment.main_hand.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ player.equipment.main_hand.count }}</span>
                  <span v-if="player.equipment.main_hand.damage"
                    >耐久: {{ player.equipment.main_hand.damage }}/{{
                      player.equipment.main_hand.max_damage
                    }}</span
                  >
                </div>
                <el-progress
                  v-if="player.equipment.main_hand.max_damage"
                  :percentage="getDurabilityPercentage(player.equipment.main_hand)"
                  :stroke-width="6"
                  :color="getDurabilityColor(player.equipment.main_hand)"
                  :show-text="false"
                />
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>

          <div class="equipment-item">
            <div class="equip-slot">头盔</div>
            <div class="equip-content">
              <div v-if="player.equipment?.helmet" class="equip-info">
                <div class="equip-name">{{ player.equipment.helmet.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ player.equipment.helmet.count }}</span>
                  <span v-if="player.equipment.helmet.damage"
                    >耐久: {{ player.equipment.helmet.damage }}/{{
                      player.equipment.helmet.max_damage
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
              <div v-if="player.equipment?.chestplate" class="equip-info">
                <div class="equip-name">{{ player.equipment.chestplate.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ player.equipment.chestplate.count }}</span>
                </div>
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>

          <div class="equipment-item">
            <div class="equip-slot">护腿</div>
            <div class="equip-content">
              <div v-if="player.equipment?.leggings" class="equip-info">
                <div class="equip-name">{{ player.equipment.leggings.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ player.equipment.leggings.count }}</span>
                </div>
              </div>
              <div v-else class="equip-empty">空</div>
            </div>
          </div>

          <div class="equipment-item">
            <div class="equip-slot">靴子</div>
            <div class="equip-content">
              <div v-if="player.equipment?.boots" class="equip-info">
                <div class="equip-name">{{ player.equipment.boots.display_name }}</div>
                <div class="equip-details">
                  <span>数量: {{ player.equipment.boots.count }}</span>
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
              >物品栏 ({{ player.inventory?.occupied_slots || 0 }}/{{
                player.inventory?.total_slots || 36
              }})</span
            >
          </div>
        </template>
        <div v-if="player.inventory?.items?.length > 0" class="inventory-grid">
          <el-card
            v-for="item in player.inventory.items"
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Location, Box, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { PageHeader, ConnectionStatus } from '@/components/common'
import {
  getWebSocketManager,
  connectPlayerWS,
  disconnectPlayerWS,
  subscribePlayerWS,
} from '../services/websocket'
import { reactive } from 'vue'
import { useWebSocketDataStore } from '../stores/websocketData'
import {
  getGlobalConnectionStatus,
  connectSingleEndpoint,
  disconnectSingleEndpoint,
} from '../services/globalWebSocketService'

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

// 使用全局WebSocket数据存储
const store = useWebSocketDataStore()
const { player } = store
const globalConnectionStatus = getGlobalConnectionStatus()

// 玩家数据计算属性（保持兼容性）
const playerComputed = computed(() => player)

// WebSocket管理器
const playerWSManager = getWebSocketManager('PLAYER')

// 连接状态（使用全局状态）
const isConnected = computed(() => globalConnectionStatus.connectionStatus.PLAYER || false)

// 连接中和断开中状态
const connecting = ref(false)
const disconnecting = ref(false)

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

// 连接WebSocket（使用全局连接管理）
const connect = async () => {
  try {
    connecting.value = true
    await connectSingleEndpoint('PLAYER')
  } catch (error) {
    console.error('连接失败:', error)
  } finally {
    connecting.value = false
  }
}

// 断开WebSocket（使用全局连接管理）
const disconnect = () => {
  try {
    disconnecting.value = true
    disconnectSingleEndpoint('PLAYER')
  } catch (error) {
    console.error('断开连接失败:', error)
  } finally {
    disconnecting.value = false
  }
}

// 获取生命值百分比
const getHealthPercentage = () => {
  if (!player?.health || !player?.max_health) return 0
  const health = Number(player.health)
  const maxHealth = Number(player.max_health)
  if (maxHealth <= 0) return 0
  const percentage = (health / maxHealth) * 100
  return Math.max(0, Math.min(100, percentage)) // 确保在 0-100 范围内
}

// 获取饥饿值百分比
const getFoodPercentage = () => {
  if (!player?.food || !player?.max_food) return 0
  const food = Number(player.food)
  const maxFood = Number(player.max_food)
  if (maxFood <= 0) return 0
  const percentage = (food / maxFood) * 100
  return Math.max(0, Math.min(100, percentage)) // 确保在 0-100 范围内
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
  if (!item?.damage || !item?.max_damage) return 100
  const maxDamage = Number(item.max_damage)
  const damage = Number(item.damage)
  if (maxDamage <= 0) return 100
  const percentage = ((maxDamage - damage) / maxDamage) * 100
  return Math.max(0, Math.min(100, percentage)) // 确保在 0-100 范围内
}

// 获取耐久度颜色
const getDurabilityColor = (item: any) => {
  const percentage = getDurabilityPercentage(item)
  if (percentage > 60) return '#67C23A'
  if (percentage > 30) return '#E6A23C'
  return '#F56C6C'
}

// 消息处理器（现在数据由全局状态管理，这里只处理心跳）
const handlePlayerMessage = (message: any) => {
  if (message.type === 'pong') {
    console.log('[PlayerStatus] Heartbeat received')
  }
  // 玩家数据更新现在由全局状态管理处理
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
@import '@/styles/common.css';

.player-status {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 页面头部样式已移至通用样式文件 */

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

/* 卡片头部样式已移至通用样式文件 */

/* 基本网格和项目样式已移至通用样式文件 */

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
