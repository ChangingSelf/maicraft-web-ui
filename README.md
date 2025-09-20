# Maicraft Web UI

Minecraft 服务器监控和管理界面

## 🎯 项目简介

Maicraft Web UI 是 [Maicraft](https://github.com/MaiM-with-u/Maicraft) 项目的专用 Web 管理界面。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 📋 版本管理

### 查看版本信息

```bash
npm run version:info
```

### 智能版本发布

```bash
# 快速发布（推荐）
npm run version:feat    # 新功能
npm run version:fix     # 修复bug

# 自定义发布
npm run version:patch -m "feat: 添加用户管理功能"
npm run version:minor -m "feat: 完全重写界面"
npm run version:major -m "feat: 架构升级"
```

### 备份管理

```bash
# 查看所有备份
npm run backup:list

# 从最新备份恢复
npm run backup:latest

# 安全演示
npm run version:demo
```

### 🎯 新特性

- ✅ **提交类型支持**: feat, fix, docs, style, refactor, perf, test, chore, ci, build
- ✅ **智能分析**: 版本趋势、变更统计、类型分布
- ✅ **自动备份**: 每次更新自动备份，gitignore友好
- ✅ **数据兼容**: 支持新旧版本格式无缝迁移

## 🛡️ 安全保障

### 自动备份

- ✅ 每次更新前自动创建备份
- ✅ 备份存储在 `backups/` 目录
- ✅ 支持时间戳和最新备份
- ✅ 备份文件自动被 `.gitignore` 忽略

### 数据安全

- ✅ **不丢失原有内容**：只插入，不覆盖
- ✅ **智能去重**：避免重复版本条目
- ✅ **格式验证**：确保CHANGELOG格式正确
- ✅ **错误恢复**：失败时自动回滚

## 📁 项目结构

```
maicraft-web-ui/
├── src/
│   ├── config/
│   │   └── version.json          # 版本配置
│   ├── services/
│   │   └── versionService.ts     # 版本管理服务
│   ├── views/
│   │   └── Changelog.vue         # 版本信息页面
│   └── components/               # UI组件
├── scripts/
│   └── version-manager.js        # 版本管理脚本
├── backups/                      # 备份文件目录
│   ├── CHANGELOG.md.latest.bak   # 最新备份
│   └── CHANGELOG.md.时间戳.bak   # 历史备份
├── CHANGELOG.md                  # 更新日志
├── package.json                  # 项目配置
└── README.md                     # 项目文档
```

## 🎯 功能特性

### 前端功能

- 🔍 **实时日志查看**：支持多种日志级别过滤
- 📊 **服务器监控**：实时显示服务器状态
- 🎮 **玩家管理**：查看在线玩家信息
- 🛠️ **MCP集成**：支持Minecraft Control Protocol
- 📱 **响应式设计**：适配桌面和移动设备

### 版本管理

- 📦 **自动化发布**：一键版本更新
- 🔄 **多源同步**：自动同步所有配置文件
- 🛡️ **安全备份**：自动备份重要文件
- 📝 **格式化日志**：支持Markdown渲染

## 🔧 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **构建工具**: Vite
- **包管理器**: pnpm
- **代码质量**: ESLint + Prettier

## 📖 详细文档

- [版本管理系统完整指南](doc/VERSION_MANAGEMENT_GUIDE.md)
- [API文档](api.md)
- [快速开始](QUICKSTART.md)

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- 使用 TypeScript 进行开发
- 遵循 Vue 3 Composition API 最佳实践
- 提交前运行代码质量检查：
  ```bash
  npm run lint
  npm run type-check
  ```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙋‍♂️ 问题反馈

如果您在使用过程中遇到问题，请：

1. 查看 [问题排查指南](doc/TROUBLESHOOTING.md)
2. 在 GitHub Issues 中提交问题
3. 联系开发团队

## 🎉 更新日志

详细的更新历史请查看 [CHANGELOG.md](CHANGELOG.md)

---

**Maicraft Web UI** - 让 Minecraft 服务器管理变得简单而强大！ 🚀
