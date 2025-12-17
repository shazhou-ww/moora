# 自动机建模方法论

## 概述

自动机（Automata）是一个通用的编程模型，用自动机建模业务逻辑，具有以下特性：

- **历史不可变性**：状态转换是不可变的，不修改原有状态
- **无副作用**：状态转换函数是纯函数，不产生副作用
- **可预测性**：给定相同的输入序列，总能得到相同的最终状态

这些特性可以显著提升系统的可靠性、可测试性和可维护性。

## 核心概念

一个自动机的定义涉及两个类型和两个函数：

| 要素 | 类型/签名 | 说明 |
|------|----------|------|
| **State** | `type State` | 状态类型，描述系统在任意时刻的完整状态 |
| **Input** | `type Input` | 输入信号类型，描述系统可能接收的所有外部事件 |
| **initial** | `() => State` | 初始化函数，返回系统的初始状态 |
| **transition** | `(input: Input) => (state: State) => State` | 状态转换函数，根据输入和当前状态计算下一个状态 |

```typescript
type AutomataDefinition<State, Input> = {
  initial: () => State;
  transition: (input: Input) => (state: State) => State;
};
```

## 建模方法论

建模的过程，核心是**关注类型**。`State` 和 `Input` 类型确定下来，就可以提纲挈领地设计出对应的 `initial` 和 `transition` 函数。

类型设计的顺序是：**先 Input，后 State**。

- **Input**：外部输入相对直观，即系统需要对哪些信号做出响应
- **State**：从实际需求出发，思考谁需要观察这个自动机，需要看哪些值

---

## 第一步：Input 建模

Input 类型应该是若干**有限的输入信号**的 Union 类型。每种输入信号应统一定义为带有 `type` 字段的对象类型。

### 命名规范

- **单个 Input 类型名**：`{自动机名}Input{事件名}`
  - 事件名应为**过去式短语**，代表事件已经发生
  - 例如：`TaskManagerInputTaskCreated`、`TaskManagerInputTaskCompleted`

- **`type` 字段**：kebab-case 格式的 string literal
  - 例如：`'task-created'`、`'task-completed'`

- **总 Input 类型名**：`{自动机名}Input`
  - 所有单个 Input 类型的 Union

### 示例

```typescript
/**
 * 任务已创建事件
 */
type TaskManagerInputTaskCreated = {
  type: "task-created";
  taskId: string;
  title: string;
  goal: string;
  parentId: string;
};

/**
 * 任务开始执行事件
 */
type TaskManagerInputTaskStarted = {
  type: "task-started";
  taskId: string;
  workerId: string;
};

/**
 * 任务完成事件
 */
type TaskManagerInputTaskCompleted = {
  type: "task-completed";
  taskId: string;
  result: string;
};

/**
 * 任务失败事件
 */
type TaskManagerInputTaskFailed = {
  type: "task-failed";
  taskId: string;
  error: string;
};

/**
 * 任务挂起事件（等待用户输入）
 */
type TaskManagerInputTaskSuspended = {
  type: "task-suspended";
  taskId: string;
  reason: string;
};

/**
 * 任务取消事件
 */
type TaskManagerInputTaskCancelled = {
  type: "task-cancelled";
  taskId: string;
};

/**
 * TaskManager 的总 Input 类型
 */
type TaskManagerInput =
  | TaskManagerInputTaskCreated
  | TaskManagerInputTaskStarted
  | TaskManagerInputTaskCompleted
  | TaskManagerInputTaskFailed
  | TaskManagerInputTaskSuspended
  | TaskManagerInputTaskCancelled;
```

### 如何找到这些事件

思考**系统需要响应哪些可能发生的事件**即可。例如，对于一个 Task Manager，需要知道：

- 创建了一个新任务
- 某个任务开始被执行
- 某个任务完成了
- 某个任务失败了
- 某个任务挂起了（等待用户输入）
- 某个任务取消了
- 某个任务衍生出了若干子任务（通常可与"创建新任务"合并处理）

---

## 第二步：State 建模

### 常见误区

大家会习惯性地从 Input 来思考 State 建模，但这是**错误的做法**。

### 正确方法

State 的建模要**从实际需求出发**，思考：

1. **谁**需要观察这个自动机？
2. **具体要看哪些值**？

这些合在一起，就是自动机的 State。

### 示例：Task Manager 的 State 建模

#### 观察者 1：Coordinator Agent

协调其他 Agent 工作的 Coordinator Agent 需要：

| 需求 | State 设计 |
|------|-----------|
| 当有闲置 worker agent 时，查看下一个 Ready 状态的任务 | `readyTasks: Set<TaskId>` |
| 当有 top level 任务完成/失败/挂起时，通知用户 | `runningTopLevelTasks: Set<TaskId>` |
| 收到用户消息时，对 top level 任务做语义检索 | `topLevelTasks: Map<TaskId, SemanticIndex>` |

> **Ready 状态**：指尚未分配的，无依赖子任务，或者所有子任务都已完成/取消/失败/挂起的任务。

#### 观察者 2：Worker Agent

执行特定任务的 Worker Agent 需要：

