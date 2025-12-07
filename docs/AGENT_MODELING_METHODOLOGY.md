# Agent 建模方法�?V2

## 概述

本文档描述了一�?*迭代�?*�?Agent 建模方法论，用于将复杂的 AI Agent 建模为基�?Automata �?Moore 状态机。与传统的瀑布式建模方法不同，本方法从最小实现开始，通过追加需求的方式逐步扩展模型�?

## 核心概念

### Actor（行为体�?

**Actor** �?Agent 心智需要认知的行为体。例�?`User` Actor 并不是真正的用户，而是用户�?Agent 认知中的投射。每�?Actor 都是一个独立的 Moore 自动机，拥有自己的状态和输出�?

### Observation（观察）

**Observation** �?Actor 相互之间的观察，它是被观�?Actor 状态的切片。例�?`UserObLlm` 表示 User Actor �?Llm Actor 的观察�?

- 一�?Actor �?**State** 就是所有指向它�?Observation 的并集（所有入边的 Observation�?
- 一�?Actor �?**Context** 就是所有它发出�?Observation 的并集（所有出边的 Observation�?

在有向图上，所有节点的入边 Observation 的并�?= 所有节点的出边 Observation 的并�?= 所�?Observation�?

## 整体架构概览

我们建模的目标是从需求出发，设计�?Moore 自动机的核心要素�?

- `type State` - 状态类�?
- `type Input` - 输入类型
- `function initial` - 初始化函�?
- `function transition` - 状态转换函�?

**注意**：`output` 函数不属�?Agent 建模的一部分，它应该在使用时通过依赖注入的方式传入。这是因为：
- Output 函数包含副作用（�?API 调用、日志记录等），�?Agent 的核心建模应该是纯粹�?
- 不同的使用场景可能需要不同的 output 实现（如测试环境、生产环境）
- 将副作用与状态逻辑分离，提高了代码的可测试性和可维护�?

在设计阶段，我们应优先关注两个类�?`State`, `Input`；实现阶段，再关注两个函�?`initial`, `transition`�?

**纯函数要�?*�?
- `InitialFn`、`TransitionFn` 这两个函�?*必须是纯函数**，不能有副作�?
- `EffectFn` 虽然不属于建模的一部分，但其本身也应该是纯函数，只有其**返回�?*是一个副作用函数
- 这种设计确保了状态转换的可预测性和可测试性，副作用被隔离�?output 函数的返回值中

把整�?Actor 网络看作一�?Moore 自动机（使用 `@moora/automata` �?`moore` 函数），那么�?

- **�?State** 就是各个 Actor State 的并集（也是各个 Actor Context 的并集，因为有向图上，所有节点出边的并集 = 所有节点入边的并集 = 所有边�?
- **�?Input** 就是各个 Actor Input 的并集，每个 Actor �?Output 可以 Dispatch 特定�?Input，以驱动对应 State 的变�?
- **�?Output** 就是各个 Actor �?Output 的总和。这�?Output 是被 State 决定的，符合 Moore 机的定义

### Output 的定�?

Output 是一个同步副作用函数，type �?

```typescript
type Output<Input> = Eff<Dispatch<Input>, void>
// �? (dispatch: Dispatch<Input>) => void
```

**设计说明**�?

- Output 是一个同步函数，接收 `dispatch` 作为上下文参�?
- 如果需要异步操作（�?API 调用），应该在函数内部自行使�?`queueMicrotask` 来处�?
- 这种设计允许同步部分立即处理输出（如日志记录、UI 更新），同时异步副作用在微任务队列中执行
- 异步副作用可以通过 `dispatch` 产生新的 Input，形成反馈循�?

**�?Automata 的关�?*�?

`@moora/automata` �?`moore` 函数�?`Effect` 参数接收一个函�?`(state: State) => Output`，这个函数根据当前状态返回一个同步副作用函数。这个副作用函数在执行时会通过 `dispatch` 回调来驱动自动机的状态变化�?


### 代码层面的类型定�?

我们的一套自动机建模应该包括以下类型（注意，这里所有的类型都应该用 Zod 4 来定�?schema，再�?`z.infer` 推导出来具体的类型）�?

- **各个 Actor 的枚举类�?*，例�?
  - `type Actors = 'user' | 'llm'`
  
