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

## 文件结构规范

**重要：所有生成的内容必须按照以下文件结构组织**

### 目录结构

```
<target-directory>/
├── types/                          # 类型定义文件夹
│   ├── topology.ts                 # Participants 和 Channels 定义
│   ├── state.ts                    # 各 Channel 的 State 类型定义
│   ├── signal.ts                   # Signal 类型定义（各 Participant Output 的 union）
│   ├── effects.ts                  # Effect 类型定义（包含各个 effect 的 IO）
│   └── unified.ts                  # 统合的类型定义（全局 State、Signal、Effect）
├── transition/                     # transition 函数文件夹（按 Channel 分文件）
│   ├── user-agent.ts               # Channel USER -> AGENT 的 transition
│   ├── agent-toolkit.ts            # Channel AGENT -> TOOLKIT 的 transition
│   ├── toolkit-agent.ts            # Channel TOOLKIT -> AGENT 的 transition
│   ├── agent-user.ts               # Channel AGENT -> USER 的 transition
│   ├── user-user.ts                # Channel USER -> USER (Loopback) 的 transition
│   ├── agent-agent.ts              # Channel AGENT -> AGENT (Loopback) 的 transition
│   ├── toolkit-toolkit.ts          # Channel TOOLKIT -> TOOLKIT (Loopback) 的 transition
│   └── index.ts                    # 导出所有 transition 函数
├── effectsAt/                      # effectsAt 函数文件夹（按 Participant 分文件）
│   ├── user.ts                     # User 节点的 effectsAt
│   ├── agent.ts                    # Agent 节点的 effectsAt
│   ├── toolkit.ts                  # Toolkit 节点的 effectsAt
│   └── index.ts                    # 导出所有 effectsAt 函数
├── runEffect/                      # runEffect 函数文件夹（按 Participant 分文件）
│   ├── user.ts                     # User 节点的 runEffect
│   ├── agent.ts                    # Agent 节点的 runEffect
│   ├── toolkit.ts                  # Toolkit 节点的 runEffect
│   └── index.ts                    # 导出所有 runEffect 函数
├── unified/                        # 统合函数文件夹
│   ├── initial.ts                  # initial 函数
│   ├── transition.ts               # 统合的 transition 函数
│   ├── effectsAt.ts                # 统合的 effectsAt 函数
│   ├── runEffect.ts               # 统合的 runEffect 函数（makeRunEffect）
│   └── state-for-channel.ts        # stateForXxxYyy 函数（从统合 State 推导各 Channel State）
└── create-xxx-moorex.ts            # 工厂函数（步骤 7 创建）
```

### 文件组织原则

1. **类型定义集中管理**：所有类型定义放在 `types/` 文件夹中
2. **实现按功能分离**：transition、effectsAt、runEffect 分别建立文件夹
3. **按维度分文件**：
   - transition 按 Channel 分文件（每个 Channel 一个文件）
   - effectsAt 和 runEffect 按 Participant 分文件（每个 Participant 一个文件）
4. **统合逻辑独立**：unified 文件夹包含所有统合后的函数
5. **每个文件夹都有 index.ts**：用于导出该文件夹的所有内容

### 目标目录确定

- **独立 package**：如果是在独立的 package 中，所有内容放在 `packages/<package-name>/src/` 目录下
- **用户指定路径**：如果用户指定了路径，按照用户指定的路径创建文件结构

### 步骤与文件映射表

| 步骤 | 涉及文件 | 说明 |
|------|---------|------|
| 步骤 1：对节点 | `types/topology.ts` | 定义 Participants 常量类型 |
| 步骤 2：理 I/O | `types/signal.ts` | 定义所有 Participant 的 InputFor 和 OutputFrom 类型 |
| 步骤 3：识别单向数据流 | `types/topology.ts` | 在步骤 1 的基础上添加 Channel 定义 |
| 步骤 4：聚焦通道关注点 | `types/state.ts`<br>`transition/*.ts`<br>`transition/index.ts` | 定义各 Channel 的 State 类型和 transition 函数 |
| 步骤 5：节点状态推着走 | `types/effects.ts`<br>`effectsAt/*.ts`<br>`effectsAt/index.ts`<br>`runEffect/*.ts`<br>`runEffect/index.ts` | 定义 Effect 类型、effectsAt 和 runEffect 函数 |
| 步骤 6：最后统合去冗余 | `types/unified.ts`<br>`unified/initial.ts`<br>`unified/transition.ts`<br>`unified/effectsAt.ts`<br>`unified/runEffect.ts`<br>`unified/state-for-channel.ts` | 统合全局类型和函数，State 去重，定义 stateForXxxYyy 函数 |
| 步骤 7：精巧模型便在手 | `create-xxx-moorex.ts` | 创建工厂函数 |

## 实施流程

**重要：AI Agent 必须严格按照以下流程执行**

### 开始前的准备

1. **确定目标目录**：
   - 询问用户目标目录，或根据上下文确定（独立 package 的 `/src` 或用户指定路径）
   - 创建完整的文件夹结构（types、transition、effectsAt、runEffect、unified）

2. **创建初始检查清单**：
   - 在开始建模前，AI Agent 必须先创建一个包含所有 7 个步骤的检查清单
   - 使用 `todo_write` 工具创建任务列表，每个步骤作为一个独立任务
   - 检查清单应该包含每个步骤的预期输出和完成标准

