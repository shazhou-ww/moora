/**
 * Task Manager Automata
 *
 * 基于 @moora/automata 的纯状态机实现
 */

import type {
  Actuation,
  ActuationSchedule,
  ActuationCancel,
  ActuationAppendInfo,
  ActuationBreakDown,
  ActuationComplete,
  ActuationFail,
  Task,
  TaskManagerState,
  TaskStatus,
} from "./types";
import { isCompleted } from "./types";

// ============================================================================
// 初始状态
// ============================================================================

/**
 * 创建初始状态
 */
export const initial = (): TaskManagerState => ({
  tasks: {},
  topLevelTaskIds: [],
});

// ============================================================================
// 内部辅助函数
// ============================================================================

/**
 * 计算任务状态（基于依赖）
 */
const computeStatus = (
  dependencies: string[],
  tasks: Record<string, Task>
): TaskStatus => {
  // 检查所有依赖是否已完成
  const allDepsCompleted = dependencies.every((depId) => {
    const dep = tasks[depId];
    return dep && isCompleted(dep.status);
  });

  return allDepsCompleted ? { type: "ready" } : { type: "pending" };
};

/**
 * 更新受影响任务的状态（当某个任务完成时）
 */
const updateDependentStatuses = (
  tasks: Record<string, Task>,
  completedTaskId: string
): Record<string, Task> => {
  const updatedTasks = { ...tasks };

  // 遍历所有任务，检查是否依赖于刚完成的任务
  for (const taskId of Object.keys(updatedTasks)) {
    const task = updatedTasks[taskId];
    if (!task) continue;

    // 只更新未完成的任务
    if (isCompleted(task.status)) continue;

    // 如果任务依赖于刚完成的任务，重新计算状态
    if (task.dependencies.includes(completedTaskId)) {
      const newStatus = computeStatus(task.dependencies, updatedTasks);
      if (newStatus.type !== task.status.type) {
        updatedTasks[taskId] = {
          ...task,
          status: newStatus,
          updatedAt: Date.now(),
        };
      }
    }
  }

  return updatedTasks;
};

/**
 * 递归标记任务及其子任务为取消
 */
const cancelTaskRecursively = (
  tasks: Record<string, Task>,
  taskId: string,
  error: string,
  timestamp: number
): Record<string, Task> => {
  const task = tasks[taskId];
  if (!task) return tasks;

  // 已经完成的任务不需要取消
  if (isCompleted(task.status)) return tasks;

  let updatedTasks = { ...tasks };

  // 先递归取消所有子任务
  for (const childId of task.childIds) {
    updatedTasks = cancelTaskRecursively(updatedTasks, childId, error, timestamp);
  }

  // 然后取消当前任务
  updatedTasks[taskId] = {
    ...task,
    status: { type: "failed", error },
    updatedAt: timestamp,
  };

  return updatedTasks;
};

// ============================================================================
// 各个 Actuation 的处理函数
// ============================================================================

/**
 * 处理 schedule 输入
 */
