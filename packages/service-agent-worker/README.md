# @moora/service-agent-worker

基于 ElysiaJS 的 Agent Service 实现

## 概述

这个包提供了一个基于 ElysiaJS 的 Agent Service，包含三个主要路由：

- `GET /agent` - SSE 接口，推送 `PerspectiveOfUser` 的变化
- `POST /send` - 接收用户输入并驱动 Agent 状态机
- `GET /streams/:messageId` - SSE 接口，推送流式消息的 chunk

## 功能特性

- **SSE 推送**：通过 Server-Sent Events 实时推送 `PerspectiveOfUser` 的变化
- **RFC6902 Patch**：使用 JSON Patch 格式高效传输状态变化
- **OpenAI 集成**：自动调用 OpenAI API 生成 LLM 回复
- **ReAct Loop**：支持工具调用的 ReAct 循环
- **状态管理**：基于 `@moora/agent-worker` 的状态机实现

## 使用方法

```typescript
import { createService } from '@moora/service-agent-worker';

const app = createService({
  openai: {
    endpoint: {
      url: 'https://api.openai.com/v1',
      key: process.env.OPENAI_API_KEY!,
    },
    model: 'gpt-4',
  },
  prompt: 'You are a helpful assistant.',
  // Optional: Tavily API key for web search tool
  tavilyApiKey: process.env.TAVILY_API_KEY,
});

app.listen(3000);
```

## 架构

该服务使用 `@moora/agent-worker` 的内置 reaction 工厂函数：

```typescript
import {
  createAgent,
  createReaction,
  createUserReaction,
  createLlmReaction,
  createToolkitReaction,
} from '@moora/agent-worker';

const reaction = createReaction({
  user: createUserReaction({
    notifyUser: (perspective) => {
      // 发送 RFC6902 patch 到客户端
    },
  }),
  llm: createLlmReaction({
    callLlm: async (context, callbacks) => {
      // 调用 OpenAI API
    },
  }),
  toolkit: createToolkitReaction({
    callTool: async (request) => {
      // 执行工具调用
    },
  }),
});

const agent = createAgent(reaction);
```

## API

### GET /agent

SSE 接口，连接时发送当前全量的 `PerspectiveOfUser`，之后通过 RFC6902 patch 推送变化。

**响应格式**：

```json
// 初始全量数据
{
  "type": "full",
  "data": {
    "userMessages": [...],
    "assiMessages": [...]
  }
}

// 后续 patch
{
  "type": "patch",
  "patches": [...]
}
```

### POST /send

接收用户消息并驱动 Agent 状态机。

**请求体**：

```json
{
  "content": "Hello, world!"
}
```

**响应**：

```json
{
  "id": "message-id",
  "timestamp": 1234567890
}
```

### GET /streams/:messageId

SSE 接口，订阅特定消息的流式内容。

**响应格式**：

```json
// 流式 chunk
{ "type": "chunk", "content": "Hello" }

// 流结束
{ "type": "end", "content": "Hello, how can I help you?" }
```

## 开发

```bash
# 安装依赖
bun install

# 运行测试
bun test
```