3. **逐步执行**：
   - **必须严格按照步骤顺序执行**，不能跳过或合并步骤
   - 每完成一个步骤，必须：
     1. 更新检查清单，标记当前步骤为完成
     2. **暂停执行**，等待用户审查和确认
     3. 只有在用户明确确认后，才能继续下一步

4. **审查要点**：
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
- ✅ **类型和 Lint 检查**：**每完成一个步骤后，必须使用 `read_lints` 工具验证是否有 TypeScript 类型错误或 Lint 错误，确保代码质量**

## 步骤详解

### 步骤 1：对节点

**目标**：发现 Agent 交互中有哪些参与方

**关键点**：
- 识别所有参与交互的节点（如：用户、Agent、工具等）
- 每个参与方都可能会发起异步的 I/O 过程
- 明确每个节点的职责和边界
- **重要**：所有节点都应该是业务层面的概念，而不是技术架构层面的概念（如数据库、缓存、消息队列等）

**涉及文件**：
- `types/topology.ts` - 创建此文件，定义 Participants 常量类型

**输出**：
- String enum 类型：`type Participants = typeof USER | typeof AGENT | typeof TOOLKIT`
- 参与者常量定义

**示例**：
```typescript
// types/topology.ts
const USER = "user";
const AGENT = "agent";
const TOOLKIT = "toolkit";

type Participants = typeof USER | typeof AGENT | typeof TOOLKIT;
```

**⚠️ 完成此步骤后，必须：**
1. 使用 `read_lints` 工具验证是否有类型错误或 Lint 错误
2. 更新检查清单，标记步骤 1 为完成
3. **暂停执行**，向用户展示识别的节点列表和职责描述
4. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 2

### 步骤 2：理 I/O

**目标**：梳理清楚每个参与方的 I/O 数据格式

**关键点**：
- **重要**：这里的 Input/Output 不是来自这个参与方的 Input 和对这个参与方的 Output，而是这个参与方作为一个异步 Actor，它接收的 Input 和产生的 Output
- 例如：
  - `InputForUser`：就是 UI State，最简单的就是 messages 列表
  - `OutputFromUser`：就是 User Actions，比如 send user message，cancel streaming message
- 所有类型必须使用 **Zod@4 Schema** 定义
- 定义工具类型用于类型推导

**涉及文件**：
- `types/signal.ts` - 创建此文件，定义所有 Participant 的 InputFor 和 OutputFrom 类型（使用 Zod Schema），以及工具类型

**输出**：
- 每个参与者的 `InputFor<P>` 类型（使用 Zod@4 Schema）
- 每个参与者的 `OutputFrom<P>` 类型（使用 Zod@4 Schema）
- 工具类型：`type InputFor<P extends Participant> = ...`
- 工具类型：`type OutputFrom<P extends Participant> = ...`
- 工具类型：`type RunEffectFn<P extends Participant> = (input: InputFor<P>) => Promise<OutputFrom<P>>`

**示例**：
```typescript
// types/signal.ts
import { z } from "zod";
import type { Participants } from "./topology";
import { USER, AGENT, TOOLKIT } from "./topology";

// 为每个 Participant 定义 InputFor 和 OutputFrom 的 Zod Schema
// InputForUser: UI State（如 messages 列表）
const inputForUserSchema = z.object({ /* ... */ });
export type InputForUser = z.infer<typeof inputForUserSchema>;

// OutputFromUser: User Actions（如 sendMessage, cancelStreaming）
const outputFromUserSchema = z.discriminatedUnion("type", [ /* ... */ ]);
export type OutputFromUser = z.infer<typeof outputFromUserSchema>;

// 类似地为其他 Participant 定义 I/O Schema
// InputForAgent, OutputFromAgent, InputForToolkit, OutputFromToolkit...

// 工具类型：根据 Participant 类型推导对应的 Input/Output
export type InputFor<P extends Participants> = 
  P extends typeof USER ? InputForUser :
  P extends typeof AGENT ? InputForAgent :
  P extends typeof TOOLKIT ? InputForToolkit :
  never;

export type OutputFrom<P extends Participants> = 
  P extends typeof USER ? OutputFromUser :
  P extends typeof AGENT ? OutputFromAgent :
  P extends typeof TOOLKIT ? OutputFromToolkit :
  never;
```

**⚠️ 完成此步骤后，必须：**
1. 使用 `read_lints` 工具验证是否有类型错误或 Lint 错误
2. 更新检查清单，标记步骤 2 为完成
3. **暂停执行**，向用户展示所有节点的 I/O 类型定义
4. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 3

### 步骤 3：识别单向数据流

**目标**：在参与方之间连线，描绘出信息交互的拓扑结构

**关键点**：
- 绘制有向图，表示信息流向
- 每条边代表一条 Channel（从 Source 节点到 Target 节点）
- 明确信息流的单向性（避免循环依赖）
- **重要**：每个 Participant 节点都需要一个 Loopback Channel（自环通道），用于感知自身状态迭代
  - Loopback Channel 允许节点观察自身状态的变化
  - 这对于状态机的状态迭代和自反馈机制至关重要
- 定义 Channel 类型和常量

