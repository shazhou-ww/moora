# Moorex 自动机建模方法论 - 七步建模法

## 背景与目标

### 要解决的问题

1. **状态迁移问题**：Agent 服务有状态，不能在不同的 Service Node 之间自由迁移，影响弹性扩容
2. **上下文复杂度**：随着 Agent 能力的增强，上下文模型越来越复杂

### 解决方案

通过七步建模法，将复杂的 AI Agent 建模为无状态可恢复的 Moore 状态机，实现：
- 状态可序列化和恢复
- 服务节点间可自由迁移
- 清晰的建模流程和规范

## 速记口诀

```
对节点 (1)，理 I/O (2)
识别单向信息流 (3)
聚焦通道关注点 (4)
节点状态推着走 (5)
最后统合去冗余 (6)
精巧模型便在手 (7)
```

## 实施流程

**重要：AI Agent 必须严格按照以下流程执行**

### 开始前的准备

1. **创建初始检查清单**：
   - 在开始建模前，AI Agent 必须先创建一个包含所有 7 个步骤的检查清单
   - 使用 `todo_write` 工具创建任务列表，每个步骤作为一个独立任务
   - 检查清单应该包含每个步骤的预期输出和完成标准

2. **逐步执行**：
   - **必须严格按照步骤顺序执行**，不能跳过或合并步骤
   - 每完成一个步骤，必须：
     1. 更新检查清单，标记当前步骤为完成
     2. **暂停执行**，等待用户审查和确认
     3. 只有在用户明确确认后，才能继续下一步

3. **审查要点**：
   - 每步完成后，向用户展示：
     - 该步骤的输出结果
     - 是否符合预期
     - 是否需要调整
   - 等待用户反馈后再继续

### 执行规则

- ⚠️ **每步完成后必须暂停**：完成一个步骤后，AI Agent 必须停止执行，等待用户审查
- ✅ **用户确认后才能继续**：只有在用户明确表示"继续"、"下一步"或类似指令后，才能继续下一个步骤
- 📋 **保持检查清单更新**：每完成一步，立即更新检查清单状态
- 🔍 **展示关键输出**：每步完成后，清晰展示该步骤的关键输出和决策

## 步骤详解

### 步骤 1：对节点

**目标**：发现 Agent 交互中有哪些参与方

**关键点**：
- 识别所有参与交互的节点（如：用户、Agent、工具等）
- 每个参与方都可能会发起异步的 I/O 过程
- 明确每个节点的职责和边界
- **重要**：所有节点都应该是业务层面的概念，而不是技术架构层面的概念（如数据库、缓存、消息队列等）

**输出**：
- String enum 类型：`type Participants = typeof USER | typeof AGENT | typeof TOOLKIT`
- 参与者常量定义

**示例**：
```typescript
const USER = "user";
const AGENT = "agent";
const TOOLKIT = "toolkit";

type Participants = typeof USER | typeof AGENT | typeof TOOLKIT;
```

**⚠️ 完成此步骤后，必须：**
1. 更新检查清单，标记步骤 1 为完成
2. **暂停执行**，向用户展示识别的节点列表和职责描述
3. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 2

### 步骤 2：理 I/O

**目标**：梳理清楚每个参与方的 I/O 数据格式

**关键点**：
- **重要**：这里的 Input/Output 不是来自这个参与方的 Input 和对这个参与方的 Output，而是这个参与方作为一个异步 Actor，它接收的 Input 和产生的 Output
- 例如：
  - `InputForUser`：就是 UI State，最简单的就是 messages 列表
  - `OutputFromUser`：就是 User Actions，比如 send user message，cancel streaming message
- 所有类型必须使用 **Zod@4 Schema** 定义
- 定义工具类型用于类型推导

**输出**：
- 每个参与者的 `InputFor<P>` 类型（使用 Zod@4 Schema）
- 每个参与者的 `OutputFrom<P>` 类型（使用 Zod@4 Schema）
- 工具类型：`type InputFor<P extends Participant> = ...`
- 工具类型：`type OutputFrom<P extends Participant> = ...`
- 工具类型：`type RunEffectFn<P extends Participant> = (input: InputFor<P>) => Promise<OutputFrom<P>>`

