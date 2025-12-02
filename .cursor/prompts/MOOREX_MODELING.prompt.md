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
- ✅ **类型和 Lint 检查**：**每完成一个步骤后，必须使用 `read_lints` 工具验证是否有 TypeScript 类型错误或 Lint 错误，确保代码质量**

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

**输出**：
- 每个参与者的 `InputFor<P>` 类型（使用 Zod@4 Schema）
- 每个参与者的 `OutputFrom<P>` 类型（使用 Zod@4 Schema）
- 工具类型：`type InputFor<P extends Participant> = ...`
- 工具类型：`type OutputFrom<P extends Participant> = ...`
- 工具类型：`type RunEffectFn<P extends Participant> = (input: InputFor<P>) => Promise<OutputFrom<P>>`

**示例**：
```typescript
import { z } from "zod";

// 为每个 Participant 定义 InputFor 和 OutputFrom 的 Zod Schema
// InputForUser: UI State（如 messages 列表）
const inputForUserSchema = z.object({ /* ... */ });
type InputForUser = z.infer<typeof inputForUserSchema>;

// OutputFromUser: User Actions（如 sendMessage, cancelStreaming）
const outputFromUserSchema = z.discriminatedUnion("type", [ /* ... */ ]);
type OutputFromUser = z.infer<typeof outputFromUserSchema>;

// 类似地为其他 Participant 定义 I/O Schema
// InputForAgent, OutputFromAgent, InputForToolkit, OutputFromToolkit...

// 工具类型：根据 Participant 类型推导对应的 Input/Output
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

**输出**：
- Channel 常量定义：`const Channel_USER_AGENT = { source: USER, target: AGENT }`
- Loopback Channel 常量定义：`const Channel_USER_USER = { source: USER, target: USER }`
- Channel 类型定义：`type ChannelUserAgent = typeof Channel_USER_AGENT`
- 所有 Channel 的联合类型：`type Channel = ChannelUserAgent | ...`

**示例**：
```typescript
// Channel 常量定义（节点间通道）
const Channel_USER_AGENT = { source: USER, target: AGENT };
const Channel_AGENT_TOOLKIT = { source: AGENT, target: TOOLKIT };
const Channel_TOOLKIT_AGENT = { source: TOOLKIT, target: AGENT };
const Channel_AGENT_USER = { source: AGENT, target: USER };

// Loopback Channel 常量定义（自环通道）
const Channel_USER_USER = { source: USER, target: USER };
const Channel_AGENT_AGENT = { source: AGENT, target: AGENT };
const Channel_TOOLKIT_TOOLKIT = { source: TOOLKIT, target: TOOLKIT };

// Channel 类型定义
type ChannelUserAgent = typeof Channel_USER_AGENT;
type ChannelAgentToolkit = typeof Channel_AGENT_TOOLKIT;
type ChannelToolkitAgent = typeof Channel_TOOLKIT_AGENT;
type ChannelAgentUser = typeof Channel_AGENT_USER;
type ChannelUserUser = typeof Channel_USER_USER;
type ChannelAgentAgent = typeof Channel_AGENT_AGENT;
type ChannelToolkitToolkit = typeof Channel_TOOLKIT_TOOLKIT;

// 所有 Channel 的联合类型
type Channel = 
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

**输出**：
- 每条 Channel 的 State Schema：`const stateUserAgentSchema = ...`
- 每条 Channel 的 State 类型：`type StateUserAgent = z.infer<typeof stateUserAgentSchema>`
- 每条 Channel 的 transition 函数：`const transitionUserAgent = ...`