- **各个 Actor 之间�?Observation**，进而定义各�?Actor �?State & Context，乃�?Global State，例�?
  - Observations（观察类型）
    - `type UserObLlm = { assiMessages: AssiMessages }` - User �?Llm 的观�?
    - `type UserObUser = { userMessages: UserMessages }` - User 对自身的观察（自环）
    - `type LlmObLlm = { assiMessages: AssiMessages }` - Llm 对自身的观察（自环）
    - `type LlmObUser = { userMessages: UserMessages }` - Llm �?User 的观�?
  - States（状态类型）
    - `type StateOfUser = UserObUser & LlmObUser` - User 的状�?= 所有指�?User �?Observation 的并�?
    - `type StateOfLlm = UserObLlm & LlmObLlm` - Llm 的状�?= 所有指�?Llm �?Observation 的并�?
  - Contexts（上下文类型�?
    - `type ContextOfUser = UserObUser & UserObLlm` - User 的上下文 = 所�?User 发出�?Observation 的并�?
    - `type ContextOfLlm = LlmObUser & LlmObLlm` - Llm 的上下文 = 所�?Llm 发出�?Observation 的并�?
  
  - 注意，每�?State �?Context 都是 Object，由于它们的 properties 是复用的，所以要�?properties 定义公用的数据类型，例如
    - `type UserMessages = UserMessage[]`
    - `type AssiMessages = AssiMessage[]`
    - `type UserMessage = BaseMessage & { role: 'user' }`
    - `type AssiMessage = BaseMessage & { role: 'assistant' }`
    - `type BaseMessage = { id: string, content: string, timestamp: number }`

- **定义各个 Actor 可以 Dispatch �?Inputs**，例�?
  - `type InputFromUser = SendUserMessage` // 未来可能 union 更多类型
  - `type InputFromLlm = SendAssiMessage`
  - `type SendUserMessage = { type: 'send-user-message', id: string, content: string, timestamp: number }`
  - `type SendAssiMessage = { type: 'send-assi-message', id: string, content: string, timestamp: number }`

- **Helper Generic 类型**，用于类型推�?
  - `type StateOf<Actor extends Actors> = Actor extends 'user' ? StateOfUser : StateOfLlm`
  - `type ContextOf<Actor extends Actors> = Actor extends 'user' ? ContextOfUser : ContextOfLlm`
  - `type InputFrom<Actor extends Actors> = Actor extends 'user' ? InputFromUser : InputFromLlm`

- **关键函数的类型定�?*
  - `type InitialFnOf<Actor extends Actors> = () => StateOf<Actor>`
  - `type TransitionFnOf<Actor extends Actors> = (input: InputFrom<Actor>) => (state: StateOf<Actor>) => StateOf<Actor>`
  - `type EffectFnOf<Actor extends Actors> = Eff<{ context: ContextOf<Actor>; dispatch: Dispatch<AgentInput> }>`
  
  注意：`EffectFnOf` 返回 `Eff<{ context, dispatch }>`，直接接收包�?`context` �?`dispatch` 的对象。这是因为：
  - **Context** �?Actor 发出�?Observation 的并集，表示�?Actor 对外呈现的信�?
  - **Output** 函数根据 Actor �?Context（它向外发出的信息）来决定要执行什么副作用
  - 这符�?Moore 机的语义：输出由当前状态决定，�?Context 正是 Actor 状态中向外可见的部�?
  - Output 函数同时接收 `context` �?`dispatch`，允许在副作用中访问上下文并 dispatch 新的 Input
  - **重要设计**：这种非柯里化的设计允许 effect 在闭包外层创建，使得使用 `stateful` �?effect 组合器时，状态可以在多次调用之间正确共享
  
  **重要**�?
  - `InitialFn` �?`TransitionFn` �?Agent 建模的核心部分，必须�?*纯函�?*
  - `EffectFn` **不属�?Agent 建模**，应该在创建 Agent 实例时通过依赖注入传入
  - `EffectFn` 本身也应该是纯函数，只有其返回值是副作用函�?

- **定义 Agent 总的 State �?Input**，例�?
  - `type AgentState = StateOfUser & StateOfLlm`
  - `type AgentInput = InputFromUser | InputFromLlm`

### 文件结构