**涉及文件**：
- `types/topology.ts` - 更新此文件，添加 Channel 常量定义和类型（在步骤 1 的基础上）

**输出**：
- Channel 常量定义：`const Channel_USER_AGENT = { source: USER, target: AGENT }`
- Loopback Channel 常量定义：`const Channel_USER_USER = { source: USER, target: USER }`
- Channel 类型定义：`type ChannelUserAgent = typeof Channel_USER_AGENT`
- 所有 Channel 的联合类型：`type Channel = ChannelUserAgent | ...`

**示例**：
```typescript
// types/topology.ts（在步骤 1 的基础上添加）
// ... 步骤 1 的 Participants 定义 ...

// Channel 常量定义（节点间通道）
export const Channel_USER_AGENT = { source: USER, target: AGENT } as const;
export const Channel_AGENT_TOOLKIT = { source: AGENT, target: TOOLKIT } as const;
export const Channel_TOOLKIT_AGENT = { source: TOOLKIT, target: AGENT } as const;
export const Channel_AGENT_USER = { source: AGENT, target: USER } as const;

// Loopback Channel 常量定义（自环通道）
export const Channel_USER_USER = { source: USER, target: USER } as const;
export const Channel_AGENT_AGENT = { source: AGENT, target: AGENT } as const;
export const Channel_TOOLKIT_TOOLKIT = { source: TOOLKIT, target: TOOLKIT } as const;

// Channel 类型定义
export type ChannelUserAgent = typeof Channel_USER_AGENT;
export type ChannelAgentToolkit = typeof Channel_AGENT_TOOLKIT;
export type ChannelToolkitAgent = typeof Channel_TOOLKIT_AGENT;
export type ChannelAgentUser = typeof Channel_AGENT_USER;
export type ChannelUserUser = typeof Channel_USER_USER;
export type ChannelAgentAgent = typeof Channel_AGENT_AGENT;
export type ChannelToolkitToolkit = typeof Channel_TOOLKIT_TOOLKIT;

// 所有 Channel 的联合类型
export type Channel = 
  | ChannelUserAgent 
  | ChannelAgentToolkit 
  | ChannelToolkitAgent 
  | ChannelAgentUser
  | ChannelUserUser
  | ChannelAgentAgent
  | ChannelToolkitToolkit;
```

**⚠️ 完成此步骤后，必须：**
1. 使用 `read_lints` 工具验证是否有类型错误或 Lint 错误
2. 更新检查清单，标记步骤 3 为完成
3. **暂停执行**，向用户展示拓扑结构图和边的列表
4. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 4

### 步骤 4：聚焦通道关注点

**目标**：对每条 Channel，定义其对应的 State 类型和 transition 函数

**关键点**：
- 对于每条 Channel，定义其 State 类型（使用 Zod@4 Schema）
- State 表示 Target 节点对 Source 节点状态的关注点
- 定义 transition 函数，描述 State 如何随 Source 节点的 Output 变化
- transition 函数必须是纯函数

**涉及文件**：
- `types/state.ts` - 创建此文件，定义所有 Channel 的 State Schema 和类型
- `transition/` 文件夹 - 创建此文件夹，为每个 Channel 创建对应的 transition 文件：
  - `transition/user-agent.ts` - Channel USER -> AGENT 的 transition
  - `transition/agent-toolkit.ts` - Channel AGENT -> TOOLKIT 的 transition
  - `transition/toolkit-agent.ts` - Channel TOOLKIT -> AGENT 的 transition
  - `transition/agent-user.ts` - Channel AGENT -> USER 的 transition
  - `transition/user-user.ts` - Channel USER -> USER (Loopback) 的 transition
  - `transition/agent-agent.ts` - Channel AGENT -> AGENT (Loopback) 的 transition
  - `transition/toolkit-toolkit.ts` - Channel TOOLKIT -> TOOLKIT (Loopback) 的 transition
  - `transition/index.ts` - 导出所有 transition 函数

**输出**：
- 每条 Channel 的 State Schema：`const stateUserAgentSchema = ...`
- 每条 Channel 的 State 类型：`type StateUserAgent = z.infer<typeof stateUserAgentSchema>`
- 每条 Channel 的 transition 函数：`const transitionUserAgent = ...`

**示例**：
```typescript
// types/state.ts
import { z } from "zod";

// 为每条 Channel 定义 State Schema（表示 Target 节点对 Source 节点状态的关注点）
export const stateUserAgentSchema = z.object({
  latestUserMessage: z.string(),
  messageHistory: z.array(/* ... */),
});
export type StateUserAgent = z.infer<typeof stateUserAgentSchema>;

export const stateAgentToolkitSchema = z.object({
  pendingToolCalls: z.array(/* ... */),
});
export type StateAgentToolkit = z.infer<typeof stateAgentToolkitSchema>;

// ... 其他 Channel 的 State Schema ...

// transition/user-agent.ts
import { create } from "mutative";
import type { OutputFromUser } from "../types/signal";
import type { StateUserAgent } from "../types/state";

/**
 * Channel USER -> AGENT 的 transition 函数
 * 
 * 描述 State 如何随 Source 节点的 Output 变化。
 */
export function transitionUserAgent(
  output: OutputFromUser,
  state: StateUserAgent
): StateUserAgent {
  // 根据 output 的类型，使用 mutative 的 create() 进行不可变更新
  // 例如：如果 output.type === "sendMessage"，更新 latestUserMessage 和 messageHistory
  // 返回新的 State
  return create(state, (draft) => {
    // ... 更新逻辑 ...
  });
}

// transition/index.ts
export { transitionUserAgent } from "./user-agent";
export { transitionAgentToolkit } from "./agent-toolkit";
// ... 导出其他 transition 函数 ...
```