**示例**：
```typescript
import { z } from "zod";

// User 节点的 I/O Schema
const inputForUserSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    content: z.string(),
    role: z.enum(["user", "assistant"]),
  })),
});

const outputFromUserSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("sendMessage"),
    message: z.string(),
  }),
  z.object({
    type: z.literal("cancelStreaming"),
    messageId: z.string(),
  }),
]);

type InputForUser = z.infer<typeof inputForUserSchema>;
type OutputFromUser = z.infer<typeof outputFromUserSchema>;

// Agent 节点的 I/O Schema
const inputForAgentSchema = z.object({
  userMessages: z.array(z.string()),
  toolResults: z.array(z.object({
    toolName: z.string(),
    result: z.string(),
  })),
});

const outputFromAgentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("callTool"),
    toolName: z.string(),
    args: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("sendMessage"),
    message: z.string(),
  }),
]);

type InputForAgent = z.infer<typeof inputForAgentSchema>;
type OutputFromAgent = z.infer<typeof outputFromAgentSchema>;

// Toolkit 节点的 I/O Schema（示例）
const inputForToolkitSchema = z.object({
  pendingToolCalls: z.array(z.object({
    toolName: z.string(),
    args: z.record(z.unknown()),
  })),
});

const outputFromToolkitSchema = z.object({
  type: z.literal("toolResult"),
  toolName: z.string(),
  result: z.string(),
});

type InputForToolkit = z.infer<typeof inputForToolkitSchema>;
type OutputFromToolkit = z.infer<typeof outputFromToolkitSchema>;

// 工具类型
type InputFor<P extends Participants> = 
  P extends typeof USER ? InputForUser :
  P extends typeof AGENT ? InputForAgent :
  P extends typeof TOOLKIT ? InputForToolkit :
  never;

type OutputFrom<P extends Participants> = 
  P extends typeof USER ? OutputFromUser :
  P extends typeof AGENT ? OutputFromAgent :
  P extends typeof TOOLKIT ? OutputFromToolkit :
  never;

type RunEffectFn<P extends Participants> = (
  input: InputFor<P>
) => Promise<OutputFrom<P>>;
```

**⚠️ 完成此步骤后，必须：**
1. 更新检查清单，标记步骤 2 为完成
2. **暂停执行**，向用户展示所有节点的 I/O 类型定义
3. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 3

### 步骤 3：识别单向数据流

**目标**：在参与方之间连线，描绘出信息交互的拓扑结构

**关键点**：
- 绘制有向图，表示信息流向
- 每条边代表一条 Channel（从 Source 节点到 Target 节点）
- 明确信息流的单向性（避免循环依赖）
- 定义 Channel 类型和常量

**输出**：
- Channel 常量定义：`const Channel_USER_AGENT = { source: USER, target: AGENT }`
- Channel 类型定义：`type ChannelUserAgent = typeof Channel_USER_AGENT`
- 所有 Channel 的联合类型：`type Channel = ChannelUserAgent | ...`

**示例**：
```typescript
// Channel 常量定义
const Channel_USER_AGENT = { source: USER, target: AGENT };
const Channel_AGENT_TOOLKIT = { source: AGENT, target: TOOLKIT };
const Channel_TOOLKIT_AGENT = { source: TOOLKIT, target: AGENT };
const Channel_AGENT_USER = { source: AGENT, target: USER };

// Channel 类型定义
type ChannelUserAgent = typeof Channel_USER_AGENT;
type ChannelAgentToolkit = typeof Channel_AGENT_TOOLKIT;
type ChannelToolkitAgent = typeof Channel_TOOLKIT_AGENT;
type ChannelAgentUser = typeof Channel_AGENT_USER;

// 所有 Channel 的联合类型
type Channel = 
  | ChannelUserAgent 
  | ChannelAgentToolkit 
  | ChannelToolkitAgent 
  | ChannelAgentUser;
```

**⚠️ 完成此步骤后，必须：**
1. 更新检查清单，标记步骤 3 为完成
2. **暂停执行**，向用户展示拓扑结构图和边的列表
3. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 4

### 步骤 4：聚焦通道关注点

**目标**：对每条 Channel，定义其对应的 State 类型和 transition 函数