**示例**：
```typescript
import { z } from "zod";

// 为每条 Channel 定义 State Schema（表示 Target 节点对 Source 节点状态的关注点）
const stateUserAgentSchema = z.object({
  latestUserMessage: z.string(),
  messageHistory: z.array(/* ... */),
});
type StateUserAgent = z.infer<typeof stateUserAgentSchema>;

const stateAgentToolkitSchema = z.object({
  pendingToolCalls: z.array(/* ... */),
});
type StateAgentToolkit = z.infer<typeof stateAgentToolkitSchema>;

// 为每条 Channel 定义 transition 函数（纯函数）
// transition 函数描述 State 如何随 Source 节点的 Output 变化
const transitionUserAgent = (
  output: OutputFromUser,
  state: StateUserAgent
): StateUserAgent => {
  // 根据 output 的类型，使用 mutative 的 create() 进行不可变更新
  // 例如：如果 output.type === "sendMessage"，更新 latestUserMessage 和 messageHistory
  // 返回新的 State
};

const transitionAgentToolkit = (
  output: OutputFromAgent,
  state: StateAgentToolkit
): StateAgentToolkit => {
  // 根据 output 的类型更新对应的 State
  // 例如：如果 output.type === "callTool"，添加到 pendingToolCalls
};
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

**输出**：
- 每个 Participant 的 Effect 类型定义
- 每个 Participant 的 `effectsAtFor<P>` 函数：返回单个 Effect（表示要更新 UI 或触发异步操作）
- 每个 Participant 的 `runEffectFor<P>` 函数：调用 render UI callback 或其他异步操作，传递 State 和 dispatch 方法

**示例**：
```typescript
import type { Dispatch, EffectController } from "@moora/moorex";

// 为每个 Participant 定义极简的 Effect 类型
// Effect 只包含无法从状态中获取的信息
type EffectOfUser = {
  kind: "updateUI";
  // 不需要包含 messages，因为可以从 state 中获取
};

type EffectOfAgent = {
  kind: "callLLM" | "callTool";
  // 不需要包含完整的 context，因为可以从 state 中获取
};

// effectsAt 函数：根据节点的"综合观察"（所有入边 Channel 的 State）推导出要触发的 Effect
const effectsAtForUser = (
  state: StateUserAgent
): EffectOfUser | null => {
  // 根据 state 判断是否需要触发 Effect
  // 例如：如果有新消息，返回 { kind: "updateUI" }
  // 否则返回 null
};

const effectsAtForAgent = (
  stateUserAgent: StateUserAgent,
  stateToolkitAgent: StateToolkitAgent
): EffectOfAgent | null => {
  // 综合多个 Channel State，判断需要触发的 Effect
  // 例如：如果有新的用户消息或工具调用结果，返回 { kind: "callLLM" }
};

// runEffect 函数：执行副作用，调用对应的异步 Actor
const runEffectForUser = (
  effect: EffectOfUser,
  state: StateUserAgent,
  dispatch: Dispatch<OutputFromUser>
): EffectController<OutputFromUser> => {
  // 返回 EffectController，包含 start 和 cancel 方法
  // start: 调用 UI render callback，传递 state 和 dispatch
  // cancel: 清理 UI 资源
};

const runEffectForAgent = (
  effect: EffectOfAgent,
  stateUserAgent: StateUserAgent,
  stateToolkitAgent: StateToolkitAgent,
  dispatch: Dispatch<OutputFromAgent>
): EffectController<OutputFromAgent> => {
  // start: 从 state 中获取完整信息，调用 LLM API，根据响应 dispatch 相应的 Output
  // cancel: 取消 LLM 调用
};
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
- 合并所有 Channel 的 State 类型，形成全局 State
- Signal 是各个 Participant 的 Output 的 union（改名为 Signal，不再是 Input）
- Effect 是各个 Participant Effect 的 union
- 定义从全局 State 推导每个 Channel State 的函数
- 统合所有 transition、effectsAt、runEffect 函数
- **重要**：统合后的 `initial`、`transition`、`effectsAt`、`runEffect` 函数必须符合 `@moora/moorex` 的 `MoorexDefinition<Input, Effect, State>` 类型定义：
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
- **重要**：`runEffect` 函数往往需要注入依赖（如 LLM client、tool executor、UI render callback 等），这些依赖应该通过柯里化的方式传入。定义 `makeRunEffectForXxx` 函数，接收一个 options 对象，返回符合 `MoorexDefinition` 要求的 `runEffect` 函数