**⚠️ 完成此步骤后，必须：**
1. 使用 `read_lints` 工具验证是否有类型错误或 Lint 错误
2. 更新检查清单，标记步骤 4 为完成
3. **暂停执行**，向用户展示每条边的 Observation 类型定义和关注点映射表
4. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 5

### 步骤 5：节点状态推着走

**目标**：对于每个 Participant 节点，定义其极简 Effect 类型，以及 effectsAt 和 runEffect 函数

**关键点**：
- **Effect 极简化**：Effect 只包含无法从状态中获取的信息，可以从状态中获取的 properties 不需要进 Effect
- **effectsAt 函数**：根据节点的"综合观察"（所有入边 Channel 的 State）推导出要触发的 Effect
- **runEffect 函数**：执行副作用，调用对应的异步 Actor，传递 State 和 dispatch 方法
- runEffect 是带自动机状态的，可以从状态中获取的 properties 不需要进 Effect
- **重要**：Effect 的 IO 类型（InputFor 和 OutputFrom）也定义在 effects.ts 中
- **重要**：每个 Participant 的 runEffect 必须使用 `makeRunEffectForXxx` 模式，柯里化注入 options
  - 定义 `StateForXxx` 类型：打包该 Participant 需要的所有 Channel State（所有入边 Channel 的 State）
  - 定义 `MakeRunEffectForXxxOptions` 类型：包含该 Participant 需要的所有依赖注入
  - 函数签名：`makeRunEffectForXxx: (options: MakeRunEffectForXxxOptions) => (effect: EffectOfXxx, state: StateForXxx, key: string) => EffectController<OutputFromXxx>`

**涉及文件**：
- `types/effects.ts` - 创建此文件，定义所有 Participant 的 Effect 类型，以及 Effect 相关的 IO 类型（InputFor 和 OutputFrom）
- `effectsAt/` 文件夹 - 创建此文件夹，为每个 Participant 创建对应的 effectsAt 文件：
  - `effectsAt/user.ts` - User 节点的 effectsAt
  - `effectsAt/agent.ts` - Agent 节点的 effectsAt
  - `effectsAt/toolkit.ts` - Toolkit 节点的 effectsAt
  - `effectsAt/index.ts` - 导出所有 effectsAt 函数
- `runEffect/` 文件夹 - 创建此文件夹，为每个 Participant 创建对应的 runEffect 文件：
  - `runEffect/user.ts` - User 节点的 runEffect
  - `runEffect/agent.ts` - Agent 节点的 runEffect
  - `runEffect/toolkit.ts` - Toolkit 节点的 runEffect
  - `runEffect/index.ts` - 导出所有 runEffect 函数

**输出**：
- 每个 Participant 的 Effect 类型定义
- 每个 Participant 的 `StateForXxx` 类型：打包该 Participant 需要的所有 Channel State
- 每个 Participant 的 `MakeRunEffectForXxxOptions` 类型：包含该 Participant 需要的所有依赖注入
- 每个 Participant 的 `effectsAtFor<P>` 函数：返回 Record<string, Effect>（表示要更新 UI 或触发异步操作）
- 每个 Participant 的 `makeRunEffectForXxx` 函数：柯里化函数，接收 options，返回符合 MoorexDefinition 要求的 runEffect 函数

