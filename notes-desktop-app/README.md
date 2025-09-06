# Notes Desktop App - 本地知识管理桌面应用

> 基于 Electron + Koa2 + TypeScript 的现代化本地知识管理应用

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Framework](https://img.shields.io/badge/framework-Electron-47848f.svg)
![Backend](https://img.shields.io/badge/backend-Koa2%20%2B%20TypeScript-00d8ff.svg)

## 📋 项目概述

这是一个完全本地化的知识管理桌面应用，为用户提供安全、高效、功能丰富的知识管理体验。应用采用现代化技术栈，支持与浏览器插件的无缝集成。

### 🎯 核心特性

- **🖥️ 桌面原生体验** - 基于 Electron 的跨平台桌面应用
- **🚀 高性能架构** - Koa2 + TypeScript 后端，React 前端
- **📝 Markdown 支持** - 完整的 Markdown 编辑和预览功能
- **📁 智能文件夹管理** - 层次化文件夹结构，支持拖拽操作
- **🔍 全文搜索** - 快速检索知识内容和标签
- **🔗 浏览器插件集成** - 与 Chrome 插件无缝协作
- **💾 本地数据存储** - 数据完全存储在本地，保护隐私
- **🎨 现代化界面** - 响应式设计，支持深色模式

## 🏗️ 技术架构

### 多进程架构

```
┌───────────────────────────────────────────────────────────────┐
│                    Electron Desktop App                    │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Main Process  │ Renderer Process│     Koa2 Server         │
│                 │                 │                         │
│ • 应用生命周期   │ • React UI      │ • REST API              │
│ • 窗口管理       │ • 用户界面      │ • 数据处理              │
│ • IPC 通信      │ • 界面逻辑      │ • 文件系统              │
│ • 服务器控制     │ • 状态管理      │ • 中间件系统            │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **桌面框架** | Electron 28.0 | 跨平台桌面应用框架 |
| **前端框架** | React 18.2 + TypeScript | 现代化用户界面 |
| **后端框架** | Koa2 + TypeScript | 高性能 Node.js 框架 |
| **构建工具** | Webpack 5.89 | 模块化构建系统 |
| **样式方案** | CSS + CSS-in-JS | 响应式样式设计 |
| **数据存储** | 本地文件系统 | JSON 格式数据持久化 |
| **开发语言** | TypeScript 5.3 | 类型安全的 JavaScript |

## 📂 项目结构

```
notes-desktop-app/
├── src/                        # 源代码目录
│   ├── main/                   # Electron 主进程
│   │   └── main.ts            # 主进程入口文件
│   ├── preload/               # 预加载脚本
│   │   └── preload.ts         # 安全上下文桥接
│   ├── renderer/              # 渲染进程（React 应用）
│   │   ├── components/        # React 组件
│   │   │   ├── Sidebar.tsx    # 侧边栏组件
│   │   │   ├── NoteList.tsx   # 知识列表组件
│   │   │   └── NoteEditor.tsx # 知识编辑器组件
│   │   ├── services/          # 前端服务
│   │   │   └── NotesApiService.ts # API 调用服务
│   │   ├── styles/            # 样式文件
│   │   │   ├── App.css        # 应用样式
│   │   │   └── index.css      # 全局样式
│   │   ├── App.tsx            # 应用根组件
│   │   ├── index.tsx          # 渲染进程入口
│   │   └── index.html         # HTML 模板
│   ├── server/                # Koa2 服务器
│   │   ├── services/          # 业务逻辑服务
│   │   │   ├── NotesService.ts    # 知识服务
│   │   │   └── FoldersService.ts  # 文件夹服务
│   │   ├── index.ts           # 服务器入口
│   │   ├── middleware.ts      # Koa 中间件
│   │   └── routes.ts          # API 路由定义
│   └── types/                 # TypeScript 类型定义
│       └── index.ts           # 全局类型声明
├── dist/                      # 构建输出目录
│   ├── main/                  # 主进程构建产物
│   ├── renderer/              # 渲染进程构建产物
│   └── server/                # 服务器构建产物
├── webpack.main.config.js     # 主进程构建配置
├── webpack.renderer.config.js # 渲染进程构建配置
├── webpack.server.config.js   # 服务器构建配置
├── tsconfig.main.json         # 主进程 TS 配置
├── tsconfig.renderer.json     # 渲染进程 TS 配置
├── tsconfig.server.json       # 服务器 TS 配置
└── package.json               # 项目配置文件
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **操作系统**: Windows 10+ / macOS 10.14+ / Linux

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd notes-desktop-app

# 2. 安装依赖
npm install

# 3. 构建应用
npm run build

# 4. 启动应用
npm start
```

### 开发模式

```bash
# 启动开发模式（热重载）
npm run dev

# 单独启动各个进程
npm run dev:main      # 主进程开发模式
npm run dev:renderer  # 渲染进程开发模式
npm run dev:server    # 服务器开发模式
```

## 🔧 API 接口文档

### 基础信息

- **Base URL**: `http://127.0.0.1:3001`
- **API Version**: v1
- **Content-Type**: `application/json`
- **Authentication**: 本地 Token（可选）

### 知识管理 API

#### 获取知识列表
```http
GET /api/notes
```

**查询参数**:
- `page` (number): 页码，默认 1
- `limit` (number): 每页数量，默认 20
- `folderId` (string): 文件夹 ID 筛选
- `search` (string): 搜索关键词
- `tags` (string): 标签筛选，逗号分隔

#### 创建知识
```http
POST /api/notes
```

#### 更新知识
```http
PUT /api/notes/:id
```

#### 删除知识
```http
DELETE /api/notes/:id
```

### 文件夹管理 API

#### 获取文件夹树
```http
GET /api/folders
```

#### 创建文件夹
```http
POST /api/folders
```

### 搜索 API

#### 全文搜索
```http
GET /api/search?q=搜索关键词
```

### 统计信息 API

#### 获取统计数据
```http
GET /api/stats
```

## 📊 数据存储

### 存储位置

数据文件存储在用户系统的应用数据目录：

- **Windows**: `%APPDATA%\NotesDesktopApp`
- **macOS**: `~/Library/Application Support/NotesDesktopApp`
- **Linux**: `~/.config/NotesDesktopApp`

### 数据结构

```
NotesDesktopApp/
├── notes.json          # 知识数据
├── folders.json        # 文件夹数据
└── config.json         # 应用配置
```

## 🔗 浏览器插件集成

### 通信协议

桌面应用通过 HTTP API 与浏览器插件通信：

1. **桌面应用启动** → 启动 Koa2 服务器（端口 3001）
2. **浏览器插件** → 发送 HTTP 请求到本地服务器
3. **数据同步** → 实时双向数据交换

## 🛠️ 开发指南

### 构建命令详解

```bash
# 完整构建
npm run build               # 构建所有目标
npm run build:main          # 构建主进程
npm run build:renderer      # 构建渲染进程
npm run build:server        # 构建服务器

# 开发调试
npm run dev                 # 启动完整开发环境
npm run dev:main            # 主进程开发模式
npm run dev:renderer        # 渲染进程开发模式
npm run dev:server          # 服务器开发模式

# 代码检查
npm run type-check          # TypeScript 类型检查
npm run test:api            # API 接口测试

# 清理构建
npm run clean               # 清理 dist 目录
```

## 🐛 故障排除

### 常见问题

**1. 应用启动失败**
```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18.0.0

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

**2. 白屏问题**
```bash
# 重新构建渲染进程
npm run build:renderer

# 检查控制台错误
# 在开发模式下按 F12 打开 DevTools
```

**3. 服务器连接失败**
```bash
# 检查端口占用
lsof -i :3001

# 重启服务器
npm run dev:server
```

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**Notes Desktop App** - 让本地知识管理更简单、更安全、更高效！