**关键点**：
- 对于每条 Channel，定义其 State 类型（使用 Zod@4 Schema）
- State 表示 Target 节点对 Source 节点状态的关注点
- 定义 transition 函数，描述 State 如何随 Source 节点的 Output 变化
- transition 函数必须是纯函数

**输出**：
- 每条 Channel 的 State Schema：`const stateUserAgentSchema = ...`
- 每条 Channel 的 State 类型：`type StateUserAgent = z.infer<typeof stateUserAgentSchema>`
- 每条 Channel 的 transition 函数：`const transitionUserAgent = ...`

**示例**：
```typescript
import { z } from "zod";
import { create } from "mutative";

// Channel USER -> AGENT 的 State Schema
const stateUserAgentSchema = z.object({
  latestUserMessage: z.string(),
  messageHistory: z.array(z.object({
    id: z.string(),
    content: z.string(),
    timestamp: z.number(),
  })),
});

type StateUserAgent = z.infer<typeof stateUserAgentSchema>;

// transition 函数：State 随 User 的 Output 变化
const transitionUserAgent = (
  output: OutputFromUser,
  state: StateUserAgent
): StateUserAgent => {
  if (output.type === "sendMessage") {
    return create(state, (draft) => {
      draft.latestUserMessage = output.message;
      draft.messageHistory.push({
        id: crypto.randomUUID(),
        content: output.message,
        timestamp: Date.now(),
      });
    });
  }
  return state;
};

// Channel AGENT -> TOOLKIT 的 State Schema
const stateAgentToolkitSchema = z.object({
  pendingToolCalls: z.array(z.object({
    id: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
  })),
});

type StateAgentToolkit = z.infer<typeof stateAgentToolkitSchema>;

const transitionAgentToolkit = (
  output: OutputFromAgent,
  state: StateAgentToolkit
): StateAgentToolkit => {
  if (output.type === "callTool") {
    return create(state, (draft) => {
      draft.pendingToolCalls.push({
        id: crypto.randomUUID(),
        toolName: output.toolName,
        args: output.args,
      });
    });
  }
  return state;
};
```

**⚠️ 完成此步骤后，必须：**
1. 更新检查清单，标记步骤 4 为完成
2. **暂停执行**，向用户展示每条边的 Observation 类型定义和关注点映射表
3. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 5

### 步骤 5：节点状态推着走

**目标**：对于每个 Participant 节点，定义其极简 Effect 类型，以及 effectsAt 和 runEffect 函数

**关键点**：
- **Effect 极简化**：Effect 只包含无法从状态中获取的信息，可以从状态中获取的 properties 不需要进 Effect
- **effectsAt 函数**：根据节点的"综合观察"（所有入边 Channel 的 State）推导出要触发的 Effect
- **runEffect 函数**：执行副作用，调用对应的异步 Actor，传递 State 和 dispatch 方法
- runEffect 是带自动机状态的，可以从状态中获取的 properties 不需要进 Effect

**输出**：
- 每个 Participant 的 Effect 类型定义
- 每个 Participant 的 `effectsAtFor<P>` 函数：返回单个 Effect（表示要更新 UI 或触发异步操作）
- 每个 Participant 的 `runEffectFor<P>` 函数：调用 render UI callback 或其他异步操作，传递 State 和 dispatch 方法