**示例**：
```typescript
// types/effects.ts
import type { Dispatch, EffectController } from "@moora/moorex";
import type { OutputFromUser, OutputFromAgent, OutputFromToolkit } from "./signal";
import type {
  StateAgentUser,
  StateUserUser,
  StateUserAgent,
  StateToolkitAgent,
  StateAgentAgent,
  StateAgentToolkit,
  StateToolkitToolkit,
} from "./state";

// 为每个 Participant 定义极简的 Effect 类型
// Effect 只包含无法从状态中获取的信息
export type EffectOfUser = {
  kind: "updateUI";
  // 不需要包含 messages，因为可以从 state 中获取
};

export type EffectOfAgent = {
  kind: "callLLM";
  // 不需要包含完整的 context，因为可以从 state 中获取
};

export type EffectOfToolkit = {
  kind: "executeTool";
  toolCallId: string; // 需要知道执行哪个工具调用
};

// ============================================================================
// Effect 相关的 IO 类型（依赖注入类型）
// ============================================================================

import type { Message, ToolDefinition } from "./signal";

/**
 * LLM 调用函数类型
 */
export type CallLLMFn = (
  prompt: string,
  tools: ToolDefinition[],
  messages: Message[]
) => Promise<LLMResponse>;

/**
 * LLM 响应类型
 */
export type LLMResponse =
  | {
      type: "message";
      messageId: string;
      chunks: AsyncIterable<string>;
    }
  | {
      type: "toolCall";
      toolCallId: string;
      toolName: string;
      parameters: string;
    };

/**
 * 获取工具名称列表的函数类型
 */
export type GetToolNamesFn = () => Promise<string[]>;

/**
 * 获取工具定义的函数类型
 */
export type GetToolDefinitionsFn = (
  names: string[]
) => Promise<ToolDefinition[]>;

/**
 * 更新 UI 的回调函数类型
 */
export type UpdateUIFn = (
  stateAgentUser: StateAgentUser,
  dispatch: Dispatch<OutputFromUser>
) => void;

// ============================================================================
// StateForXxx 和 MakeRunEffectForXxxOptions 类型定义
// ============================================================================

// User 节点的 StateForUser 类型（打包 User 需要的所有 Channel State）
// User 的入边：Channel_AGENT_USER, Channel_USER_USER (loopback)
export type StateForUser = {
  agentUser: StateAgentUser;
  userUser: StateUserUser;
};

// User 节点的 MakeRunEffectForUserOptions 类型
export type MakeRunEffectForUserOptions = {
  updateUI: UpdateUIFn;
};

// Agent 节点的 StateForAgent 类型（打包 Agent 需要的所有 Channel State）
// Agent 的入边：Channel_USER_AGENT, Channel_TOOLKIT_AGENT, Channel_AGENT_AGENT (loopback)
// 注意：也可能需要 Channel_AGENT_TOOLKIT 的 State（用于查找 tool call 请求信息）
export type StateForAgent = {
  userAgent: StateUserAgent;
  toolkitAgent: StateToolkitAgent;
  agentAgent: StateAgentAgent;
  agentToolkit: StateAgentToolkit; // 用于查找 tool call 请求信息
};

// Agent 节点的 MakeRunEffectForAgentOptions 类型
export type MakeRunEffectForAgentOptions = {
  callLLM: CallLLMFn;
  prompt: string;
  getToolNames: GetToolNamesFn;
  getToolDefinitions: GetToolDefinitionsFn;
};

// Toolkit 节点的 StateForToolkit 类型（打包 Toolkit 需要的所有 Channel State）
// Toolkit 的入边：Channel_AGENT_TOOLKIT, Channel_TOOLKIT_TOOLKIT (loopback)
export type StateForToolkit = {
  agentToolkit: StateAgentToolkit;
  toolkitToolkit: StateToolkitToolkit;
};

// Toolkit 节点的 MakeRunEffectForToolkitOptions 类型
export type MakeRunEffectForToolkitOptions = {
  getToolNames: GetToolNamesFn;
  getToolDefinitions: GetToolDefinitionsFn;
};

// effectsAt/user.ts
import type { StateAgentUser, StateUserUser } from "../types/state";
import type { EffectOfUser } from "../types/effects";

/**
 * User 节点的 effectsAt 函数
 * 
 * 根据节点的"综合观察"（所有入边 Channel 的 State）推导出要触发的 Effect。
 * 
 * 实现逻辑：
 * - 根据 state 判断是否需要触发 Effect
 * - 例如：如果有新消息，添加 { kind: "updateUI" }
 * - 返回 Effect Record，key 作为 Effect 的标识
 */
export function effectsAtForUser(
  stateAgentUser: StateAgentUser,
  stateUserUser: StateUserUser
): Record<string, EffectOfUser>;


// runEffect/user.ts
import type { Dispatch, EffectController } from "@moora/moorex";
import type {
  EffectOfUser,
  MakeRunEffectForUserOptions,
  StateForUser,
} from "../types/effects";
import type { OutputFromUser } from "../types/signal";

/**
 * User 节点的 makeRunEffectForUser 函数
 * 
 * 柯里化函数，接收 options，返回符合 MoorexDefinition 要求的 runEffect 函数。
 * 
 * 实现逻辑：
 * - 返回一个函数，该函数接收 effect、state 和 key
 * - 返回 EffectController，包含 start 和 cancel 方法
 * - start 方法中调用 UI render callback，传递 state 和 dispatch
 * - cancel 方法中清理 UI 资源（如果需要）
 * 
 * @param options - 包含所有需要注入的依赖
 * @returns 符合 MoorexDefinition 要求的 runEffect 函数
 */
export function makeRunEffectForUser(
  options: MakeRunEffectForUserOptions
): (
  effect: EffectOfUser,
  state: StateForUser,
  key: string
) => EffectController<OutputFromUser>;

// runEffect/agent.ts
import type { Dispatch, EffectController } from "@moora/moorex";
import type {
  EffectOfAgent,
  MakeRunEffectForAgentOptions,
  StateForAgent,
} from "../types/effects";
import type { OutputFromAgent } from "../types/signal";

/**
 * Agent 节点的 makeRunEffectForAgent 函数
 * 
 * 柯里化函数，接收 options，返回符合 MoorexDefinition 要求的 runEffect 函数。
 * 
 * 实现逻辑：
 * - 返回一个函数，该函数接收 effect、state 和 key
 * - 返回 EffectController，包含 start 和 cancel 方法
 * - start 方法中从 state 中获取完整信息，调用 LLM API，根据响应 dispatch 相应的 Output
 * - cancel 方法中取消 LLM 调用（如果需要）
 * 
 * @param options - 包含所有需要注入的依赖
 * @returns 符合 MoorexDefinition 要求的 runEffect 函数
 */
export function makeRunEffectForAgent(
  options: MakeRunEffectForAgentOptions
): (
  effect: EffectOfAgent,
  state: StateForAgent,
  key: string
) => EffectController<OutputFromAgent>;

// runEffect/toolkit.ts
import type { Dispatch, EffectController } from "@moora/moorex";
import type {
  EffectOfToolkit,
  MakeRunEffectForToolkitOptions,
  StateForToolkit,
} from "../types/effects";
import type { OutputFromToolkit } from "../types/signal";

/**
 * Toolkit 节点的 makeRunEffectForToolkit 函数
 * 
 * 柯里化函数，接收 options，返回符合 MoorexDefinition 要求的 runEffect 函数。
 * 
 * 实现逻辑：
 * - 返回一个函数，该函数接收 effect、state 和 key
 * - 返回 EffectController，包含 start 和 cancel 方法
 * - start 方法中从 state 中获取工具调用信息，执行工具，dispatch 结果
 * - cancel 方法中取消工具执行（如果需要）
 * 
 * @param options - 包含所有需要注入的依赖
 * @returns 符合 MoorexDefinition 要求的 runEffect 函数
 */
export function makeRunEffectForToolkit(
  options: MakeRunEffectForToolkitOptions
): (
  effect: EffectOfToolkit,
  state: StateForToolkit,
  key: string
) => EffectController<OutputFromToolkit>;

// effectsAt/index.ts
export { effectsAtForUser } from "./user";
export { effectsAtForAgent } from "./agent";
export { effectsAtForToolkit } from "./toolkit";

// runEffect/index.ts
export { makeRunEffectForUser } from "./user";
export { makeRunEffectForAgent } from "./agent";
export { makeRunEffectForToolkit } from "./toolkit";
```

