# 网页学习助手 - Chrome浏览器插件

一个智能的Chrome浏览器插件，用于提取网页内容并进行学习分析。支持自动提取网页中的文本和图片，去除无用元素，并将处理后的内容发送到指定的API接口。

## 功能特性

- 🎯 **智能内容提取**: 自动提取网页中的文本内容和图片URL
- 🧹 **内容清理**: 智能移除广告、导航、脚本等无用元素
- 🎨 **优雅界面**: 现代化的Popup界面和页面蒙层效果
- ⚙️ **灵活配置**: 支持自定义API地址和密钥配置
- 📱 **响应式设计**: 适配不同屏幕尺寸
- 🔄 **实时状态**: 实时显示学习进度和状态

## 技术栈

- **TypeScript**: 类型安全的JavaScript
- **React**: 现代化的UI框架
- **Less**: CSS预处理器
- **Webpack**: 模块打包工具
- **Chrome Extension API**: 浏览器插件开发

## 项目结构

```
web_capture_vault/
├── src/
│   ├── popup/              # Popup界面相关
│   │   ├── components/     # React组件
│   │   ├── index.tsx       # Popup入口
│   │   └── popup.less      # Popup样式
│   ├── background/         # Background脚本
│   │   └── index.ts        # 后台服务
│   ├── content/            # Content脚本
│   │   ├── index.ts        # 页面交互逻辑
│   │   └── content.css     # 蒙层样式
│   ├── utils/              # 工具类
│   │   ├── htmlProcessor.ts # HTML处理工具
│   │   └── apiService.ts   # API服务
│   └── types/              # TypeScript类型定义
│       ├── index.ts        # 主要类型
│       └── chrome.d.ts     # Chrome API类型
├── icons/                  # 插件图标
├── manifest.json           # 插件配置文件
├── popup.html              # Popup HTML模板
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript配置
├── webpack.config.js       # Webpack配置
└── README.md               # 项目文档
```

## 安装和开发

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

## 安装插件

1. 构建项目：
   ```bash
   npm run build
   ```

2. 打开Chrome浏览器，进入扩展程序页面：
   - 地址栏输入：`chrome://extensions/`
   - 或者：菜单 → 更多工具 → 扩展程序

3. 开启"开发者模式"

4. 点击"加载已解压的扩展程序"，选择项目的根目录

5. 插件安装完成，可以在工具栏看到插件图标

## 使用方法

### 基本使用

1. 打开任意网页（如飞书文档、知乎文章等）
2. 点击浏览器工具栏中的插件图标
3. 在弹出的界面中点击"网页学习"按钮
4. 插件会自动提取页面内容并发送到配置的API接口
5. 页面会显示学习进度蒙层

### 配置API

1. 在插件弹窗中点击右上角的设置按钮（⚙️）
2. 输入API密钥和API地址
3. 点击保存

## API接口规范

插件会向配置的API地址发送POST请求，数据格式如下：

```json
{
  "content": {
    "title": "页面标题",
    "text": "提取的文本内容",
    "images": ["图片URL1", "图片URL2"],
    "url": "页面URL",
    "timestamp": 1234567890
  },
  "metadata": {
    "userAgent": "浏览器用户代理",
    "timestamp": 1234567890,
    "source": "chrome-extension"
  }
}
```

### API响应格式

```json
{
  "success": true,
  "message": "处理成功",
  "data": {
    "id": "处理结果ID"
  }
}
```

## 配置说明

### manifest.json

- `permissions`: 插件权限配置
- `host_permissions`: 允许访问的网站
- `content_scripts`: 注入到页面的脚本
- `background`: 后台服务脚本

### 自定义配置

在 `src/utils/apiService.ts` 中可以修改：
- 默认API地址
- API端点配置
- 请求头设置

## 开发指南

### 添加新功能

1. 在 `src/types/index.ts` 中定义相关类型
2. 在对应的模块中实现功能
3. 更新组件和样式
4. 测试功能

### 调试技巧

- 使用Chrome开发者工具查看Console输出
- Background脚本的日志在扩展程序页面的"检查视图"中查看
- Content脚本的日志在页面开发者工具中查看

## 常见问题

### Q: 插件无法正常工作？
A: 检查以下几点：
- 确保已正确安装插件
- 检查API配置是否正确
- 查看浏览器控制台是否有错误信息

### Q: 内容提取不完整？
A: 某些网站可能使用了动态加载或特殊结构，可以：
- 等待页面完全加载后再使用插件
- 检查网站是否有反爬虫机制

### Q: API请求失败？
A: 检查：
- API地址是否正确
- API密钥是否有效
- 网络连接是否正常
- API服务器是否正常运行

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的网页内容提取
- 实现Popup界面和蒙层效果
- 支持API配置和状态显示
