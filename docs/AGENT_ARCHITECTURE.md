# Agent 架构设计文档

本文档描述了基于 Moorex 的 AI Agent 系统的架构设计，包括各个包的职责边界和相互之间的关系。

## 概述

Agent 系统被设计为多个独立的包，每个包都有明确的职责边界：

1. **@moora/agent-webui-protocol** - 协议定义层
2. **@moora/agent-core-state-machine** - 状态机定义层
3. **@moora/agent-core-app-controller** - 前端控制器层
4. **@moora/agent-core-fastify** - Fastify 集成层
5. **@moora/agent-webui** - 前端应用层
6. **@moora/agent-service** - 服务端层

这种分层设计实现了关注点分离，使得每个包都可以独立迭代和测试。

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    @moora/agent-webui                       │
│  (React + MUI 前端应用)                                       │
│  - 接收 AgentController (依赖注入)                           │
│  - 使用 useAgentController hook                              │
│  - 完全基于 protocol 定义的类型                               │
└────────────────────┬────────────────────────────────────────┘
                     │ 使用
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            @moora/agent-webui-protocol                      │
│  (协议定义层 - 类型定义)                                      │
│  - AgentAppState: 用户可见的状态                             │
│  - AgentAppEvent: 用户可触发的事件                           │
│  - AgentController: 前端控制器接口                           │
└───────┬───────────────────────────────┬──────────────────────┘
        │ 实现                          │ 使用
        ▼                               ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│ agent-core-app-controller│  │  agent-core-fastify          │
│  (前端控制器层)            │  │  (Fastify 集成层)            │
│  - mapAppState            │  │  - Agent Moorex              │
│  - interpretAppEvent      │  │  - effectsAt, runEffect      │
│  - createAgentController   │  │  - createAgentFastifyNode   │
│    - POST 发送 Input       │  │  - 基于 moorex-fastify       │
│    - SSE 监听事件          │  └───────────┬──────────────────┘
└───────────┬───────────────┘              │ 使用
            │ 使用                          │
            ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│         @moora/agent-core-state-machine                     │
│  (状态机定义层)                                               │
│  - AgentState, AgentInput (前后端共用)                      │
│  - initial, transition                                       │
│  - agentStateMachine                                         │
└────────────────────┬────────────────────────────────────────┘
                     │ 使用
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              @moora/agent-service                           │
│  (服务端层)                                                   │
│  - 使用 agent-core-fastify 创建 Fastify 节点                 │
│  - 配置 LLM 和 Tools                                         │
│  - 提供 HTTP API (POST + SSE)                               │
└─────────────────────────────────────────────────────────────┘
```

## 包职责详解

### 1. @moora/agent-webui-protocol

**职责边界：**
- ✅ 定义前端和后端之间的通信协议
- ✅ 定义用户可见的状态类型（AgentAppState）
- ✅ 定义用户可触发的事件类型（AgentAppEvent）
- ✅ 定义前端控制器接口（AgentController）
- ❌ 不包含任何实现逻辑
- ❌ 不依赖其他 Agent 相关包

**核心类型：**

```typescript
// 用户可见的状态
type AgentAppState = {
  status: 'idle' | 'thinking' | 'responding' | 'error';
  messages: AgentMessage[];
  error?: string;
  isProcessing: boolean;
};

// 用户可触发的事件
type AgentAppEvent =
  | { type: 'user-message'; content: string }
  | { type: 'cancel' }
  | { type: 'retry' }
  | { type: 'clear' };

// 前端控制器接口
type AgentController = {
  subscribe(handler: (state: AgentAppState) => void): Unsubscribe;
  notify(event: AgentAppEvent): void;
};
```

**设计原则：**
- 这是一个**纯类型定义包**，不包含任何运行时逻辑
- 前端应用完全基于这些类型定义，不预设实现
- 通过依赖注入的方式接收 `AgentController` 实例

### 2. @moora/agent-core-state-machine

**职责边界：**
- ✅ 定义 Agent 状态机（前后端共用）
- ✅ 定义 `AgentState`（内部状态，包含所有实现细节）
- ✅ 定义 `AgentInput`（状态机输入信号）
- ✅ 实现 `initial` 和 `transition` 函数
- ❌ 不包含 UI 实现
- ❌ 不包含服务端框架集成
- ❌ 不包含 Effects 处理逻辑

**核心内容：**
- `AgentState`: 完整的内部状态（LLM 历史、Tool 历史等）
- `AgentInput`: 所有可能的状态转换信号
- `agentStateMachine`: 状态机定义（initial, transition）
- 状态转换函数是纯函数，易于测试

**关键设计：**
- 前后端共用，确保状态同步
- 状态转换函数是纯函数，无副作用

### 3. @moora/agent-core-app-controller

**职责边界：**
- ✅ 实现前端控制器（将协议类型转换为内部类型）
- ✅ `mapAppState`: 将内部 `AgentState` 映射为用户可见的 `AgentAppState`
- ✅ `interpretAppEvent`: 将用户事件 `AgentAppEvent` 解释为内部 `AgentInput[]`
- ✅ `createAgentController`: 创建 `AgentController` 实例
- ✅ 通过 POST 请求发送 `AgentInput[]` 到服务端
- ✅ 通过 SSE 监听 `state-updated` 事件来更新状态
- ❌ 不包含 UI 实现
- ❌ 不包含服务端框架集成
- ❌ 不包含状态机定义（依赖 agent-core-state-machine）

**核心内容：**
- `createAgentController`: 创建前端控制器实例
- `mapAppState`: 状态映射函数，隐藏内部实现细节
- `interpretAppEvent`: 事件解释函数，将用户事件转换为内部输入

**通信流程：**
```
用户操作 → AgentAppEvent → interpretAppEvent → AgentInput[] → POST 请求
                                                                    ↓
