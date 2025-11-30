# Agent Core State Machine

Agent 核心状态机实现，定义 ReAct Loop Agent 的状态和状态转换逻辑。

## ReAct Loop 设计

ReAct: Reason + Act，推理 + 行动的交替决策模式。

在我们的 Agent 的 ReAct Loop 中：

- **Act（行动）**：以 streaming 的方式向用户输出返回
- **Reason（推理）**：通过 Tool call 做出行为或者收集信息

### Tools 分类

我们的 Tools 分成内部和外部两类：

#### 内部工具

- **不需要配置**，在 LLM call 的时候直接注入
- **用途**：用来扩展 & 调整 Agent 自身的上下文
  - 例如：加载更久远的聊天记录
  - 例如：查询更久远的 Tool call 信息
  - 例如：加载某个历史 Tool call 的结果
- **调用方式**：LLM 调用时，内部工具的调用可能会以非标准的方式影响 LLM 的上下文
  - 例如：prepend 历史消息
  - 例如：增加伪 Tool call 轮次以插入某个历史 Tool call 的结果
- **历史记录**：内部工具调用本身**不会**加入历史 Tool call

#### 外部工具

- **需要配置**：在创建 Agent 的时候配置
- **配置内容**：
  - `name`: 工具名称
  - `description`: 工具描述（string）
  - `schema`: 参数 JSON Schema（string，序列化的 JSON Schema）
- **执行方式**：以 `string in/string out` 的方式异步执行
- **调用方式**：LLM 调用时，外部工具的调用一定是以标准 tool call 的形式插入在 LLM 上下文中
  - 一条 `assistant message`（包含 tool call）
  - 一条 `tool message`（包含 tool call 结果）
- **历史记录**：外部工具调用**全部**加入历史 Tool call

## 状态定义

### AgentState

Agent 的完整内部状态，包含：

1. **历史消息** (`messages`)
   - 类型：`AgentMessage[]`
   - 按时间戳排序的数组，包含所有用户和助手消息
   - 复用 `@agent-webui-protocol` 的 `AgentMessage` 类型

2. **外部工具** (`tools`)
   - 类型：`Record<string /* name */, ToolDefinition>`
   - 包含所有已加载的外部工具定义
   - `ToolDefinition` 包括：
     - `description`: `string` - 工具描述
     - `schema`: `string` - 参数 JSON Schema（序列化的 JSON Schema string）

3. **历史 Tool Call 记录** (`toolCalls`)
   - 类型：`Record<string /* toolCallId */, ToolCallRecord>`
   - 包含所有外部工具调用的历史记录
   - `ToolCallRecord` 包括：
     - `name`: `string` - 工具名称
     - `parameters`: `string` - 参数（序列化为 string）
     - `timestamp`: `number` - 调用时间戳
     - `result`: `ToolCallSuccess | ToolCallFailed | null` - 调用结果
       - `ToolCallSuccess`: `{ isSuccess: true, content: string }`
       - `ToolCallFailed`: `{ isSuccess: false, error: string }`

4. **当前 ReAct Loop 上下文** (`reActContext`)
   - `contextWindowSize`: `number` - 上下文窗口大小，表示应该包含最近多少条消息
   - `toolCallIds`: `string[]` - 涉及到的 Tool Calls（Tool Call Id 列表）

## 输入定义

### AgentInput

Agent 状态机可以接收的输入，使用 Discriminated Union 类型：

1. **收到用户消息** (`user-message`)
   - 当用户发送消息时触发
   - 包含消息内容

2. **LLM 发送给 User 的 Chunk** (`llm-chunk`)
   - 当 LLM 流式输出时，每个 chunk 触发一次
   - 包含 chunk 内容

3. **LLM 发送给 User 的消息完成** (`llm-message-complete`)
   - 当 LLM 完成一条消息的流式输出时触发
   - 表示当前消息不再有更多 chunks

4. **发起 ToolCall（外部）** (`tool-call-started`)
   - 当开始调用外部工具时触发
   - 包含工具名称、参数等

5. **收到 ToolCall 结果（外部）** (`tool-call-result`)
   - 当外部工具调用完成时触发
   - 包含成功或失败的结果

