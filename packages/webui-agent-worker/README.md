# @moora/webui-agent-worker

基于 Vite、React 和 MUI 的 Agent WebUI

## 概述

这是一个简单的 Web UI，用于与 `@moora/service-agent-worker` 交互，提供：

- 消息列表展示
- 用户发送消息
- 通过 SSE 实时接收消息更新
- 使用 RFC6902 patch 高效更新状态

## 功能特性

- **实时更新**：通过 Server-Sent Events (SSE) 实时接收消息
- **高效更新**：使用 RFC6902 JSON Patch 进行增量更新
- **现代 UI**：基于 Material-UI (MUI) 的现代化界面
- **响应式设计**：适配不同屏幕尺寸

## 使用方法

### 开发模式

```bash
cd packages/webui-agent-worker
bun install
bun run dev
```

应用将在 `http://localhost:5173` 启动。

### 构建

```bash
bun run build
```

### 预览构建结果

```bash
bun run preview
```

## 配置

WebUI 通过代理连接到 service-agent-worker。默认配置：

- WebUI 端口：`5173`
- Agent Service 端口：`3000`（通过 `/api` 代理）

代理配置在 `vite.config.ts` 中：

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
  },
}
```

## 项目结构

```
src/
├── components/      # React 组件
│   ├── MessageList.tsx    # 消息列表组件
│   └── MessageInput.tsx   # 消息输入组件
├── types/          # 类型定义
│   └── index.ts
├── utils/          # 工具函数
│   ├── api.ts      # API 调用
│   └── sse.ts      # SSE 连接处理
├── App.tsx         # 主应用组件
└── main.tsx        # 应用入口
```

## 开发

确保 `@moora/service-agent-worker` 正在运行（默认端口 3000），然后启动 WebUI。

