<template>
  <!-- 世界与玩家状态仪表板 - 合并页面 -->
  <div class="dashboard">
    <!-- 页面头部 - 统一的连接管理 -->
    <PageHeaderWithConnection
      title="世界与玩家状态"
      :is-connected="isAnyConnected"
      :connecting="connecting"
      :disconnecting="disconnecting"
      @connect="connectAll"
      @disconnect="disconnectAll"
    />

    <!-- 主要内容区域 -->
    <div class="dashboard-content">
      <!-- 第一行：世界信息横向显示一行 -->
      <el-card class="world-info-row" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><House /></el-icon>
            <span>世界信息</span>
            <el-tag size="small" :type="worldConnectionStatus.type">
              {{ worldConnectionStatus.text }}
            </el-tag>
          </div>
        </template>
        <div class="world-info-content">
          <div class="world-info-item">
            <span class="world-info-label">时间:</span>
            <span class="world-info-value">{{ worldData.time?.formatted_time || '未知' }}</span>
          </div>
          <div class="world-info-item">
            <span class="world-info-label">天气:</span>
            <span class="world-info-value">{{
              worldData.weather?.formatted_weather || '未知'
            }}</span>
          </div>
          <div class="world-info-item">
            <span class="world-info-label">维度:</span>
            <span class="world-info-value">{{ worldData.location?.dimension || '未知' }}</span>
          </div>
          <div class="world-info-item">
            <span class="world-info-label">生物群系:</span>
            <span class="world-info-value">{{ worldData.location?.biome || '未知' }}</span>
          </div>
          <div class="world-info-item">
            <span class="world-info-label">光照等级:</span>
            <span class="world-info-value">{{ worldData.location?.light_level || '未知' }}</span>
          </div>
          <div class="world-info-item">
            <span class="world-info-label">游戏天数:</span>
            <span class="world-info-value">{{ worldData.time?.day_count || '未知' }}</span>
          </div>
        </div>
      </el-card>

      <!-- 第二行：左侧玩家信息 + 右侧物品栏 -->
      <div class="dashboard-row">
        <!-- 左侧：玩家综合信息 -->
        <el-card class="player-comprehensive" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>玩家信息</span>
              <el-tag size="small" :type="playerConnectionStatus.type">
                {{ playerConnectionStatus.text }}
              </el-tag>
            </div>
          </template>
          <div class="player-comprehensive-content">
            <!-- 左侧装备栏 + 右侧数值信息 -->
            <div class="player-main-content">
              <!-- 左侧装备栏 -->
              <div class="equipment-sidebar">
                <div class="equipment-list">
                  <div class="equipment-item">
                    <div class="equip-slot">主手</div>
                    <div class="equip-content">
                      <div v-if="playerData.equipment?.main_hand" class="equip-info">
                        <div class="equip-name">
                          {{ playerData.equipment.main_hand.display_name }}
                        </div>
                        <div class="equip-details">
                          <span>数量: {{ playerData.equipment.main_hand.count }}</span>
                          <span v-if="playerData.equipment.main_hand.damage">
                            耐久: {{ playerData.equipment.main_hand.damage }}/{{
                              playerData.equipment.main_hand.max_damage
                            }}
                          </span>
                        </div>
                        <el-progress
                          v-if="playerData.equipment.main_hand.max_damage"
                          :percentage="getDurabilityPercentage(playerData.equipment.main_hand)"
                          :stroke-width="4"
                          :color="getDurabilityColor(playerData.equipment.main_hand)"
                          :show-text="false"
                        />
                      </div>
                      <div v-else class="equip-empty">空</div>
                    </div>
                  </div>

                  <div v-for="(slot, key) in equipmentSlots" :key="key" class="equipment-item">
                    <div class="equip-slot">{{ slot.label }}</div>
                    <div class="equip-content">
                      <div v-if="playerData.equipment?.[key]" class="equip-info">
                        <div class="equip-name">{{ playerData.equipment[key].display_name }}</div>
                        <div class="equip-details">
                          <span>数量: {{ playerData.equipment[key].count }}</span>
                        </div>
                      </div>
                      <div v-else class="equip-empty">空</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧数值信息 -->
              <div class="stats-main">
                <!-- 基本信息 -->
                <div class="basic-info-compact">
                  <div class="basic-info-row">
                    <span class="player-name">{{ playerData.name || '未知' }}</span>
                    <span class="game-mode">{{ playerData.gamemode || '未知' }}</span>
                  </div>
                </div>

                <!-- 数值状态 -->
                <div class="stats-list">
                  <ProgressCard
                    label="生命值"
                    :current-value="Number(playerData.health?.toFixed(0) || 0)"
                    :max-value="Number(playerData.max_health?.toFixed(0) || 20)"
                  />
                  <ProgressCard
                    label="饥饿值"
                    :current-value="Number(playerData.food?.toFixed(0) || 0)"
                    :max-value="Number(playerData.max_food?.toFixed(0) || 20)"
                  />
                  <ProgressCard
                    label="经验值"
                    :current-value="Number(playerData.experience?.toFixed(0) || 0)"
                    :max-value="getMaxExperienceForLevel(Number(playerData.level?.toFixed(0) || 0))"
                    :show-level="true"
                    :level="Number(playerData.level?.toFixed(0) || 0)"
                  />
                </div>

                <!-- 位置信息 -->
                <div class="location-box">
                  <CoordinateDisplay
                    :position="playerData.position || {}"
                    :show-orientation="true"
                    :precision="1"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 右侧：物品栏信息 -->
        <el-card class="world-inventory" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Box /></el-icon>
              <span>
                物品栏 ({{ playerData.inventory?.occupied_slots || 0 }}/{{
                  playerData.inventory?.total_slots || 36
                }})
              </span>
            </div>
          </template>
          <div v-if="playerData.inventory?.items?.length > 0" class="inventory-grid">
            <ItemCard
              v-for="item in playerData.inventory.items"
              :key="item.slot"
              :item="item"
              :show-slot="true"
            />
          </div>
          <div v-else class="empty-state">
            <el-empty description="物品栏为空"></el-empty>
          </div>
        </el-card>
      </div>

      <!-- 第三行：附近信息 -->
      <div class="nearby-info-row">
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
                <div class="block-distance">{{ block.distance?.toFixed(1) }}m</div>
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
                <div class="entity-distance">{{ entity.distance?.toFixed(1) }}m</div>
              </div>
            </el-card>
          </div>
          <div v-else class="empty-state">
            <el-empty description="暂无附近实体信息"></el-empty>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { House, User, CircleCheck, Compass, Tools, Box, Share } from '@element-plus/icons-vue'