6. **扩展上下文窗口** (`expand-context-window`)
   - 当需要扩展当前 ReAct Loop 上下文窗口时触发
   - 扩展的增量由 `agentTransition` 函数的 `expandContextWindowSize` 参数定义

7. **加载历史 ToolCall 结果到当前 ReAct Loop** (`add-tool-calls-to-context`)
   - 当需要将历史 Tool Call 添加到当前 ReAct Loop 上下文时触发
   - 包含要添加的 Tool Call ID 列表

## 文件结构

状态机按照四个关键元素拆分文件：

```text
src/
  state.ts          # State 类型定义（使用 zod schema）
  input.ts          # Input/Event 类型定义（使用 zod schema）
  initial.ts        # initial 函数
  transition.ts     # transition 函数
  index.ts          # 导出
```

## 类型定义规范

- 所有类型使用 **zod@^4** schema 定义
- 通过 `z.infer` 导出 TypeScript 类型
- 复用 `@agent-webui-protocol` 定义的数据类型和 schema
- 遵循 Moorex 代码风格规范

## 使用示例

### 基本使用

```typescript
import { createMoorex } from "@moora/moorex";
import { initialAgentState, agentTransition } from "@moora/agent-core-state-machine";

const moorex = createMoorex({
  initial: initialAgentState,
  transition: agentTransition,
  effectsAt: (state) => {
    // 副作用计算逻辑
    return {};
  },
  runEffect: (effect, state, key) => {
    // 副作用执行逻辑
    return {
      start: async (dispatch) => {},
      cancel: () => {},
    };
  },
});
```

### 发送事件

```typescript
// 发送用户消息
moorex.dispatch({
  type: "user-message",
  messageId: "msg-1",
  content: "Hello, Agent!",
  timestamp: Date.now(),
});

// 发送 LLM chunk
moorex.dispatch({
  type: "llm-chunk",
  messageId: "msg-2",
  chunk: "Hello, ",
});

// 发送 LLM 消息完成
moorex.dispatch({
  type: "llm-message-complete",
  messageId: "msg-2",
});

// 发起 Tool Call
moorex.dispatch({
  type: "tool-call-started",
  toolCallId: "tool-1",
  name: "search",
  parameters: JSON.stringify({ query: "example" }),
  timestamp: Date.now(),
});

// 收到 Tool Call 结果
moorex.dispatch({
  type: "tool-call-result",
  toolCallId: "tool-1",
  result: {
    isSuccess: true,
    content: "Search results...",
  },
});
```

### 访问状态

```typescript
// 获取当前状态
const state = moorex.current();

// 访问历史消息
const messages = state.messages;

// 访问外部工具
const tools = state.tools;

// 访问历史 Tool Call
const toolCalls = state.toolCalls;

// 访问当前 ReAct Loop 上下文
const context = state.reActContext;
```

## API 参考

### 类型导出

#### State 类型

- `AgentState` - Agent 完整状态
- `ToolDefinition` - 工具定义
- `ToolCallRecord` - Tool Call 记录
- `ToolCallResult` - Tool Call 结果（成功/失败）
- `ReActContext` - ReAct Loop 上下文

#### Input 类型

- `AgentInput` - 所有输入类型的联合类型
- `UserMessageInput` - 用户消息输入
- `LlmChunkInput` - LLM chunk 输入
- `LlmMessageCompleteInput` - LLM 消息完成输入
- `ToolCallStartedInput` - Tool Call 开始输入
- `ToolCallResultInput` - Tool Call 结果输入
- `ExpandContextWindowInput` - 扩展上下文窗口输入
- `AddToolCallsToContextInput` - 追加 Tool Call 到上下文输入

### Schema 导出

所有类型都有对应的 Zod schema，可用于运行时验证：

- `agentStateSchema` - Agent 状态 schema
- `agentEventSchema` - Agent 事件 schema
- `toolDefinitionSchema` - 工具定义 schema
- `toolCallRecordSchema` - Tool Call 记录 schema
- `reActContextSchema` - ReAct Loop 上下文 schema
- 等等...

### 函数导出

- `initialAgentState()` - 返回初始状态
- `agentTransition(input)` - 状态转换函数
