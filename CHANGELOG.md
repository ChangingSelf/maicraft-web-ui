# 更新日志 / Changelog

本文档记录了 Maicraft Web UI 的版本更新历史和功能改进。

## [v1.1.4] - 2025-09-20

- feat: 新功能

## [v1.1.3] - 2025-09-20

- 测试新的备份系统

## [v1.1.2] - 2025-09-20

- 测试安全的CHANGELOG更新

## [v1.1.0] - 2025-01-19

### 新功能 / New Features

- ✨ 添加版本信息和更新日志页面
- ✨ 支持实时显示服务器状态
- ✨ 优化 MCP 工具管理界面
- ✨ 新增玩家状态监控功能

### 改进 / Improvements

- 🔧 优化侧边栏导航体验
- 🔧 改进日志查看器的性能
- 🔧 更新用户界面设计

### 修复 / Bug Fixes

- 🐛 修复 WebSocket 连接稳定性问题
- 🐛 修复日志过滤器显示异常
- 🐛 修复事件查看器数据更新延迟

## [v1.0.0] - 2024-12-01

### 新功能 / New Features

- ✨ 初始版本发布
- ✨ 支持 Minecraft 服务器日志实时查看
- ✨ 集成 MCP (Minecraft Control Protocol) 服务器
- ✨ 提供基础的事件监控功能
- ✨ 支持多种日志级别过滤
- ✨ 实时服务器状态监控

### 技术特性 / Technical Features

- 🏗️ 基于 Vue 3 + TypeScript + Vite
- 🏗️ 使用 Element Plus UI 组件库
- 🏗️ 支持响应式设计
- 🏗️ WebSocket 实时通信
- 🏗️ Pinia 状态管理

### 代码示例 / Code Examples

**JavaScript 代码：**

```javascript
// WebSocket 连接示例
const ws = new WebSocket('ws://localhost:3000')

ws.onopen = () => {
  console.log('WebSocket 连接已建立')
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      channel: 'minecraft_logs',
    }),
  )
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('收到消息:', data)
}
```

**TypeScript 接口定义：**

```typescript
interface MinecraftPlayer {
  id: string
  name: string
  position: {
    x: number
    y: number
    z: number
  }
  health: number
  gameMode: 'survival' | 'creative' | 'adventure'
}
```

**Vue 3 组合式 API：**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const players = ref<MinecraftPlayer[]>([])
const onlineCount = computed(() => players.value.length)

// 获取玩家列表
const fetchPlayers = async () => {
  const response = await fetch('/api/players')
  players.value = await response.json()
}
</script>
```

---

## 开发说明 / Development Notes

### 版本号规则 / Version Number Rules

我们使用 [语义化版本](https://semver.org/) 控制版本号：

- **MAJOR.MINOR.PATCH** (主版本.次版本.补丁版本)
- 主版本：破坏性变更
- 次版本：新功能
- 补丁版本：修复

### 更新类型 / Change Types

- ✨ **新功能** (New Features)
- 🔧 **改进** (Improvements)
- 🐛 **修复** (Bug Fixes)
- 📚 **文档** (Documentation)
- 🏗️ **技术** (Technical)
- 🎨 **样式** (Style)

---

## 功能对比 / Feature Comparison

| 功能特性     | v1.0.0 | v1.1.0 | 计划中 |
| ------------ | ------ | ------ | ------ |
| 日志查看器   | ✅     | ✅     | -      |
| 实时监控     | ✅     | ✅     | -      |
| MCP 集成     | ✅     | ✅     | -      |
| 版本信息页面 | ❌     | ✅     | -      |
| 主题切换     | ❌     | ❌     | ✅     |
| 多语言支持   | ❌     | ❌     | ✅     |
| 插件系统     | ❌     | ❌     | ✅     |

## 贡献 / Contributing

如果你想为项目贡献代码，请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 许可证 / License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 快捷键说明 / Keyboard Shortcuts

| 快捷键                         | 功能描述 |
| ------------------------------ | -------- |
| <kbd>Ctrl</kbd> + <kbd>R</kbd> | 刷新页面 |
| <kbd>F11</kbd>                 | 全屏模式 |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | 搜索功能 |
| <kbd>Esc</kbd>                 | 退出全屏 |

> **💡 提示**: 这些快捷键可以在任何页面中使用，提升操作效率。

---

## 任务清单 / Task List

- [x] 项目初始化
- [x] 基础功能实现
- [x] 用户界面设计
- [x] Markdown 渲染集成
- [ ] 主题切换功能
- [ ] 多语言支持
- [ ] 高级配置选项

---

_最后更新时间：2025-01-19_