**示例**：
```typescript
import type { Dispatch, EffectController } from "@moora/moorex";

// User 节点的 Effect（极简，只包含必要信息）
type EffectOfUser = {
  kind: "updateUI";
  // 不需要包含 messages，因为可以从 state 中获取
};

// User 节点的 effectsAt：根据观察决定是否更新 UI
const effectsAtForUser = (
  state: StateUserAgent // 从 Channel USER -> AGENT 的 State 推导
): EffectOfUser | null => {
  // 如果有新消息，返回更新 UI 的 Effect
  if (state.latestUserMessage) {
    return { kind: "updateUI" };
  }
  return null;
};

// User 节点的 runEffect：调用 UI render callback
const runEffectForUser = (
  effect: EffectOfUser,
  state: StateUserAgent,
  dispatch: Dispatch<OutputFromUser>
): EffectController<OutputFromUser> => {
  return {
    start: async () => {
      // 调用 UI render callback，传递 state 和 dispatch
      renderUI(state, dispatch);
    },
    cancel: () => {
      // 清理 UI 资源
    },
  };
};

// Agent 节点的 Effect（极简）
type EffectOfAgent = {
  kind: "callLLM" | "callTool";
  // 不需要包含完整的 context，因为可以从 state 中获取
};

// Agent 节点的 effectsAt
const effectsAtForAgent = (
  stateUserAgent: StateUserAgent, // 从 Channel USER -> AGENT 的 State
  stateToolkitAgent: StateToolkitAgent // 从 Channel TOOLKIT -> AGENT 的 State
): EffectOfAgent | null => {
  // 如果有新的用户消息，调用 LLM
  if (stateUserAgent.latestUserMessage) {
    return { kind: "callLLM" };
  }
  // 如果有工具调用结果，继续处理
  if (stateToolkitAgent.toolResults.length > 0) {
    return { kind: "callLLM" };
  }
  return null;
};

// Agent 节点的 runEffect：调用 LLM API
const runEffectForAgent = (
  effect: EffectOfAgent,
  stateUserAgent: StateUserAgent,
  stateToolkitAgent: StateToolkitAgent,
  dispatch: Dispatch<OutputFromAgent>
): EffectController<OutputFromAgent> => {
  return {
    start: async () => {
      // 从 state 中获取完整信息
      const context = {
        userMessages: stateUserAgent.messageHistory,
        toolResults: stateToolkitAgent.toolResults,
      };
      
      // 调用 LLM API
      const response = await callLLM(context);
      
      // 根据响应 dispatch 相应的 Output
      if (response.requiresToolCall) {
        dispatch({
          type: "callTool",
          toolName: response.toolName,
          args: response.args,
        });
      } else {
        dispatch({
          type: "sendMessage",
          message: response.message,
        });
      }
    },
    cancel: () => {
      // 取消 LLM 调用
    },
  };
};
```

**⚠️ 完成此步骤后，必须：**
1. 更新检查清单，标记步骤 5 为完成
2. **暂停执行**，向用户展示每个节点的 Observation/State/Signal/Effect 类型定义和函数实现
3. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 6

### 步骤 6：最后统合去冗余

**目标**：产出统一的 Moorex 七要素，以及从 State 推导 channel state 的函数

**关键点**：
- **关键洞察**：All Observation == All State（有向图的所有入边等于所有出边）
- 合并所有 Channel 的 State 类型，形成全局 State
- Signal 是各个 Participant 的 Output 的 union（改名为 Signal，不再是 Input）
- Effect 是各个 Participant Effect 的 union
- 定义从全局 State 推导每个 Channel State 的函数
- 统合所有 transition、effectsAt、runEffect 函数

**输出**：
- 统一的 `State` 类型（所有 Channel State 的合并）
- 统一的 `Signal` 类型（各个 Participant Output 的 union）
- 统一的 `Effect` 类型（各个 Participant Effect 的 union）
- `initial` 函数：返回初始 State
- `transition` 函数：处理 Signal，更新 State
- `effectsAt` 函数：从 State 推导 Effect
- `runEffect` 函数：执行 Effect
- 从 State 推导每个 Channel State 的函数：`getStateForChannel<C extends Channel>(state: State): StateForChannel<C>`

