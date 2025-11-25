# @moora/moorex-fastify

[![npm version](https://img.shields.io/npm/v/@moora/moorex-fastify.svg)](https://www.npmjs.com/package/@moora/moorex-fastify)
[![npm downloads](https://img.shields.io/npm/dm/@moora/moorex-fastify.svg)](https://www.npmjs.com/package/@moora/moorex-fastify)
[![test coverage](https://img.shields.io/codecov/c/github/shazhou-ww/moora?flag=moorex-fastify)](https://codecov.io/gh/shazhou-ww/moora)
[![license](https://img.shields.io/npm/l/@moora/moorex-fastify.svg)](https://github.com/shazhou-ww/moora/blob/main/packages/moorex-fastify/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Moorex 的 Fastify 插件 - 通过 HTTP API 和 Server-Sent Events (SSE) 暴露 Moorex 状态和信号。

**注意**: 此包已从 `createMoorexFastify` 重命名为 `createMoorexNode`，以更好地反映其用途。

## 安装

```bash
npm install @moora/moorex-fastify @moora/moorex fastify
# 或
bun add @moora/moorex-fastify @moora/moorex fastify
# 或
yarn add @moora/moorex-fastify @moora/moorex fastify
```

## 特性

- **GET 端点**: Server-Sent Events (SSE) 流：
  - 连接时立即发送当前全量状态
  - 推送所有后续的 Moorex 事件（状态更新、effect 生命周期等）
  
- **POST 端点**: 接收信号以触发状态转换（可选）

- **灵活挂载**: 可以挂载到 Fastify 应用的任何路径上

- **两种模式**: 创建只读 node（仅 GET）或读写 node（GET + POST）

## 使用

### Node 模式

你可以创建两种类型的 node：

1. **只读 node**：仅暴露 GET 端点（SSE 流）。当你只想暴露状态和事件，但不想接受外部信号时使用。

2. **读写 node**：同时暴露 GET（SSE）和 POST 端点。当你想要接受客户端信号以触发状态转换时使用。

### 基础示例

```typescript
import Fastify from 'fastify';
import { createMoorexNode } from '@moora/moorex-fastify';
import { createMoorex, type MoorexDefinition } from '@moora/moorex';
import { createEffectRunner } from '@moora/moorex';
import { create } from 'mutative';

// 定义你的 Moorex 机器
type State = { count: number };
type Signal = { type: 'increment' } | { type: 'decrement' };
type Effect = never;

const definition: MoorexDefinition<State, Signal, Effect> = {
  initiate: () => ({ count: 0 }),
  transition: (signal) => (state) => {
    if (signal.type === 'increment') {
      return create(state, (draft) => {
        draft.count += 1;
      });
    }
    if (signal.type === 'decrement') {
      return create(state, (draft) => {
        draft.count -= 1;
      });
    }
    return state;
  },
  effectsAt: () => ({}),
};

// 创建 Moorex 实例并配置 effects
const moorex = createMoorex(definition);
// 如果需要，在这里配置你的 effects
// moorex.subscribe(createEffectRunner(runEffect));

// 创建 Fastify 应用
const fastify = Fastify({ logger: true });

// 创建并注册 MoorexNode
const moorexNode = createMoorexNode({
  moorex,
  handlePost: async (input, dispatch) => {
    const signal = JSON.parse(input);
    dispatch(signal);
    return { 
      code: 200, 
      content: JSON.stringify({ success: true }) 
    };
  },
});

// 挂载到任意路径
await fastify.register(moorexNode.register, { prefix: '/api/moorex' });

// 启动服务器
await fastify.listen({ port: 3000 });
```

### API 端点

#### GET `/api/moorex/`（或你的自定义前缀）

建立 SSE 连接，流式传输 Moorex 事件：

1. **初始状态**: 连接时，立即发送一个包含当前全量状态的 `state-updated` 事件
2. **后续事件**: 流式传输所有发生的 Moorex 事件：
   - `signal-received`: 收到信号
   - `state-updated`: 状态已更新
   - `effect-started`: Effect 已启动
   - `effect-canceled`: Effect 已取消

**SSE 事件格式示例:**
```
data: {"type":"state-updated","state":{"count":5}}
```

**客户端示例:**
```typescript
const eventSource = new EventSource('http://localhost:3000/api/moorex/');

eventSource.onmessage = (event) => {
  const moorexEvent = JSON.parse(event.data);
  console.log('Moorex 事件:', moorexEvent);
};

eventSource.addEventListener('state-updated', (event) => {
  const { state } = JSON.parse(event.data);
  console.log('状态已更新:', state);
});
```

#### POST `/api/moorex/`（或你的自定义前缀）

通过可选的 `handlePost` 回调接收并处理 POST 请求。

**注意**: 只有在创建 MoorexNode 实例时提供了 `handlePost` 回调，POST 端点才可用。

**请求体:**
请求体作为字符串传递给 `handlePost` 回调。可以是 JSON 或其他格式，取决于你的实现。

**示例:**
```typescript
const response = await fetch('http://localhost:3000/api/moorex/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'increment' }),
});

const result = await response.text(); // 响应内容由 handlePost 决定
```

### 访问 Moorex 实例

由于你在创建 node 时传入了 Moorex 实例，所以它已经可用：

```typescript
const moorex = createMoorex(definition);

// 在创建 node 之前配置 effects
moorex.subscribe(createEffectRunner(runEffect));

const moorexNode = createMoorexNode({ moorex, handlePost });

// 如果需要，你仍然可以访问它
const sameMoorex = moorexNode.moorex;

// 通过编程方式分发信号
moorex.dispatch({ type: 'increment' });

// 获取当前状态
const state = moorex.getState();
```

### 只读 Node（仅 GET）

当你只想通过 SSE 暴露状态和事件，而不接受外部信号时，创建一个只读 node：

```typescript
// 创建只读 node - 只有 GET 端点可用
const readOnlyNode = createMoorexNode({
  moorex,
  // 没有 handlePost - POST 路由不会被注册
});

await fastify.register(readOnlyNode.register, { prefix: '/api/moorex/read' });
```

这适用于：
- 监控/调试端点
- 只需要观察状态的仪表板
- 不接受外部输入的内部服务

### 读写 Node（GET + POST）

当你想要接受客户端的信号时，创建一个读写 node：

```typescript
// 创建读写 node - GET 和 POST 端点都可用
const readWriteNode = createMoorexNode({
  moorex,
  handlePost: async (input, dispatch) => {
    const signal = JSON.parse(input);
    dispatch(signal);
    return { 
      code: 200, 
      content: JSON.stringify({ success: true }) 
    };
  },
});

await fastify.register(readWriteNode.register, { prefix: '/api/moorex/write' });
```

这适用于：
- 接受用户输入的公共 API
- 需要触发状态更改的客户端应用程序
- 交互式服务

## API 参考

### `createMoorexNode(options)`

创建 MoorexNode 实例。

**参数:**
- `options.moorex`: `Moorex<State, Signal, Effect>` - 已存在的 Moorex 实例（如果需要，effects 应已配置）
- `options.handlePost?`: `HandlePost<Signal>` - 可选的 POST 请求处理器

**返回:** `MoorexNode<State, Signal, Effect>`

### `HandlePost<Signal>`

POST 处理器回调的类型：

```typescript
type HandlePost<Signal> = (
  input: string,
  dispatch: (signal: Signal) => void,
) => Promise<PostResponse>;
```

**参数:**
- `input`: `string` - POST 请求体（字符串格式）
- `dispatch`: `(signal: Signal) => void` - 用于向 Moorex 实例分发信号的函数

**返回:** `Promise<PostResponse>`，其中 `PostResponse` 是：
```typescript
{
  code: number;    // HTTP 状态码
  content: string; // 响应体（字符串格式）
}
```

### `MoorexNode.register(fastify, options?)`

将插件注册到 Fastify。这是一个标准的 Fastify 插件函数。

**参数:**
- `fastify`: `FastifyInstance` - Fastify 实例
- `options.prefix?`: `string` - 可选的路由前缀（例如，`/api/moorex`）

## 许可证

MIT