状态更新 ← mapAppState ← AgentState ← SSE (state-updated) ← 服务端
```

### 4. @moora/agent-core-fastify

**职责边界：**
- ✅ 实现 Agent Moorex（Effects 处理逻辑）
- ✅ 定义 `AgentEffect` 类型（LLM 调用、Tool 调用等）
- ✅ 实现 `effectsAt`: 从 `AgentState` 计算当前需要的 Effects
- ✅ 实现 `runEffect`: 执行 Effect（调用 LLM、调用 Tool 等）
- ✅ 创建 Fastify 节点（基于 `@moora/moorex-fastify`）
- ❌ 不包含 UI 实现
- ❌ 不包含状态机定义（依赖 agent-core-state-machine）

**核心内容：**
- `AgentEffect`: Effect 类型定义（CallLLMEffect, CallToolEffect）
- `agentEffectsAt`: 从状态计算 Effects
- `createAgentRunEffect`: 创建 Effect 运行函数
- `createAgentMoorexDefinition`: 创建 Agent Moorex 定义
- `createAgentFastifyNode`: 创建 Fastify 节点

**关键设计：**
- Effects 不包含向用户发送消息（前端通过同步状态获取消息）
- Effects 主要包括：
  - `CallLLMEffect`: 调用 LLM
  - `CallToolEffect`: 调用 Tool
- `effectsAt` 函数根据状态决定需要执行哪些 Effects
- `runEffect` 函数执行 Effect 并通过 `dispatch` 产生新的 `AgentInput`
- 基于 `@moora/moorex-fastify` 提供 Fastify 集成

### 5. @moora/agent-webui

**职责边界：**
- ✅ 实现基于 React + MUI 的前端 UI
- ✅ 完全基于 `@moora/agent-webui-protocol` 的类型
- ✅ 通过依赖注入接收 `AgentController`
- ✅ 提供 `useAgentController` hook
- ❌ 不包含 Agent 业务逻辑
- ❌ 不直接依赖 `@moora/agent-core-*` 包

**核心设计：**
- 前端应用不预设 `AgentController` 的实现
- 在创建应用实例时注入 `AgentController`
- 通过 `useAgentController` hook 获取状态和发送事件的回调

**示例：**
```typescript
import { createAgentController } from '@moora/agent-core-app-controller';

// 应用入口
function App({ controller }: { controller: AgentController }) {
  const { state, notify } = useAgentController(controller);
  
  return (
    <div>
      {/* UI 实现 */}
    </div>
  );
}

// 创建应用
const controller = createAgentController({ endpoint: '/api/agent' });
ReactDOM.render(<App controller={controller} />, root);
```

### 6. @moora/agent-service

**职责边界：**
- ✅ 集成 `@moora/moorex-fastify` 提供 HTTP API
- ✅ 使用 `@moora/agent-core-fastify` 创建 Fastify 节点
- ✅ 配置 LLM 和 Tool 的具体实现
- ✅ 启动 Fastify 服务器
- ❌ 不包含前端 UI
- ❌ 不包含核心业务逻辑（由 agent-core 提供）

**核心设计：**
- 使用 `@moora/agent-core-fastify` 创建 Agent Fastify 节点
- 配置 LLM 和 Tools
- 提供 HTTP API (POST + SSE)

**示例：**
```typescript
import { createAgentFastifyNode } from '@moora/agent-core-fastify';

// 创建 Agent Fastify 节点
const agentNode = createAgentFastifyNode({
  moorexOptions: {
    callLLM: async ({ prompt, messages, toolCalls, tools }) => {
      // 调用 LLM API，可使用完整的 AgentState 上下文
      return {
        observation: { type: "complete-re-act" },
        response: "Response",
      };
    },
    tools: {
      search: {
        name: 'search',
        description: 'Search tool',
        execute: async (args) => {
          // 执行 Tool
          return 'Result';
        },
      },
    },
  },
});

// 注册到 Fastify
await fastify.register(agentNode.register, { prefix: '/api/agent' });
```

## 数据流

### 用户发送消息流程

```
1. 用户在 UI 中输入消息
   ↓
2. UI 调用 controller.notify({ type: 'user-message', content: '...' })
   ↓
3. App Controller 的 interpretAppEvent 将事件转换为 AgentInput[]
   ↓
4. App Controller 通过 POST 请求发送 AgentInput[] 到服务端
   ↓
5. 服务端的 handlePost 接收请求，调用 moorex.dispatch(input)
   ↓
