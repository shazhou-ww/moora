# @moora/service-agent-coordinator

基于 ElysiaJS 的 Coordinator Agent Service 实现

## 概述

这个包提供了一个基于 ElysiaJS 的 Coordinator Agent Service，使用 MOOREX 方法论实现多 Actor 协调系统。包含三个主要 Actor：

- **User Actor**: 处理用户输入和通知
- **LLM Actor**: 处理 LLM 调用和流式响应
- **Toolkit Actor**: 处理工具调用
- **Workforce Actor**: 处理任务管理和调度

## 功能特性

- **多 Actor 协调**: 基于 MOOREX 方法论的 Actor 协调系统
- **SSE 推送**: 通过 Server-Sent Events 实时推送 `PerspectiveOfUser` 的变化
- **RFC6902 Patch**: 使用 JSON Patch 格式高效传输状态变化
- **OpenAI 集成**: 自动调用 OpenAI API 生成 LLM 回复
- **流式响应**: 支持实时流式消息输出
- **工具调用**: 支持 ReAct 循环中的工具调用
- **任务管理**: 集成 Workforce 进行复杂任务调度

## 使用方法

```typescript
import { createService } from '@moora/service-agent-coordinator';

const app = createService({
  openai: {
    endpoint: {
      url: 'https://api.openai.com/v1',
      key: process.env.OPENAI_API_KEY!,
    },
    model: 'gpt-4',
  },
  prompt: 'You are a helpful coordinator assistant.',
  // Optional: Tavily API key for web search tool
  tavilyApiKey: process.env.TAVILY_API_KEY,
});

app.listen(3000);
```

## 架构

该服务使用 `@moora/agent-coordinator` 的 reaction 系统：

```typescript
import { createAgent, createReaction } from '@moora/agent-coordinator';

const reactions = createReactions({
  callLlm: async (context, callbacks) => {
    // 调用 OpenAI API
  },
  toolkit,
  workforce,
  publishPatch: (patch) => {
    // 发送 RFC6902 patch 到客户端
  },
});

const reaction = createReaction(reactions);
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
    "assiMessages": [...],
    "toolResults": [...],
    "ongoingTopLevelTasks": [...]
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
{ "type": "chunk", "chunk": "Hello" }

// 流结束
{ "type": "end", "content": "Hello, how can I help you?" }
```

## 开发

```bash
# 安装依赖
bun install

# 运行测试
bun test

# 开发模式
bun run dev
```

## License

MIT