import {
  PageHeaderWithConnection,
  DataGrid,
  type DataGridItem,
  ProgressCard,
  CoordinateDisplay,
  ItemCard,
} from '@/components/common'
import {
  getWebSocketManager,
  disconnectWorldWS,
  disconnectPlayerWS,
  subscribeWorldWS,
  subscribePlayerWS,
} from '../services/websocket'
import { useWebSocketData } from '../stores/websocketData'
import {
  getGlobalConnectionStatus,
  connectSingleEndpoint,
  disconnectSingleEndpoint,
} from '../services/globalWebSocketService'

// 使用全局WebSocket数据存储
const { worldData, playerData } = useWebSocketData()
const globalConnectionStatus = getGlobalConnectionStatus()

// WebSocket管理器
const worldWSManager = getWebSocketManager('WORLD')
const playerWSManager = getWebSocketManager('PLAYER')

// 连接状态
const isWorldConnected = computed(() => globalConnectionStatus.connectionStatus.WORLD || false)
const isPlayerConnected = computed(() => globalConnectionStatus.connectionStatus.PLAYER || false)
const isAnyConnected = computed(() => isWorldConnected.value || isPlayerConnected.value)

// 连接状态显示
const worldConnectionStatus = computed(() => ({
  type: isWorldConnected.value ? 'success' : 'danger',
  text: isWorldConnected.value ? '已连接' : '未连接',
}))

const playerConnectionStatus = computed(() => ({
  type: isPlayerConnected.value ? 'success' : 'danger',
  text: isPlayerConnected.value ? '已连接' : '未连接',
}))

// 连接状态管理
const connecting = ref(false)
const disconnecting = ref(false)

// 计算等级所需经验值
const getMaxExperienceForLevel = (level: number) => {
  if (level <= 15) {
    return 2 * level + 7
  } else if (level <= 30) {
    return 5 * level - 38
  } else {
    return 9 * level - 158
  }
}

// 玩家基本信息数据（只包含名称和游戏模式）
const playerBasicItems = computed<DataGridItem[]>(() => [
  { key: 'name', label: '玩家名称', value: playerData.name || '未知' },
  { key: 'gamemode', label: '游戏模式', value: playerData.gamemode || '未知' },
])

// 装备槽位配置
const equipmentSlots = {
  helmet: { label: '头盔' },
  chestplate: { label: '胸甲' },
  leggings: { label: '护腿' },
  boots: { label: '靴子' },
}

