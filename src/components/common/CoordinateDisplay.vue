<template>
  <!-- 坐标显示组件，用于显示位置和方向信息 -->
  <div class="coordinate-display">
    <!-- 紧凑的位置信息显示 -->
    <div class="position-summary">
      <div class="position-coords">
        <span class="coords-label">位置:</span>
        <span class="coords-values">
          {{ formatCoordinates() }}
        </span>
      </div>
      <div class="position-details" v-if="showOrientation">
        <span class="detail-item">
          <span class="detail-label">方向:</span>
          <span class="detail-value">{{ position.yaw?.toFixed(1) || '0.0' }}°</span>
        </span>
        <span class="detail-separator">•</span>
        <span class="detail-item">
          <span class="detail-label">俯仰:</span>
          <span class="detail-value">{{ position.pitch?.toFixed(1) || '0.0' }}°</span>
        </span>
        <span class="detail-separator">•</span>
        <span class="detail-item">
          <span class="detail-label">地面:</span>
          <span class="detail-value">{{ position.on_ground ? '是' : '否' }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义位置接口
export interface PositionData {
  x?: number
  y?: number
  z?: number
  yaw?: number
  pitch?: number
  on_ground?: boolean
}

// 定义组件属性
interface Props {
  position: PositionData
  showOrientation?: boolean
  precision?: number
}

const props = withDefaults(defineProps<Props>(), {
  showOrientation: true,
  precision: 2,
})

// 格式化坐标显示
const formatCoordinates = () => {
  const x = props.position.x?.toFixed(props.precision) || '0.00'
  const y = props.position.y?.toFixed(props.precision) || '0.00'
  const z = props.position.z?.toFixed(props.precision) || '0.00'
  return `(${x}, ${y}, ${z})`
}
</script>

<style scoped>
.coordinate-display {
  padding: 16px;
}

.position-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.position-coords {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}

.coords-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  min-width: 40px;
}

.coords-values {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.position-details {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #e9ecef;
}

.detail-separator {
  color: #999;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .position-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .detail-separator {
    display: none;
  }
}
</style>