6. Moorex 执行状态转换：transition(input)(state) → newState
   ↓
7. Moorex 计算新的 Effects：effectsAt(newState) → Record<string, Effect>
   ↓
8. Moorex 启动新的 Effects（如 CallLLMEffect）
   ↓
9. runEffect 执行 Effect（调用 LLM API）
   ↓
10. LLM 响应后，runEffect 调用 dispatch({ type: 'llm-response', ... })
   ↓
11. Moorex 再次执行状态转换，更新消息列表
   ↓
12. Moorex 发布 state-updated 事件
   ↓
13. 服务端通过 SSE 将事件发送给前端
   ↓
14. App Controller 接收 state-updated 事件，调用 mapAppState
   ↓
15. App Controller 发布新的 AgentAppState
   ↓
16. UI 通过 subscribe 接收更新，重新渲染
```

### 状态同步机制

- **前端 → 后端：** POST 请求发送 `AgentInput[]`
- **后端 → 前端：** SSE 流发送 `state-updated` 事件
- **状态映射：** `AgentState` (内部) ↔ `AgentAppState` (用户可见)

## 依赖关系

```
@moora/agent-webui
  └─> @moora/agent-webui-protocol (仅类型)

@moora/agent-core-app-controller
  ├─> @moora/moorex (PubSub)
  ├─> @moora/agent-webui-protocol (协议类型)
  └─> @moora/agent-core-state-machine (状态机类型)

@moora/agent-core-fastify
  ├─> @moora/moorex (核心状态机)
  ├─> @moora/moorex-fastify (Fastify 集成)
  └─> @moora/agent-core-state-machine (状态机)

@moora/agent-service
  ├─> @moora/agent-core-fastify (Fastify 节点)
  └─> fastify (Web 框架)

@moora/agent-core-state-machine
  └─> @moora/moorex (StateMachine 类型)

@moora/agent-webui-protocol
  └─> (无依赖，纯类型定义)
```

## 设计原则

### 1. 关注点分离

每个包都有明确的职责边界，互不干扰：
- **Protocol**: 只定义接口，不包含实现
- **State Machine**: 只包含状态机定义，不包含 UI 或框架集成
- **App Controller**: 只包含前端控制器实现，不包含 UI 或状态机定义
- **Fastify**: 只包含 Fastify 集成和 Effects 处理，不包含 UI 或状态机定义
- **WebUI**: 只包含 UI 实现，不包含业务逻辑
- **Service**: 只包含服务端集成，不包含业务逻辑

### 2. 依赖注入

前端应用不预设 `AgentController` 的实现，通过依赖注入的方式接收：
- 便于测试（可以注入 mock controller）
- 便于替换实现（可以有不同的 controller 实现）
- 降低耦合度

前端控制器通过 `@moora/agent-core-app-controller` 创建，完全基于协议定义。

### 3. 类型安全

所有包之间的交互都通过明确的类型定义：
- Protocol 包定义前端接口类型
- State Machine 包定义状态机类型（前后端共用）
- App Controller 包实现前端控制器接口
- Fastify 包实现服务端集成
- 其他包使用这些类型确保类型安全

### 4. 前后端状态同步

通过共享状态机定义确保前后端状态一致：
- `AgentState` 和 `AgentInput` 在 `agent-core-state-machine` 中定义，前后端共用
- 前端通过 `mapAppState`（在 `agent-core-app-controller` 中）隐藏内部细节
- 后端通过 SSE（在 `agent-core-fastify` 中）实时同步状态

## 扩展性

### 迭代不同版本的 Agent

由于状态机在 `@moora/agent-core-state-machine` 中，可以创建多个版本的实现：

```typescript
// agent-core-state-machine/src/v1/state-machine.ts
export const agentStateMachineV1 = { ... };

// agent-core-state-machine/src/v2/state-machine.ts
export const agentStateMachineV2 = { ... };
```

### 替换前端实现

由于前端完全基于 Protocol 定义，可以轻松替换前端实现：

```typescript
// 使用 React
import { createAgentController } from '@moora/agent-core-app-controller';
const controller = createAgentController({ endpoint: '/api/agent' });

// 使用 Vue
// 同样的 controller 接口，不同的 UI 框架
```

### 替换后端框架

由于服务端逻辑在 `agent-core-fastify` 中，可以轻松替换后端框架：

```typescript
// 当前：基于 Fastify
import { createAgentFastifyNode } from '@moora/agent-core-fastify';

// 未来：可以创建 @moora/agent-core-express
import { createAgentExpressNode } from '@moora/agent-core-express';
```

## 总结

这个架构设计实现了：

1. **清晰的职责边界**：每个包都有明确的职责
2. **松耦合**：通过协议和依赖注入降低耦合
3. **类型安全**：所有交互都通过类型定义
4. **易于测试**：每个包都可以独立测试
5. **易于扩展**：可以轻松迭代和替换实现

通过这种分层设计，我们可以：
- 独立开发和测试每个包
- 轻松替换实现（如不同的 UI 框架、不同的后端框架）
- 保持代码的可维护性和可扩展性