// 世界数据计算属性
const nearbyBlocks = computed(() => worldData.nearby_blocks || [])
const nearbyEntities = computed(() => worldData.nearby_entities || [])

// 连接所有WebSocket
const connectAll = async () => {
  try {
    connecting.value = true
    await Promise.all([connectSingleEndpoint('WORLD'), connectSingleEndpoint('PLAYER')])
  } catch (error) {
    console.error('连接失败:', error)
  } finally {
    connecting.value = false
  }
}

// 断开所有WebSocket
const disconnectAll = () => {
  try {
    disconnecting.value = true
    disconnectSingleEndpoint('WORLD')
    disconnectSingleEndpoint('PLAYER')
  } catch (error) {
    console.error('断开连接失败:', error)
  } finally {
    disconnecting.value = false
  }
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

// 获取健康状态颜色
const getHealthColor = (health: number, maxHealth: number) => {
  const percentage = health / maxHealth
  if (percentage > 0.6) return '#67C23A'
  if (percentage > 0.3) return '#E6A23C'
  return '#F56C6C'
}

// 消息处理器
const handleWorldMessage = (message: any) => {
  if (message.type === 'pong') {
    console.log('[WorldPlayerDashboard] World heartbeat received')
  }
}

const handlePlayerMessage = (message: any) => {
  if (message.type === 'pong') {
    console.log('[WorldPlayerDashboard] Player heartbeat received')
  }
}

// 连接状态变化处理
const handleWorldConnectionChange = (connected: boolean) => {
  if (connected) {
    subscribeWorldWS(2000) // 2秒更新一次
    ElMessage.success('世界数据连接成功')
  } else {
    ElMessage.warning('世界数据连接断开')
  }
}

const handlePlayerConnectionChange = (connected: boolean) => {
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
  worldWSManager.addMessageHandler(handleWorldMessage)
  playerWSManager.addMessageHandler(handlePlayerMessage)
  // 添加连接状态监听器
  worldWSManager.addConnectionHandler(handleWorldConnectionChange)
  playerWSManager.addConnectionHandler(handlePlayerConnectionChange)
})

onUnmounted(() => {
  // 移除消息处理器
  worldWSManager.removeMessageHandler(handleWorldMessage)
  playerWSManager.removeMessageHandler(handlePlayerMessage)
  // 移除连接状态监听器
  worldWSManager.removeConnectionHandler(handleWorldConnectionChange)
  playerWSManager.removeConnectionHandler(handlePlayerConnectionChange)
  // 断开连接
  disconnectWorldWS()
  disconnectPlayerWS()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.dashboard-content {
  display: grid;
  gap: 20px;
}

.dashboard-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.world-info-row,
.player-comprehensive,
.world-inventory,
.nearby-blocks,
.nearby-entities {
  background: white;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.world-info-row {
  margin-bottom: 20px;
}

.world-info-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  align-items: center;
}

.world-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.world-info-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.world-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}

.nearby-info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.player-comprehensive-content {
  padding: 20px;
}

.player-main-content {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 20px;
  align-items: start;
}

.equipment-sidebar {
  display: flex;
  flex-direction: column;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-item {
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e6e6e6;
  min-height: 60px;
}

.equip-slot {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
  text-align: center;
}

.equip-content {
  text-align: center;
  font-size: 12px;
}

.equip-info {
  padding: 4px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

.equip-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equip-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 10px;
  color: #666;
}

.equip-empty {
  padding: 8px;
  color: #999;
  font-style: italic;
  font-size: 11px;
}

.stats-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.basic-info-compact {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.basic-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.game-mode {
  font-size: 12px;
  color: #666;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-box {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  border-left: 3px solid #409eff;
}

.nearby-info {
  display: grid;
  gap: 20px;
}

.health-grid {
  display: grid;
  gap: 20px;
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
@media (max-width: 1024px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .world-info-content {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .world-info-item {
    justify-content: space-between;
    padding: 8px 12px;
  }

  .player-main-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .equipment-sidebar {
    order: 2; /* 移动端装备栏放在下面 */
  }

  .stats-main {
    order: 1; /* 移动端数值信息放在上面 */
  }

  .basic-info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .equipment-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .stats-list {
    gap: 8px;
  }

  .nearby-info-row {
    grid-template-columns: 1fr;
  }

  .equipment-grid,
  .inventory-grid {
    grid-template-columns: 1fr;
  }

  .blocks-grid,
  .entities-grid {
    grid-template-columns: 1fr;
  }
}
</style>