```
项目根目�?
�?
├── decl/                          # 类型声明目录（严格包含以下文件，不能减少，也不能增加�?
�?  ├── actors.ts                  # Actors 类型和常量定�?
�?  ├── observations.ts            # 所�?FooObBar 类型�?schema 和类型定�?
�?  �?                             #   包含 property 对应的类型，以及其依赖数据类型的 schema 及定�?
�?  ├── states.ts                  # 所�?StateOfFoo 类型�?schema 和类型定�?
�?  ├── contexts.ts                # 所�?ContextOfFoo 类型�?schema 和类型定�?
�?  ├── inputs.ts                  # 所�?Actor 可以 dispatch �?Input �?schema 和类型定�?
�?  ├── helpers.ts                 # 关键 Helper Generic 类型定义
�?  �?                             #   StateOf, ContextOf, InputFrom, InitialFnOf, TransitionFnOf, EffectFnOf
�?  ├── agent.ts                   # AgentState, AgentInput, EffectFns 的定�?
�?  └── index.ts                   # 综合 export
�?
├── impl/                          # 实现目录
�?  ├── initials/                 # 每个 actor 对应一个文件，另外含一�?index.ts
�?  �?  ├── user.ts               # 实现 user initial function
�?  �?  ├── llm.ts                # 实现 llm initial function
�?  �?  └── index.ts              # 综合 export
�?  �?
�?  ├── transitions/              # 每个 actor 对应一个文�?
�?  �?  �?                        # 如果有多�?Input 类型，可转文件夹
�?  �?  �?                        # 文件夹内每个�?Input 类型对应一个文�?
�?  �?  ├── user.ts               # 实现 user transition function
�?  �?  ├── llm.ts                # 实现 llm transition function
�?  �?  └── index.ts              # 综合 export
�?  �?
�?  ├── agent/                    # Agent 综合实现目录
�?  �?  ├── initial.ts            # initialAgent 函数实现
�?  �?  ├── transition.ts         # transitionAgent 函数实现
�?  �?  ├── effect.ts             # createEffectAgent 函数实现
�?  �?  ├── create.ts             # createAgent 工厂函数（接�?EffectFns 参数�?
�?  �?  └── index.ts              # 综合 export
�?  �?
�?  └── index.ts                  # 综合 export
�?
└── index.ts                       # 综合 export（项目入口）
```

**注意**：`impl/output/` 目录不属�?Agent 建模的一部分。如果需要提供默认的 output 实现作为参考，可以将其放在单独的目录中（如 `examples/` �?`defaults/`）�?

每个文件夹都必须严格的按照规定的结构组织，唯一�?exception 是，如果某个 .ts 文件过大，可以改成对应的文件夹进行代码拆分。例�?decl/observations.ts 如果太大，可以转�?decl/observations/，分成多个文件，通过 decl/observation/index.ts 综合 export

### 命名规范

- 所有的常量�?SNAKE_CASE
- 所有的类型�?PascalCase，如果遇到缩写，变换成一般的单词的形式，如要 Llm，不�?LLM
- 所有的函数和变量用 camelCase，如果遇到缩写，变换成一般的单词的形式，如要 llm，不�?LLM
- 所有的 user 名称�?kebab-case string，如 'user', 'llm', 'task-manager'

## 迭代式建模流�?

### 核心思想

与传统的瀑布式建模方法（如七步建模法）不同，本方法采�?*迭代�?*建模�?

1. **从最小实现开�?*：先实现一个最简单的、可运行的版�?
2. **以追加需求的方式扩展**：根据新需求逐步扩展模型，而不是一开始就设计完整的模�?
3. **每个迭代步骤都要 Review**：确保每一步的设计都符合需求，避免过度设计

这种方法更符合实际工程开发流程，因为在实际项目中，我们往往无法在一开始就想清楚具体有哪些参与方，有哪�?input/output�?

### 初始版本（最小实现）

初始版本只包�?`user` �?`llm` 两个 Actor，实现最基本的对话功能：

- **Actors**: `'user' | 'llm'`
- **Observations**:
  - `UserObLlm = { assiMessages: AssiMessages }` - User 观察 Llm 的回�?
  - `UserObUser = { userMessages: UserMessages }` - User 观察自己的消息（自环�?
  - `LlmObLlm = { assiMessages: AssiMessages }` - Llm 观察自己的回复（自环�?
  - `LlmObUser = { userMessages: UserMessages }` - Llm 观察 User 的消�?
- **Inputs**:
  - `InputFromUser = SendUserMessage`
  - `InputFromLlm = SendAssiMessage`

这个初始版本应该能够�?
- 用户发送消�?
- Llm 接收消息并生成回�?
- 用户接收并显示回�?

## 迭代扩展流程

迭代的每一个步骤都要和�?Review 好再继续。每个迭代步骤遵循以下流程：

### Step 1 - 增补 Context �?Input

这一步，要结合需求，考察各个 Actor，思考以下问题：

1. **是否需要新�?Actor�?* 如果需要，它的 Context �?Input 分别是什么？
2. **对于已有的每�?Actor，是否需要感知到新的上下�?Context�?* 如果需要，新上下文的类型定义是怎样的？
3. **对于已有的每�?Actor 是否需要发起新�?Input�?* 如果需要，�?Input 的类型定义是怎样的？

**操作**�?
- 把设计到的类型定义出来，写进对应的文件（`decl/inputs.ts`�?
- 扩展 `InputFromFoo` 类型
- **但不着急定义新�?`FooObBar` 类型，也不着急扩�?Context 定义**

### Step 2 - 找出�?Observations

对第一步找到的每个�?Context，思考它来自哪个 Actor，发现新�?Observations�?

