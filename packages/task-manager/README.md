# @moora/task-manager

基于 automata 的纯任务管理器。提供任务调度、依赖管理、任务分解等功能。

## 安装

```bash
bun add @moora/task-manager
```

## 使用

### 创建 Task Manager

```typescript
import { createTaskManager } from "@moora/task-manager";

const manager = createTaskManager();
```

### 调度任务

```typescript
manager.dispatch({
  type: "schedule",
  tasks: [
    { id: "task-1", title: "任务 1", goal: "做某事" },
    {
      id: "task-2",
      title: "任务 2",
      goal: "做另一件事",
      dependencies: ["task-1"], // 依赖 task-1
    },
  ],
  timestamp: Date.now(),
});
```

### 分解任务

```typescript
manager.dispatch({
  type: "break-down",
  taskId: "task-1",
  subTasks: [
    { id: "sub-1", title: "子任务 1", goal: "子任务目标" },
    { id: "sub-2", title: "子任务 2", goal: "子任务目标", dependencies: ["sub-1"] },
  ],
  timestamp: Date.now(),
});
```

### 完成/失败任务

```typescript
// 完成任务
manager.dispatch({
  type: "complete",
  taskId: "task-1",
  result: "任务完成的结果",
  timestamp: Date.now(),
});

// 任务失败
manager.dispatch({
  type: "fail",
  taskId: "task-1",
  error: "失败原因",
  timestamp: Date.now(),
});
```

### 取消任务

```typescript
manager.dispatch({
  type: "cancel",
  taskIds: ["task-1", "task-2"],
  error: "取消原因",
  timestamp: Date.now(),
});
```

### 追加信息

```typescript
manager.dispatch({
  type: "append-info",
  taskIds: ["task-1"],
  info: "追加的信息",
  timestamp: Date.now(),
});
```

### 查询

```typescript
// 获取下一个需要执行的任务
const nextTask = manager.getNextTask();

// 获取任务详情
const taskInfo = manager.getTaskInfo("task-1");

// 获取所有任务 ID
const allIds = manager.getAllTaskIds();

// 获取所有活跃任务（未完成）
const activeTasks = manager.getActiveTasks();

// 获取所有已完成任务
const completedTasks = manager.getCompletedTasks();

// 获取顶层任务
const topLevelTasks = manager.getTopLevelTasks();

// 获取子任务
const childTasks = manager.getChildTasks("parent-task-id");

// 检查是否所有任务都已完成
const allDone = manager.isAllCompleted();

// 获取任务统计
const stats = manager.getTaskStats();
// { total: 10, ready: 3, pending: 2, succeeded: 4, failed: 1 }
```

### 订阅状态变化

```typescript
const unsubscribe = manager.subscribe((state) => {
  console.log("状态变化:", state);
});

// 取消订阅
unsubscribe();
```

## 任务状态

任务有以下四种状态：

- `ready`: 任务就绪，无未完成的依赖，可以执行
- `pending`: 任务等待中，有未完成的依赖
- `succeeded`: 任务成功完成
- `failed`: 任务失败（包括被取消）

## 纯函数 API

如果需要直接使用状态机而不是封装的实例，可以使用纯函数 API：

```typescript
import { initial, transition, getNextTask } from "@moora/task-manager";

// 创建初始状态
let state = initial();

// 应用输入
state = transition({
  type: "schedule",
  tasks: [{ id: "task-1", title: "任务 1", goal: "做某事" }],
  timestamp: Date.now(),
})(state);

// 查询
const nextTask = getNextTask(state);
```

## 类型

```typescript
import type {
  TaskStatus,
  Task,
  TaskInfo,
  TaskDefinition,
  SubTaskDefinition,
  TaskManagerState,
  Actuation,
  TaskManager,
} from "@moora/task-manager";
```
