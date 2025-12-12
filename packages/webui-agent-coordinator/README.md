# @moora/webui-agent-coordinator

Coordinator Agent WebUI based on Vite, React and MUI

## 概述

这是 Coordinator Agent 的 Web 用户界面，基于 React、Material-UI 和 Vite 构建。

与 `webui-agent-worker` 的主要区别：
- 使用 `PerspectiveOfUser` 类型（只包含 `userMessages`）
- 适配 Coordinator Agent 的状态结构
- 连接到 `service-agent-coordinator` 后端服务

## 功能特性

- **实时消息展示**: 通过 SSE 接收状态更新
- **RFC6902 增量更新**: 高效的状态同步
- **流式消息支持**: 实时显示 LLM 生成内容
- **响应式设计**: 基于 Material-UI 的现代界面

## 安装

```bash
bun install
```

## 开发

```bash
bun run dev
```

默认连接到 `http://localhost:3000`（service-agent-coordinator）

## 构建

```bash
bun run build
```

## 预览

```bash
bun run preview
```

## 环境变量

创建 `.env` 文件：

```bash
# API 端点
VITE_API_URL=http://localhost:3000
```

## 技术栈

- **React 18**: UI 框架
- **Material-UI**: 组件库
- **Vite**: 构建工具
- **TypeScript**: 类型安全
- **react-markdown**: Markdown 渲染
- **rfc6902**: JSON Patch 支持

## License

MIT
