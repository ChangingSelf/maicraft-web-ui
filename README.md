# Maicraft Web UI

基于 Vue3 + TypeScript + Element Plus 的 MaicraftAgent Web 界面

## 🚀 功能特性

- **实时日志查看器**：通过 WebSocket 连接实时查看 MaicraftAgent 日志
- **智能筛选**：支持按日志级别和模块进行筛选
- **自动重连**：WebSocket 断开时自动重连机制
- **心跳保活**：定期发送心跳包保持连接稳定
- **现代化UI**：基于 Element Plus 的美观界面设计

## 📋 系统要求

- Node.js >= 20.19.0 || >= 22.12.0
- pnpm >= 10.7.0
- MaicraftAgent 后端服务运行在 `ws://localhost:20914/ws/logs`

## 🛠️ 安装和运行

### 安装依赖

```sh
pnpm install
```

### 开发环境运行

#### 方式1：仅前端（需要单独启动后端）

```sh
pnpm dev
```

#### 方式2：完整开发环境（前端 + Mock WebSocket服务器）

```sh
pnpm dev:full
```

#### 方式3：仅Mock WebSocket服务器

```sh
pnpm mock-ws
```

#### 方式4：一键演示（推荐）

```sh
pnpm demo
```

这将自动启动完整的演示环境，包括Mock服务器和前端应用。

访问 `http://localhost:5173` 查看应用

### 生产环境构建

```sh
pnpm build
```

### 代码检查

```sh
pnpm lint
```

## 🔧 Mock WebSocket服务器

项目包含一个内置的Mock WebSocket服务器，用于在没有真实后端的情况下测试WebSocket连接功能。

### 启动Mock服务器

```sh
# 单独启动Mock服务器
pnpm mock-ws

# 或者与前端一起启动
pnpm dev:full
```

### Mock服务器特性

- **自动日志生成**：每2秒自动推送模拟日志消息
- **多种日志级别**：TRACE, DEBUG, INFO, SUCCESS, WARNING, ERROR, CRITICAL
- **多模块支持**：MCPClient, MaiAgent, System, TaskManager, EventHandler
- **心跳机制**：30秒间隔的ping/pong心跳检测
- **订阅支持**：处理客户端的订阅消息
- **实时响应**：支持所有WebSocket消息格式

### 测试步骤

1. **启动Mock服务器**：

   ```sh
   pnpm mock-ws
   ```

   应该看到：

   ```
   🚀 Mock WebSocket服务器启动在 ws://localhost:20914
   📡 日志WebSocket端点: ws://localhost:20914/ws/logs
   ```

2. **启动前端应用**：

   ```sh
   pnpm dev
   ```

   访问 `http://localhost:5173`

3. **测试连接**：
   - 点击"连接服务器"按钮建立WebSocket连接
   - 观察实时日志推送（每2秒一条）
   - 尝试不同的日志级别和模块筛选
   - 测试断开/重连功能

4. **验证功能**：
   - 心跳机制（30秒间隔）
   - 订阅消息处理
   - 自动重连（断开后5秒重连）
   - 日志数量限制（默认1000条）

### 完整开发环境

使用 `pnpm dev:full` 同时启动前端和Mock服务器：

```sh
pnpm dev:full
```

这将同时启动：

- Mock WebSocket服务器 (ws://localhost:20914)
- Vue前端开发服务器 (http://localhost:5173)

## 📖 日志查看器使用说明

### 功能概述

日志查看器通过 WebSocket 连接到 MaicraftAgent 的日志服务，实时显示系统日志信息。

### 主要功能

1. **实时日志显示**
   - 自动连接到 `ws://localhost:20914/ws/logs`
   - 实时接收和显示日志消息
   - 支持自动滚动到最新日志

2. **日志筛选**
   - **日志级别**：TRACE, DEBUG, INFO, SUCCESS, WARNING, ERROR, CRITICAL
   - **模块筛选**：MCPClient, MaiAgent, System, TaskManager, EventHandler

3. **连接管理**
   - 连接状态实时显示
   - 手动连接/断开控制
   - 自动重连机制（断开5秒后自动重连）
   - 心跳保活（30秒间隔）

4. **日志管理**
   - 清空日志功能
   - 最大显示条数限制（默认1000条）
   - 日志格式化显示

### 日志消息格式

```json
{
  "type": "log",
  "timestamp": 1704067200000,
  "level": "INFO",
  "module": "MCPClient",
  "message": "MCP 客户端已连接"
}
```

### 订阅消息格式

```json
{
  "type": "subscribe",
  "levels": ["INFO", "WARNING", "ERROR"],
  "modules": ["MCPClient", "MaiAgent"]
}
```

## 🔧 技术栈

- **前端框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **构建工具**：Vite
- **通信**：WebSocket (原生)

## 📁 项目结构

```
src/
├── views/
│   └── LogViewer.vue      # 日志查看器页面
├── router/
│   └── index.ts           # 路由配置
├── stores/                # Pinia 状态管理
├── App.vue                # 根组件
└── main.ts                # 应用入口
```

## ⚙️ 配置说明

### WebSocket 配置

在日志查看器页面可以修改以下设置：

- **WebSocket地址**：默认 `ws://localhost:20914/ws/logs`
- **自动滚动**：新日志到达时自动滚动到底部
- **最大显示条数**：限制显示的日志条数，默认1000条

### 环境变量

```env
# 开发环境
VITE_WS_URL=ws://localhost:20914/ws/logs

# 生产环境
VITE_WS_URL=ws://your-server:20914/ws/logs
```

## 🐛 故障排除

### WebSocket 连接失败

1. 检查 MaicraftAgent 后端服务是否运行
2. 检查 WebSocket 地址是否正确
3. 检查防火墙设置
4. 查看浏览器控制台错误信息

### 日志不显示

1. 确认已选择正确的日志级别和模块
2. 检查后端是否正在产生日志
3. 尝试刷新页面重新连接
4. 检查Mock服务器是否在运行：`pnpm mock-ws`

### Mock服务器问题

1. **端口被占用**：

   ```sh
   # 检查端口20914是否被占用
   netstat -ano | findstr :20914
   # 如果被占用，杀死进程或使用其他端口
   ```

2. **ES模块导入错误**：
   - 确保使用Node.js 14+
   - 检查package.json中的"type": "module"

3. **连接失败**：
   - 确认前端WebSocket地址正确（默认ws://localhost:20914/ws/logs）
   - 检查防火墙设置

## 📄 许可证

MIT License

---

## 开发环境设置

### 推荐的 IDE 设置

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (禁用 Vetur)

### TypeScript 支持

项目使用 `vue-tsc` 进行类型检查，确保 `.vue` 文件的类型支持。

### 自定义配置

查看 [Vite 配置参考](https://vite.dev/config/)。