| 需求 | State 设计 |
|------|-----------|
| 进入新的 ReAct iteration 时，查看是否有新的追加信息 | `taskAppendedInfo: Map<TaskId, AppendedInfo[]>` |
| 响应追加信息时，知道当前任务有哪些子任务 | `taskSubTasks: Map<TaskId, TaskId[]>` |

#### 观察者 3：UI 可视化

在 UI 上展示 Task Tree 需要：

| 需求 | State 设计 |
|------|-----------|
| 给定 task 查到它的 sub tasks（id, title, status） | `taskSubTasks: Map<TaskId, SubTaskInfo[]>` |
| 给定 task 查到它的详情（id, title, status, goal, parentId） | `taskDetails: Map<TaskId, TaskDetail>` |

#### 综合 State 设计

将所有观察者的需求汇总、去重后，得到完整的 State：

```typescript
type TaskManagerState = {
  /**
   * 所有 Ready 状态的任务集合
   * Ready = 尚未分配 && (无子任务 || 所有子任务都已终结)
   */
  readyTasks: Set<TaskId>;

  /**
   * 所有正在运行的 top level 任务集合
   */
  runningTopLevelTasks: Set<TaskId>;

  /**
   * 所有 top level 任务及其语义索引
   */
  topLevelTasksIndex: Map<TaskId, SemanticIndex>;

  /**
   * 每个任务的追加信息列表
   */
  taskAppendedInfo: Map<TaskId, AppendedInfo[]>;

  /**
   * 每个任务的子任务列表
   */
  taskSubTasks: Map<TaskId, TaskId[]>;

  /**
   * 每个任务的详情
   */
  taskDetails: Map<TaskId, TaskDetail>;
};
```

---

## 第三步：编码 initial & transition

有了 `Input` 和 `State`，按照既定的业务逻辑，就可以编码 `initial` 和 `transition` 函数的细节了。

### initial 函数

返回系统的初始状态：

```typescript
const initial = (): TaskManagerState => ({
  readyTasks: new Set(),
  runningTopLevelTasks: new Set(),
  topLevelTasksIndex: new Map(),
  taskAppendedInfo: new Map(),
  taskSubTasks: new Map(),
  taskDetails: new Map(),
});
```

### transition 函数

根据输入信号和当前状态，计算下一个状态。使用柯里化形式，便于函数组合：

```typescript
const transition = (input: TaskManagerInput) => (state: TaskManagerState): TaskManagerState => {
  switch (input.type) {
    case "task-created":
      return handleTaskCreated(input, state);
    case "task-started":
      return handleTaskStarted(input, state);
    case "task-completed":
      return handleTaskCompleted(input, state);
    case "task-failed":
      return handleTaskFailed(input, state);
    case "task-suspended":
      return handleTaskSuspended(input, state);
    case "task-cancelled":
      return handleTaskCancelled(input, state);
  }
};
```

### 状态更新的纯函数性

**重要**：`transition` 函数必须是**纯函数**，不能修改原有状态，应返回新的状态对象。

推荐使用 `mutative` 的 `create()` 函数进行不可变更新：

```typescript
import { create } from "mutative";

const handleTaskCreated = (
  input: TaskManagerInputTaskCreated,
  state: TaskManagerState
): TaskManagerState => {
  return create(state, (draft) => {
    // 添加任务详情
    draft.taskDetails.set(input.taskId, {
      id: input.taskId,
      title: input.title,
      goal: input.goal,
      parentId: input.parentId,
      status: "pending",
    });

    // 新任务默认进入 ready 集合
    draft.readyTasks.add(input.taskId);

    // 如果是 top level 任务
    if (input.parentId === "") {
      draft.topLevelTasksIndex.set(input.taskId, createSemanticIndex(input));
    }

    // 更新父任务的子任务列表
    if (input.parentId !== "") {
      const subTasks = draft.taskSubTasks.get(input.parentId) ?? [];
      subTasks.push(input.taskId);
      draft.taskSubTasks.set(input.parentId, subTasks);
    }
  });
};
```

---

## 方法论总结

```
┌─────────────────────────────────────────────────────────────┐
│                    自动机建模三步法                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  第一步：Input 建模                                          │
│  ─────────────────                                          │
│  问：系统需要响应哪些事件？                                    │
│  输出：Input 类型（若干事件类型的 Union）                      │
│                                                             │
│                          ↓                                  │
│                                                             │
│  第二步：State 建模                                          │
│  ─────────────────                                          │
│  问：谁需要观察这个自动机？需要看哪些值？                       │
│  输出：State 类型（所有观察者需求的并集）                      │
│                                                             │
│                          ↓                                  │
│                                                             │
│  第三步：编码 initial & transition                           │
│  ─────────────────────────────────                          │
│  输出：initial 函数、transition 函数                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心要点

1. **类型先行**：先确定 `Input` 和 `State` 类型，再实现函数
2. **Input 从事件出发**：思考系统需要响应哪些事件
3. **State 从观察者出发**：思考谁需要观察、需要看什么值
4. **纯函数约束**：`transition` 必须是纯函数，无副作用
5. **不可变更新**：状态转换返回新状态，不修改原状态

---

## 相关文档

- [Agent 建模方法论](./AGENT_MODELING_METHODOLOGY.md) - 基于自动机的 Agent 建模，引入 Actor 网络、Observation 等更高层概念