**操作**�?
- 对面向每�?Actor �?Observations 进行综合去重，确保新增的 Observations 之间，以及它们和既有 Observations 之间无冗余信�?
- 创建实际�?`FooObBar` 类型，并加入对应�?`StateOfBar` �?`ContextOfFoo` 类型中去
- 更新 `decl/observations.ts`、`decl/states.ts`、`decl/contexts.ts`

### Step 3 - 审视 Actor �?State �?Input

这一步要确保 State �?Input 的完整性：

1. **对第二步每个 Actor 新增�?State，要审视是否有对应的 Input 来迭代它**。如果缺失，补充对应�?Input�?
2. **对第一步每�?Actor 新增�?Input，要审视是否有对应的 State 来承接它**。如果缺失，要思考是哪个 Actor 会关注这�?Input，增补对应的 Observation，并分别加到对应 Actor �?State �?Context�?

**操作**�?
- 检�?State �?Input 的对应关�?
- 补充缺失�?Input �?Observation
- 更新相关类型定义

### Step 4 - 补充实现代码逻辑

针对新增�?Actor、Context、State、Input，对应地调整 `initial`、`transition` 函数的实现�?

**操作**�?
- 更新 `impl/initials/` 中的初始化函�?
- 更新 `impl/transitions/` 中的状态转换函�?
- 更新 `impl/agent.ts` 中的统合函数
- 确保代码能够编译通过，类型检查无�?

**注意**：不需要在建模阶段实现 output 函数。Output 函数应该在使�?Agent 时通过 `createAgent(EffectFns)` 注入�?

### 迭代完成检�?

完成每个迭代步骤后，检查：

- [ ] 所有新增的类型定义都正�?
- [ ] State �?Input 的对应关系完�?
- [ ] Observation 的定义无冗余
- [ ] 代码实现符合类型定义
- [ ] 代码能够编译通过
- [ ] 功能符合需求预�?

## 使用 Automata

完成建模后，使用 `createAgent` 函数创建 Moore 自动机，需要注入各�?Actor �?output 函数�?

```typescript
import { createAgent } from '@moora/starter-agent';
import type { EffectFns } from '@moora/starter-agent';

// 定义各个 Actor �?output 函数
const EffectFns: EffectFns = {
  user: ({ context, dispatch }) => {
    // 同步执行，可以立即处理输�?
    console.log('User context:', context);
    // 如果需要异步操作，使用 queueMicrotask
  },
  llm: ({ context, dispatch }) => {
    // 同步执行
    console.log('LLM context:', context);
    // 如果需要异步操作，使用 queueMicrotask
    queueMicrotask(async () => {
      // 例如：调�?LLM API，然�?dispatch 回复消息
      const response = await callLlmApi(context.userMessages);
      dispatch({
        type: 'send-assi-message',
        id: 'msg-001',
        content: response,
        timestamp: Date.now(),
      });
    });
  },
};

// 创建 Agent 实例
const agent = createAgent(EffectFns);
```

注意：`output` 函数返回的是 `Output<Input>` 类型，它是一个同步副作用函数。如果需要异步操作，应该在函数内部自行使�?`queueMicrotask` 来处理�?

### 实际使用示例

```typescript
import { createAgent } from '@moora/starter-agent';
import type { EffectFns } from '@moora/starter-agent';

// 定义 output 函数（实际项目中可能来自不同的模块）
const EffectFns: EffectFns = {
  user: ({ context, dispatch }) => {
    console.log('[User] Messages:', context.userMessages);
    // User actor 的副作用，如果需要异步操作，使用 queueMicrotask
  },
  llm: ({ context, dispatch }) => {
    console.log('[LLM] Processing...');
    // 如果需要异步操作，使用 queueMicrotask
    queueMicrotask(async () => {
      // 调用 LLM API �?dispatch 回复
      if (context.userMessages.length > 0) {
        const lastMessage = context.userMessages[context.userMessages.length - 1];
        // const response = await callLlmApi(lastMessage.content);
        dispatch({
          type: 'send-assi-message',
          id: `assi-${Date.now()}`,
          content: `Echo: ${lastMessage.content}`,
          timestamp: Date.now(),
        });
      }
    });
  },
};

// 创建自动�?
const agent = createAgent(EffectFns);

// 订阅状态变�?
agent.subscribe((dispatch) => (output) => {
  // output �?Eff<Dispatch<AgentInput>, void>
  // 直接执行即可，如果需要异步操作，output 内部会使�?queueMicrotask
  output(dispatch);
});

// 直接 dispatch Input 来触发状态转�?
agent.dispatch({ type: 'send-user-message', id: 'msg-001', content: 'Hello', timestamp: Date.now() });
```