**示例**：
```typescript
// 统合后的全局 State（所有 Channel State 的合并）
type State = {
  // Channel USER -> AGENT 的 State
  userAgent: StateUserAgent;
  // Channel AGENT -> TOOLKIT 的 State
  agentToolkit: StateAgentToolkit;
  // Channel TOOLKIT -> AGENT 的 State
  toolkitAgent: StateToolkitAgent;
  // Channel AGENT -> USER 的 State
  agentUser: StateAgentUser;
};

// Signal 是各个 Participant Output 的 union
type Signal = OutputFromUser | OutputFromAgent | OutputFromToolkit;

// Effect 是各个 Participant Effect 的 union
type Effect = EffectOfUser | EffectOfAgent | EffectOfToolkit;

// 从 State 推导每个 Channel State 的函数
const getStateForChannel = <C extends Channel>(
  state: State,
  channel: C
): StateForChannel<C> => {
  if (channel === Channel_USER_AGENT) {
    return state.userAgent as StateForChannel<C>;
  }
  if (channel === Channel_AGENT_TOOLKIT) {
    return state.agentToolkit as StateForChannel<C>;
  }
  if (channel === Channel_TOOLKIT_AGENT) {
    return state.toolkitAgent as StateForChannel<C>;
  }
  if (channel === Channel_AGENT_USER) {
    return state.agentUser as StateForChannel<C>;
  }
  throw new Error(`Unknown channel: ${channel}`);
};

// initial 函数
const initial = (): State => ({
  userAgent: {
    latestUserMessage: "",
    messageHistory: [],
  },
  agentToolkit: {
    pendingToolCalls: [],
  },
  toolkitAgent: {
    toolResults: [],
  },
  agentUser: {
    latestAgentMessage: "",
    messageHistory: [],
  },
});

// transition 函数：根据 Signal 的来源，更新对应的 Channel State
const transition = (signal: Signal, state: State): State => {
  if (signal.type === "sendMessage" && "message" in signal) {
    // 来自 User 的 Output，更新 USER -> AGENT Channel State
    return create(state, (draft) => {
      draft.userAgent = transitionUserAgent(
        signal as OutputFromUser,
        state.userAgent
      );
    });
  }
  if (signal.type === "callTool" || (signal.type === "sendMessage" && "toolName" in signal)) {
    // 来自 Agent 的 Output，更新对应的 Channel State
    return create(state, (draft) => {
      if (signal.type === "callTool") {
        draft.agentToolkit = transitionAgentToolkit(
          signal as OutputFromAgent,
          state.agentToolkit
        );
      } else {
        draft.agentUser = transitionAgentUser(
          signal as OutputFromAgent,
          state.agentUser
        );
      }
    });
  }
  // ... 处理其他 Signal
  return state;
};

// effectsAt 函数：综合所有节点的 effectsAt 逻辑
const effectsAt = (state: State): Record<string, Effect> => {
  const effects: Record<string, Effect> = {};
  
  // User 节点的 effectsAt
  const userEffect = effectsAtForUser(state.userAgent);
  if (userEffect) {
    effects["user"] = userEffect;
  }
  
  // Agent 节点的 effectsAt
  const agentEffect = effectsAtForAgent(state.userAgent, state.toolkitAgent);
  if (agentEffect) {
    effects["agent"] = agentEffect;
  }
  
  // ... 其他节点的 effectsAt
  
  return effects;
};

// runEffect 函数：根据 Effect 的类型，调用对应的 runEffect
const runEffect = (
  effect: Effect,
  state: State,
  key: string
): EffectController<Signal> => {
  if (effect.kind === "updateUI") {
    return runEffectForUser(
      effect as EffectOfUser,
      state.userAgent,
      (signal) => {
        // dispatch Signal
      }
    );
  }
  if (effect.kind === "callLLM" || effect.kind === "callTool") {
    return runEffectForAgent(
      effect as EffectOfAgent,
      state.userAgent,
      state.toolkitAgent,
      (signal) => {
        // dispatch Signal
      }
    );
  }
  // ... 处理其他 Effect
  throw new Error(`Unknown effect: ${effect}`);
};
```

**⚠️ 完成此步骤后，必须：**
1. 更新检查清单，标记步骤 6 为完成
2. **暂停执行**，向用户展示统合后的全局类型定义和函数实现
3. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 7

### 步骤 7：精巧模型便在手

**目标**：定义对应的 `createXxxMoorex` 函数，创建可运行的 Moorex 实例

**关键点**：
- 创建工厂函数 `createXxxMoorex`，封装 Moorex 的创建逻辑
- 函数应该接受必要的配置参数（如 renderUI callback、LLM API client 等）
- 返回配置好的 Moorex 实例
- 状态机可以：
  - 序列化状态（用于持久化）
  - 从序列化状态恢复（用于迁移和恢复）
  - 处理异步副作用
  - 协调多个节点的交互

**输出**：
- `createXxxMoorex` 工厂函数
- 函数接受配置参数，返回 Moorex 实例
- 可运行的 Agent 服务

