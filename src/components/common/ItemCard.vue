<template>
  <!-- 物品卡片组件，用于显示装备和物品栏物品 -->
  <el-card class="item-card" size="small">
    <div class="item-info">
      <div class="item-name">{{ item.display_name }}</div>
      <div class="item-details">
        <span v-if="showSlot">槽位: {{ item.slot }}</span>
        <span>数量: {{ item.count }}</span>
        <span v-if="item.damage">耐久: {{ item.damage }}/{{ item.max_damage }}</span>
      </div>
      <el-progress
        v-if="item.max_damage"
        :percentage="durabilityPercentage"
        :stroke-width="4"
        :color="durabilityColor"
        :show-text="false"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义物品接口
export interface ItemData {
  slot?: number
  display_name: string
  count: number
  damage?: number
  max_damage?: number
}

// 定义组件属性
interface Props {
  item: ItemData
  showSlot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSlot: false,
})

// 计算耐久度百分比
const durabilityPercentage = computed(() => {
  if (!props.item.damage || !props.item.max_damage) return 100
  return Math.max(((props.item.max_damage - props.item.damage) / props.item.max_damage) * 100, 0)
})

// 计算耐久度颜色
const durabilityColor = computed(() => {
  const percentage = durabilityPercentage.value
  if (percentage > 60) return '#67C23A'
  if (percentage > 30) return '#E6A23C'
  return '#F56C6C'
})
</script>

<style scoped>
.item-card {
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
</style>