const handleSchedule = (
  state: TaskManagerState,
  actuation: ActuationSchedule
): TaskManagerState => {
  const { tasks: taskDefs, timestamp } = actuation;
  const newTasks = { ...state.tasks };
  const newTopLevelTaskIds = [...state.topLevelTaskIds];

  for (const def of taskDefs) {
    const dependencies = def.dependencies ?? [];
    const status = computeStatus(dependencies, newTasks);

    const task: Task = {
      id: def.id,
      title: def.title,
      goal: def.goal,
      parentId: def.parentId ?? null,
      dependencies,
      childIds: [],
      appendedInfos: [],
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    newTasks[def.id] = task;

    // 如果有父任务，更新父任务的 childIds
    if (def.parentId && newTasks[def.parentId]) {
      const parent = newTasks[def.parentId];
      newTasks[def.parentId] = {
        ...parent,
        childIds: [...parent.childIds, def.id],
        updatedAt: timestamp,
      };
    } else if (!def.parentId) {
      // 顶层任务
      newTopLevelTaskIds.push(def.id);
    }
  }

  return {
    tasks: newTasks,
    topLevelTaskIds: newTopLevelTaskIds,
  };
};

/**
 * 处理 cancel 输入
 */
const handleCancel = (
  state: TaskManagerState,
  actuation: ActuationCancel
): TaskManagerState => {
  const { taskIds, error = "Cancelled", timestamp } = actuation;
  let newTasks = { ...state.tasks };

  for (const taskId of taskIds) {
    newTasks = cancelTaskRecursively(newTasks, taskId, error, timestamp);
  }

  // 更新依赖于被取消任务的其他任务的状态
  for (const taskId of taskIds) {
    newTasks = updateDependentStatuses(newTasks, taskId);
  }

  return {
    ...state,
    tasks: newTasks,
  };
};

/**
 * 处理 append-info 输入
 */
const handleAppendInfo = (
  state: TaskManagerState,
  actuation: ActuationAppendInfo
): TaskManagerState => {
  const { taskIds, info, timestamp } = actuation;
  const newTasks = { ...state.tasks };

  for (const taskId of taskIds) {
    const task = newTasks[taskId];
    if (!task) continue;

    newTasks[taskId] = {
      ...task,
      appendedInfos: [...task.appendedInfos, info],
      updatedAt: timestamp,
    };
  }

  return {
    ...state,
    tasks: newTasks,
  };
};

/**
 * 处理 break-down 输入
 */
const handleBreakDown = (
  state: TaskManagerState,
  actuation: ActuationBreakDown
): TaskManagerState => {
  const { taskId, subTasks, timestamp } = actuation;
  const parentTask = state.tasks[taskId];

  if (!parentTask) return state;

  const newTasks = { ...state.tasks };
  const subTaskIds: string[] = [];

  for (const subDef of subTasks) {
    const dependencies = subDef.dependencies ?? [];
    const status = computeStatus(dependencies, newTasks);

    const subTask: Task = {
      id: subDef.id,
      title: subDef.title,
      goal: subDef.goal,
      parentId: taskId,
      dependencies,
      childIds: [],
      appendedInfos: [],
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    newTasks[subDef.id] = subTask;
    subTaskIds.push(subDef.id);
  }

  // 更新父任务的 childIds
  newTasks[taskId] = {
    ...parentTask,
    childIds: [...parentTask.childIds, ...subTaskIds],
    updatedAt: timestamp,
  };

  return {
    ...state,
    tasks: newTasks,
  };
};

/**
 * 处理 complete 输入
 */
const handleComplete = (
  state: TaskManagerState,
  actuation: ActuationComplete
): TaskManagerState => {
  const { taskId, result, timestamp } = actuation;
  const task = state.tasks[taskId];

  if (!task) return state;

  let newTasks = { ...state.tasks };

  // 更新任务状态为成功
  newTasks[taskId] = {
    ...task,
    status: { type: "succeeded", result },
    updatedAt: timestamp,
  };

  // 更新依赖于此任务的其他任务的状态
  newTasks = updateDependentStatuses(newTasks, taskId);

  return {
    ...state,
    tasks: newTasks,
  };
};

/**
 * 处理 fail 输入
 */
const handleFail = (
  state: TaskManagerState,
  actuation: ActuationFail
): TaskManagerState => {
  const { taskId, error, timestamp } = actuation;
  const task = state.tasks[taskId];

  if (!task) return state;

  let newTasks = { ...state.tasks };

  // 更新任务状态为失败
  newTasks[taskId] = {
    ...task,
    status: { type: "failed", error },
    updatedAt: timestamp,
  };

  // 更新依赖于此任务的其他任务的状态
  newTasks = updateDependentStatuses(newTasks, taskId);

  return {
    ...state,
    tasks: newTasks,
  };
};

// ============================================================================
// Transition 函数
// ============================================================================

/**
 * 状态转换函数
 *
 * 接收输入并返回状态更新函数
 */
export const transition =
  (actuation: Actuation) =>
    (state: TaskManagerState): TaskManagerState => {
      switch (actuation.type) {
        case "schedule":
          return handleSchedule(state, actuation);
        case "cancel":
          return handleCancel(state, actuation);
        case "append-info":
          return handleAppendInfo(state, actuation);
        case "break-down":
          return handleBreakDown(state, actuation);
        case "complete":
          return handleComplete(state, actuation);
        case "fail":
          return handleFail(state, actuation);
        default: {
          // Exhaustive check
          const _exhaustive: never = actuation;
          return state;
        }
      }
    };

// ============================================================================
// State Machine 定义
// ============================================================================

/**
 * Task Manager 状态机定义
 */
export const taskManagerMachine = {
  initial,
  transition,
};