**示例**：
```typescript
import { createMoorex } from "@moora/moorex";
import type { Moorex } from "@moora/moorex";

type CreateXxxMoorexOptions = {
  // UI render callback
  renderUI: (state: StateUserAgent, dispatch: Dispatch<OutputFromUser>) => void;
  // LLM API client
  llmClient: {
    call: (context: LLMContext) => Promise<LLMResponse>;
  };
  // Tool executor
  toolExecutor: {
    execute: (toolName: string, args: Record<string, unknown>) => Promise<string>;
  };
  // 可选的初始状态（用于恢复）
  initialState?: State;
};

export function createXxxMoorex(
  options: CreateXxxMoorexOptions
): Moorex<Signal, Effect, State> {
  const { renderUI, llmClient, toolExecutor, initialState } = options;
  
  // 创建带上下文的 runEffect 函数
  const runEffectWithContext = (
    effect: Effect,
    state: State,
    key: string
  ): EffectController<Signal> => {
    if (effect.kind === "updateUI") {
      return runEffectForUser(
        effect as EffectOfUser,
        state.userAgent,
        (signal) => {
          // dispatch Signal
        }
      );
    }
    if (effect.kind === "callLLM") {
      return {
        start: async (dispatch) => {
          const context = {
            userMessages: state.userAgent.messageHistory,
            toolResults: state.toolkitAgent.toolResults,
          };
          const response = await llmClient.call(context);
          // dispatch response
        },
        cancel: () => {},
      };
    }
    if (effect.kind === "callTool") {
      return {
        start: async (dispatch) => {
          const toolCall = state.agentToolkit.pendingToolCalls[0];
          const result = await toolExecutor.execute(
            toolCall.toolName,
            toolCall.args
          );
          dispatch({
            type: "toolResult",
            toolName: toolCall.toolName,
            result,
          });
        },
        cancel: () => {},
      };
    }
    throw new Error(`Unknown effect: ${effect}`);
  };
  
  return createMoorex({
    initial: initialState ? () => initialState : initial,
    transition,
    effectsAt,
    runEffect: runEffectWithContext,
  });
}

// 使用示例
const moorex = createXxxMoorex({
  renderUI: (state, dispatch) => {
    // 渲染 UI
  },
  llmClient: {
    call: async (context) => {
      // 调用 LLM API
    },
  },
  toolExecutor: {
    execute: async (toolName, args) => {
      // 执行工具
    },
  },
});

// 状态机可以序列化和恢复
const serializedState = JSON.stringify(moorex.current());
const restoredMoorex = createXxxMoorex({
  ...options,
  initialState: JSON.parse(serializedState),
});
```

**⚠️ 完成此步骤后，必须：**
1. 更新检查清单，标记步骤 7 为完成
2. **暂停执行**，向用户展示完整的 Moorex 定义和可运行的 Agent 服务
3. **等待用户最终审查和确认**

## 建模检查清单

**注意**：AI Agent 在开始建模前，必须先创建此检查清单，并在每个步骤完成后更新相应项的状态。

在完成七步建模后，检查以下事项：

- [ ] 所有节点都已识别并定义清楚
- [ ] 所有节点的 I/O 类型都已定义
- [ ] 拓扑结构清晰，无循环依赖
- [ ] 每条边的关注点都已明确
- [ ] 每个节点的 Observation/State/Signal/Effect 都已定义
- [ ] `effectsAt`、`runEffect`、`transition` 函数都已实现
- [ ] 全局类型已统合，无冗余
- [ ] 状态机可以序列化和恢复
- [ ] 状态机可以处理所有预期的交互场景

## 注意事项

1. **纯函数原则**：
   - `transition` 必须是纯函数（无副作用）
   - `effectsAt` 必须是纯函数（无副作用）
   - 副作用只在 `runEffect` 中执行

2. **不可变性**：
   - 状态更新必须使用不可变方式（使用 `mutative` 的 `create()` 函数）

3. **类型安全**：
   - 所有类型定义要完整，避免使用 `any`
   - 使用 Discriminated Union 类型区分不同的信号和副作用

4. **可恢复性**：
   - 确保所有状态都可以序列化
   - 确保可以从序列化状态完全恢复

5. **可测试性**：
   - 每个函数都应该易于单元测试
   - 纯函数更容易测试

## 参考资源

- Moorex 核心库：`@moora/moorex`
- 代码风格规范：`.cursorrules`
- 架构文档：`docs/AGENT_MOOREX_ARCHITECTURE.md`


