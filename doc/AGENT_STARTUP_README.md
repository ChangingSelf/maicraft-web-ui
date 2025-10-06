# Maicraft Agent 启动功能使用指南

## 概述

本项目已实现通过Web界面直接启动maicraft agent的功能。该功能通过专门的代理服务器实现，允许前端界面执行系统命令来启动Python程序。

## 架构说明

```
前端 (Vue 3) ←→ 代理服务器 (Node.js) ←→ 系统命令
     ↑                          ↑
   界面操作                执行系统命令
   状态显示           支持多种环境管理器 + python main.py
```

## 目录结构

```
proxy/                    # 代理服务器
├── server.js                   # 主要服务器代码
├── package.json               # 后端依赖配置
├── .gitignore                 # 忽略文件配置
└── node_modules/              # 依赖包

src/views/AgentManager.vue     # Agent管理页面
```

## 功能特性

### ✅ 已实现功能

- **Agent状态监控**: 实时显示运行状态、进程ID、运行时间
- **多环境管理器支持**: Conda、Virtualenv、Poetry、Pipenv、uv、手动配置
- **自动环境检测**: 检测系统已安装的环境管理工具
- **配置持久化**: 本地存储用户配置，避免重复设置
- **工作目录配置**: 支持指定Agent项目路径
- **启动/停止控制**: 一键启动和停止Agent进程
- **状态同步**: 前端自动同步后端Agent状态
- **错误处理**: 完整的错误提示和状态管理

### 🔧 技术实现

- **后端服务器**: Express.js + CORS + 子进程管理
- **进程管理**: spawn/exec + 优雅关闭
- **跨平台支持**: Windows/Linux环境兼容
- **安全考虑**: 服务端验证，无直接前端系统访问

## 使用步骤

### 1. 环境准备

确保系统已安装：

- Node.js (>=16.0.0)
- conda/miniconda
- Python环境（通过conda创建）

### 2. 安装依赖

```bash
# 安装代理服务器依赖
npm run proxy:install

# 安装前端依赖（如果需要）
pnpm install
```

### 3. 启动服务

```bash
# 同时启动前后端服务
npm run dev

# 或分别启动
npm run dev:frontend        # 前端 (端口5173)
npm run dev:proxy     # 代理服务器 (端口25106)
```

### 4. 配置和使用

1. 打开浏览器访问前端界面
2. 点击左侧菜单"Agent 管理"
3. 在"Agent配置"中选择环境管理器：
   - **Conda**: 选择已创建的环境
   - **Virtualenv**: 指定venv目录路径
   - **Poetry**: 指定包含pyproject.toml的项目路径
   - **Pipenv**: 指定包含Pipfile的项目路径
   - **uv**: 指定包含pyproject.toml的项目路径
   - **手动配置**: 直接指定Python可执行文件路径
4. 指定Agent项目路径（必填）
5. 点击"启动Agent"按钮开始运行，或点击"清理进程"按钮清理僵尸进程
6. 观察状态变化和运行信息

## API 接口

### 健康检查

```
GET /health
```

返回服务器和Agent状态信息。

### 获取Agent状态

```
GET /api/agent/status
```

返回当前Agent运行状态。

### 启动Agent

```
POST /api/agent/start
Content-Type: application/json

{
  "envName": "maicraft",    // conda环境名称
  "venvPath": "/path/to/venv", // virtualenv路径
  "poetryPath": "/path/to/poetry-project", // poetry项目路径
  "pipenvPath": "/path/to/pipenv-project", // pipenv项目路径
  "uvPath": "/path/to/uv-project", // uv项目路径
  "pythonPath": "/path/to/python", // 手动Python路径
  "workDir": "/path/to/agent" // 必填的工作目录（包含main.py的项目路径）
}
```

### 停止Agent

```
POST /api/agent/stop
```

停止正在运行的Agent进程。

### 清理僵尸进程

```
POST /api/agent/cleanup
```

精确清理僵尸进程，只清理以下两种进程：

1. **当前管理的进程**: 直接终止服务器记录的进程
2. **记录的进程ID**: 清理已记录但仍在运行的进程

**绝对安全性保证**:

- ✅ 不会误杀任何其他Python应用
- ✅ 即使其他项目也使用 `python main.py` 也不会被清理
- ✅ 只清理本系统确切知道的进程
- ✅ 返回清理的进程数量统计

### 获取Conda环境

```
GET /api/conda/envs
```

返回系统中可用的conda环境列表。

### 获取系统环境信息

```
GET /api/system/envs
```

返回系统中检测到的各种环境管理工具信息。

## 目录结构

```
proxy/                    # 代理服务器
├── server.js                   # 主要服务器代码
├── package.json               # 后端依赖配置
├── .gitignore                 # 忽略文件配置
└── node_modules/              # 依赖包

src/views/AgentManager.vue     # Agent管理页面
```

## 安全注意事项

### ✅ 安全措施

- **服务端执行**: 所有系统命令在Node.js后端执行，前端无直接系统访问
- **环境验证**: 启动前验证conda环境是否存在
- **进程隔离**: 使用spawn创建独立进程，避免主进程阻塞
- **优雅关闭**: 支持SIGTERM信号优雅停止进程

### ⚠️ 使用建议

- 仅在可信环境中使用
- 定期检查conda环境配置
- 监控Agent进程状态
- 及时停止不需要的进程

## 故障排除

### 常见问题

**Q: 无法连接到代理服务器**
A: 确保运行了 `npm run dev` 并检查端口25106是否被占用

**Q: 环境管理器未检测到**
A: 确认相关工具已正确安装并在PATH中，或选择手动配置

**Q: Agent启动失败**
A: 检查工作目录是否存在main.py文件，确认环境配置正确

**Q: 启动按钮无响应**
A: 检查浏览器控制台错误，确认前后端通信正常

**Q: 进程变成僵尸进程**
A: 点击"清理进程"按钮，系统只会清理确切记录的进程，绝对不会误伤其他Python应用

### 日志查看

- 后端日志：终端输出
- 前端日志：浏览器开发者工具控制台
- Agent日志：Agent进程的标准输出

## 扩展功能

### 可能的增强

- **多Agent支持**: 同时管理多个Agent实例
- **日志查看**: 集成Agent运行日志显示
- **配置持久化**: 保存用户偏好的环境配置
- **进程监控**: 更详细的性能指标监控
- **远程部署**: 支持远程服务器上的Agent管理

## 技术栈

- **前端**: Vue 3 + Element Plus + TypeScript
- **后端**: Node.js + Express.js
- **进程管理**: child_process (spawn/exec)
- **环境管理**: 支持Conda/Virtualenv/Poetry/Pipenv/uv
- **配置存储**: localStorage持久化
- **跨平台**: Windows/Linux兼容实现
- **开发工具**: concurrently (并行运行)

## 贡献

欢迎提交Issue和Pull Request来改进此功能。