**输出**：
- 统一的 `State` 类型（所有 Channel State 的合并）
- 统一的 `Signal` 类型（各个 Participant Output 的 union）
- 统一的 `Effect` 类型（各个 Participant Effect 的 union）
- `initial` 函数：返回初始 State（符合 `() => State` 类型）
- `transition` 函数：处理 Signal，更新 State（符合 `(input: Signal) => (state: State) => State` 类型）
- `effectsAt` 函数：从 State 推导 Effect（符合 `(state: State) => Record<string, Effect>` 类型）
- `makeRunEffect` 函数：柯里化函数，接收 options，返回 `runEffect` 函数（符合 `(effect: Effect, state: State, key: string) => EffectController<Signal>` 类型）
- 从 State 推导每个 Channel State 的函数：`getStateForChannel<C extends Channel>(state: State): StateForChannel<C>`

**示例**：
```typescript
import type { MoorexDefinition, EffectController } from "@moora/moorex";

// 统合后的全局 State（所有 Channel State 的合并）
type State = {
  userAgent: StateUserAgent;
  agentToolkit: StateAgentToolkit;
  toolkitAgent: StateToolkitAgent;
  agentUser: StateAgentUser;
  // ... 其他 Channel State
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
  // 根据 channel 返回对应的 State 字段
};

// initial 函数：返回初始 State（符合 () => State 类型）
const initial = (): State => {
  // 返回所有 Channel State 的初始值
};

// transition 函数：处理 Signal，更新 State
// 必须符合 (input: Signal) => (state: State) => State 类型（柯里化形式）
const transition = (signal: Signal) => (state: State): State => {
  // 根据 signal 的类型和来源，调用对应的 Channel transition 函数
  // 使用 mutative 的 create() 进行不可变更新
  // 例如：如果 signal 来自 User，调用 transitionUserAgent 更新 userAgent
};

// effectsAt 函数：从 State 推导 Effect（符合 (state: State) => Record<string, Effect> 类型）
const effectsAt = (state: State): Record<string, Effect> => {
  // 调用各个节点的 effectsAtFor<P> 函数
  // 收集所有非 null 的 Effect，以节点名作为 key
  // 返回 Effect Record
};

// runEffect 的 options 类型定义（包含所有需要的依赖）
type MakeRunEffectOptions = {
  renderUI: (state: StateUserAgent, dispatch: Dispatch<OutputFromUser>) => void;
  llmClient: { call: (context: LLMContext) => Promise<LLMResponse> };
  toolExecutor: { execute: (toolName: string, args: Record<string, unknown>) => Promise<string> };
  // ... 其他依赖
};

// makeRunEffect 函数：柯里化函数，接收 options，返回 runEffect 函数
// 返回的函数必须符合 (effect: Effect, state: State, key: string) => EffectController<Signal> 类型
const makeRunEffect = (
  options: MakeRunEffectOptions
): ((effect: Effect, state: State, key: string) => EffectController<Signal>) => {
  // 从 options 中解构依赖（renderUI, llmClient, toolExecutor 等）
  
  // 返回 runEffect 函数
  return (effect: Effect, state: State, key: string): EffectController<Signal> => {
    // 根据 effect.kind 判断类型
    // 调用对应的 runEffectFor<P> 函数，传递必要的 state 和 dispatch
    // 返回 EffectController，包含 start 和 cancel 方法
  };
};

// 类型验证：确保统合后的函数符合 MoorexDefinition 类型
const _typeCheck: MoorexDefinition<Signal, Effect, State> = {
  initial,
  transition,
  effectsAt,
  runEffect: makeRunEffect({ /* 占位 options */ }),
};
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

**输出**：
- `createXxxMoorex` 工厂函数
- 函数接受配置参数，返回 Moorex 实例
- 可运行的 Agent 服务

**示例**：
```typescript
import { createMoorex } from "@moora/moorex";
import type { Moorex } from "@moora/moorex";

type CreateXxxMoorexOptions = {
  renderUI: (state: StateUserAgent, dispatch: Dispatch<OutputFromUser>) => void;
  llmClient: { call: (context: LLMContext) => Promise<LLMResponse> };
  toolExecutor: { execute: (toolName: string, args: Record<string, unknown>) => Promise<string> };
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