**⚠️ 完成此步骤后，必须：**
1. 使用 `read_lints` 工具验证是否有类型错误或 Lint 错误
2. 更新检查清单，标记步骤 5 为完成
3. **暂停执行**，向用户展示每个节点的 Observation/State/Signal/Effect 类型定义和函数实现
4. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 6

### 步骤 6：最后统合去冗余

**目标**：产出统一的 Moorex 七要素，以及从 State 推导 channel state 的函数

**关键点**：
- **关键洞察**：All Observation == All State（有向图的所有入边等于所有出边）
- **重要：State 去重（Dedup）**：统合 State 不是简单地把各个 Channel 的 State 打包成一个对象，而是要：
  1. 找出所有 Channel State 中的所有字段
  2. 识别重复的字段（相同名称和类型的字段）
  3. 去重后构建一个新的统一 State 类型
  4. 这个统一 State 类型应该包含所有唯一的字段，避免冗余
- Signal 是各个 Participant 的 Output 的 union（改名为 Signal，不再是 Input）
- Effect 是各个 Participant Effect 的 union
- **重要**：为各个 Channel 定义 `stateForXxxYyy` 函数，用来从统合 State 推导出对应的 Channel State
- 统合所有 transition、effectsAt、runEffect 函数
- **重要**：统合后的 `initial`、`transition`、`effectsAt`、`runEffect` 函数必须符合 `@moora/moorex` 的 `MoorexDefinition<Input, Effect, State>` 类型定义：

**涉及文件**：
- `types/unified.ts` - 创建此文件，定义统合后的全局类型（State、Signal、Effect）
- `unified/` 文件夹 - 创建此文件夹，包含统合后的函数：
  - `unified/initial.ts` - initial 函数
  - `unified/transition.ts` - 统合的 transition 函数
  - `unified/effectsAt.ts` - 统合的 effectsAt 函数
  - `unified/runEffect.ts` - 统合的 runEffect 函数（makeRunEffect）
  - `unified/state-for-channel.ts` - getStateForChannel 函数
  ```typescript
  type MoorexDefinition<Input, Effect, State> = {
    /** 初始化函数，返回初始状态 */
    initial: () => State;
    /** 
     * 状态转换函数。
     * 接收一个 Immutable 信号，返回一个函数，该函数接收 Immutable 状态并返回新的 Immutable 状态。
     */
    transition: (input: Input) => (state: State) => State;
    /** 
     * 根据当前状态计算应该运行的 effects。
     * 接收 Immutable 状态，返回 Effect Record，key 作为 Effect 的标识用于 reconciliation。
     */
    effectsAt: (state: State) => Record<string, Effect>;
    /** 
     * 运行一个 effect。
     * 接收 Immutable effect、Immutable state 和 effect 的 key，返回一个初始化器，包含 `start` 和 `cancel` 方法。
     */
    runEffect: (
      effect: Effect,
      state: State,
      key: string,
    ) => EffectController<Input>;
  };
  ```
- **重要**：`runEffect` 函数往往需要注入依赖（如 LLM client、tool executor、UI render callback 等），这些依赖应该通过柯里化的方式传入
- **重要**：在步骤 5 中，每个 Participant 的 runEffect 已经使用 `makeRunEffectForXxx` 模式。在步骤 6 中，`makeRunEffect` 函数需要调用这些 `makeRunEffectForXxx` 函数，并传入对应的 options 和从全局 State 提取的 `StateForXxx`

**输出**：
- 统一的 `State` 类型（所有 Channel State 字段去重后的合并）
- 统一的 `Signal` 类型（各个 Participant Output 的 union）
- 统一的 `Effect` 类型（各个 Participant Effect 的 union）
- `initial` 函数：返回初始 State（符合 `() => State` 类型）
- `transition` 函数：处理 Signal，更新 State（符合 `(input: Signal) => (state: State) => State` 类型）
- `effectsAt` 函数：从 State 推导 Effect（符合 `(state: State) => Record<string, Effect>` 类型）
- `makeRunEffect` 函数：柯里化函数，接收 options，返回 `runEffect` 函数（符合 `(effect: Effect, state: State, key: string) => EffectController<Signal>` 类型）
- 从统合 State 推导每个 Channel State 的函数：`stateForUserAgent(state: State): StateUserAgent`、`stateForAgentToolkit(state: State): StateAgentToolkit` 等

**示例**：
```typescript
// types/unified.ts
import type { StateUserAgent, StateAgentToolkit, StateToolkitAgent, StateAgentUser, /* ... */ } from "./state";
import type { OutputFromUser, OutputFromAgent, OutputFromToolkit } from "./signal";
import type { EffectOfUser, EffectOfAgent, EffectOfToolkit } from "./effects";

// ============================================================================
// 统合后的全局 State（所有 Channel State 字段去重后的合并）
// ============================================================================
// 
// 注意：这不是简单地把各个 Channel State 打包，而是：
// 1. 找出所有 Channel State 中的所有字段
// 2. 识别重复的字段（相同名称和类型的字段）
// 3. 去重后构建一个新的统一 State 类型
// 
// 例如：
// - StateUserAgent 可能有字段：{ userMessages: ... }
// - StateAgentUser 可能有字段：{ messages: ..., streamingChunks: ... }
// - StateAgentToolkit 可能有字段：{ pendingToolCalls: ... }
// - StateToolkitAgent 可能有字段：{ toolResults: ... }
// 
// 统合后的 State 应该包含所有这些唯一字段，例如：
// {
//   userMessages: ...,
//   messages: ...,
//   streamingChunks: ...,
//   pendingToolCalls: ...,
//   toolResults: ...,
//   // ... 其他唯一字段
// }
export type State = {
  // 列出所有去重后的字段
  // 字段名和类型应该来自各个 Channel State 的分析
};

// Signal 是各个 Participant Output 的 union
export type Signal = OutputFromUser | OutputFromAgent | OutputFromToolkit;

// Effect 是各个 Participant Effect 的 union
export type Effect = EffectOfUser | EffectOfAgent | EffectOfToolkit;

// unified/state-for-channel.ts
import type { State } from "../types/unified";
import type {
  StateUserAgent,
  StateAgentToolkit,
  StateToolkitAgent,
  StateAgentUser,
  StateUserUser,
  StateAgentAgent,
  StateToolkitToolkit,
} from "../types/state";

/**
 * 从统合 State 推导 Channel USER -> AGENT 的 State
 * 
 * 实现逻辑：
 * - 从统合 State 中提取 Channel USER -> AGENT 需要的字段
 * - 构建并返回 StateUserAgent 类型
 */
export function stateForUserAgent(state: State): StateUserAgent;

/**
 * 从统合 State 推导 Channel AGENT -> TOOLKIT 的 State
 */
export function stateForAgentToolkit(state: State): StateAgentToolkit;

/**
 * 从统合 State 推导 Channel TOOLKIT -> AGENT 的 State
 */
export function stateForToolkitAgent(state: State): StateToolkitAgent;

/**
 * 从统合 State 推导 Channel AGENT -> USER 的 State
 */
export function stateForAgentUser(state: State): StateAgentUser;

/**
 * 从统合 State 推导 Channel USER -> USER (Loopback) 的 State
 */
export function stateForUserUser(state: State): StateUserUser;

/**
 * 从统合 State 推导 Channel AGENT -> AGENT (Loopback) 的 State
 */
export function stateForAgentAgent(state: State): StateAgentAgent;

/**
 * 从统合 State 推导 Channel TOOLKIT -> TOOLKIT (Loopback) 的 State
 */
export function stateForToolkitToolkit(state: State): StateToolkitToolkit;

// unified/initial.ts
import type { State } from "../types/unified";

/**
 * 初始化函数
 * 
 * 实现逻辑：
 * - 返回所有去重后字段的初始值
 * - 构建符合 State 类型的初始状态对象
 */
export function initial(): State;

// unified/transition.ts
import type { Signal, State } from "../types/unified";
import { transitionUserAgent, transitionAgentToolkit, transitionToolkitAgent, transitionAgentUser, /* ... */ } from "../transition";
import { stateForUserAgent, stateForAgentToolkit, /* ... */ } from "./state-for-channel";

/**
 * 统合的 transition 函数
 * 
 * 实现逻辑：
 * - 根据 signal 的类型和来源，确定需要更新的 Channel
 * - 使用对应的 stateForXxxYyy 函数从统合 State 提取 Channel State
 * - 调用对应的 Channel transition 函数
 * - 使用 mutative 的 create() 进行不可变更新，更新统合 State 中对应的字段
 * - 返回更新后的统合 State
 */
export function transition(signal: Signal): (state: State) => State;

// unified/effectsAt.ts
import type { State, Effect } from "../types/unified";
import { effectsAtForUser, effectsAtForAgent, effectsAtForToolkit } from "../effectsAt";
import { stateForAgentUser, stateForUserUser, stateForUserAgent, stateForToolkitAgent, stateForAgentAgent, stateForAgentToolkit, stateForToolkitToolkit } from "./state-for-channel";

/**
 * 统合的 effectsAt 函数
 * 
 * 实现逻辑：
 * - 使用对应的 stateForXxxYyy 函数从统合 State 提取各个 Channel State
 * - 调用各个节点的 effectsAtFor<P> 函数，传入对应的 Channel State
 * - 收集所有 Effect，合并为 Effect Record（注意 key 的唯一性）
 * - 返回 Effect Record
 */
export function effectsAt(state: State): Record<string, Effect>;

// unified/runEffect.ts
import type { EffectController } from "@moora/moorex";
import type { Effect, Signal, State } from "../types/unified";
import type {
  MakeRunEffectForUserOptions,
  MakeRunEffectForAgentOptions,
  MakeRunEffectForToolkitOptions,
  StateForUser,
  StateForAgent,
  StateForToolkit,
} from "../types/effects";
import { stateForAgentUser, stateForUserUser, stateForUserAgent, stateForToolkitAgent, stateForAgentAgent, stateForAgentToolkit, stateForToolkitToolkit } from "./state-for-channel";

/**
 * makeRunEffect 函数选项
 * 
 * 包含所有 Participant 需要的依赖注入选项。
 */
export type MakeRunEffectOptions = MakeRunEffectForUserOptions &
  MakeRunEffectForAgentOptions &
  MakeRunEffectForToolkitOptions;

/**
 * makeRunEffect 函数
 * 
 * 柯里化函数，接收 options，返回符合 MoorexDefinition 要求的 runEffect 函数。
 * 根据 Effect 的类型，调用对应的 makeRunEffectForXxx 函数。
 * 
 * 实现逻辑：
 * - 为每个 Participant 创建对应的 makeRunEffectForXxx 函数实例，传入对应的 options
 * - 返回一个函数，该函数接收 effect、state 和 key
 * - 根据 effect.kind 判断类型
 * - 使用对应的 stateForXxxYyy 函数从统合 State 提取 StateForXxx
 * - 调用对应的 makeRunEffectForXxx 返回的函数
 * - 返回 EffectController
 * 
 * @param options - 包含所有需要注入的依赖
 * @returns 符合 MoorexDefinition 要求的 runEffect 函数
 */
export function makeRunEffect(
  options: MakeRunEffectOptions
): (effect: Effect, state: State, key: string) => EffectController<Signal>;
```

**⚠️ 完成此步骤后，必须：**
1. 使用 `read_lints` 工具验证是否有类型错误或 Lint 错误
2. **验证类型兼容性**：确保统合后的 `initial`、`transition`、`effectsAt`、`makeRunEffect` 返回的 `runEffect` 函数符合 `MoorexDefinition<Signal, Effect, State>` 类型定义。可以使用类型断言或直接赋值给 `MoorexDefinition` 类型的变量来验证
3. 更新检查清单，标记步骤 6 为完成
4. **暂停执行**，向用户展示统合后的全局类型定义和函数实现
5. **等待用户审查和确认**，只有在用户明确确认后才能继续步骤 7

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

**涉及文件**：
- `create-xxx-moorex.ts` - 创建此文件（文件名根据实际 Agent 名称确定），定义工厂函数

**输出**：
- `createXxxMoorex` 工厂函数
- 函数接受配置参数，返回 Moorex 实例
- 可运行的 Agent 服务

**示例**：
```typescript
// create-xxx-moorex.ts
import { createMoorex } from "@moora/moorex";
import type { Moorex, MoorexDefinition } from "@moora/moorex";
import type { Signal, Effect, State } from "./types/unified";
import { initial } from "./unified/initial";
import { transition } from "./unified/transition";
import { effectsAt } from "./unified/effectsAt";
import { makeRunEffect, type MakeRunEffectOptions } from "./unified/runEffect";

export type CreateXxxMoorexOptions = MakeRunEffectOptions & {
  initialState?: State; // 可选的初始状态（用于恢复）
};

export function createXxxMoorex(
  options: CreateXxxMoorexOptions
): Moorex<Signal, Effect, State> {
  // 使用 makeRunEffect 创建带依赖注入的 runEffect 函数
  const runEffect = makeRunEffect({
    renderUI: options.renderUI,
    llmClient: options.llmClient,
    toolExecutor: options.toolExecutor,
  });
  
  // 创建 Moorex 定义
  const definition: MoorexDefinition<Signal, Effect, State> = {
    initial: options.initialState ? () => options.initialState! : initial,
    transition,
    effectsAt,
    runEffect,
  };
  
  // 返回 Moorex 实例
  return createMoorex(definition);
}

// 使用示例：创建 Moorex 实例，传递必要的依赖
// 状态机可以序列化（moorex.current()）和恢复（通过 initialState 参数）
```

**⚠️ 完成此步骤后，必须：**
1. 使用 `read_lints` 工具验证是否有类型错误或 Lint 错误
2. 更新检查清单，标记步骤 7 为完成
3. **暂停执行**，向用户展示完整的 Moorex 定义和可运行的 Agent 服务
4. **等待用户最终审查和确认**

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


