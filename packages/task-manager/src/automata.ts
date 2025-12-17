/**
 * Task Manager Automata
 *
 * 基于 @moora/automata 的纯状态机实现
 */

import type {
  TaskManagerInput,
  TaskManagerInputTaskCreated,
  TaskManagerInputTaskStarted,
  TaskManagerInputTaskCompleted,
  TaskManagerInputTaskFailed,
  TaskManagerInputTaskSuspended,
  TaskManagerInputTaskCancelled,
  TaskManagerInputMessageAppended,
  TaskManagerState,
  TaskStatus,
} from "./types";
import { ROOT_TASK_ID } from "./types";

// ============================================================================
// 初始状态
// ============================================================================

/**
 * 创建初始状态
 */
export const initial = (): TaskManagerState => ({
  creations: {},
  statuses: {},
  results: {},
  children: {
    [ROOT_TASK_ID]: [],
  },
  appendedMessages: [],
});

// ============================================================================
// 内部辅助函数
// ============================================================================

/**
 * 检查状态是否为终结状态
 */
const isTerminalStatus = (status: TaskStatus): boolean =>
  status === "completed" ||
  status === "failed" ||
  status === "suspended" ||
  status === "cancelled";

/**
 * 检查父任务是否所有子任务都已终结
 * 如果是，将父任务从 pending → ready
 */
const checkParentReady = (
  state: TaskManagerState,
  taskId: string
): TaskManagerState => {
  const creation = state.creations[taskId];
  if (!creation) return state;

  const parentId = creation.parentId;
  if (parentId === ROOT_TASK_ID) return state;

  const parentStatus = state.statuses[parentId];
  if (parentStatus !== "pending") return state;

  const siblingIds = state.children[parentId] ?? [];
  const allTerminal = siblingIds.every((id) => {
    const status = state.statuses[id];
    return status !== undefined && isTerminalStatus(status);
  });

  if (allTerminal) {
    return {
      ...state,
      statuses: {
        ...state.statuses,
        [parentId]: "ready",
      },
    };
  }

  return state;
};

/**
 * 递归取消任务及其所有子任务
 */
const cancelTaskRecursively = (
  state: TaskManagerState,
  taskId: string,
  reason: string,
  timestamp: number
): TaskManagerState => {
  const status = state.statuses[taskId];

  // 如果任务不存在或已是终结状态，跳过
  if (status === undefined || isTerminalStatus(status)) {
    return state;
  }

  let newState = { ...state };
  const childIds = state.children[taskId] ?? [];

  // 先递归取消所有子任务
  for (const childId of childIds) {
    newState = cancelTaskRecursively(newState, childId, reason, timestamp);
  }

  // 然后取消当前任务
  newState = {
    ...newState,
    statuses: {
      ...newState.statuses,
      [taskId]: "cancelled",
    },
    results: {
      ...newState.results,
      [taskId]: { type: "cancelled", reason },
    },
  };

  return newState;
};

// ============================================================================
// 各个 Input 的处理函数
// ============================================================================

/**
 * 处理 task-created 事件
 */
const handleTaskCreated = (
  state: TaskManagerState,
  input: TaskManagerInputTaskCreated
): TaskManagerState => {
  const { taskId, title, goal, parentId, timestamp } = input;

  // 创建任务信息
  const creation = { id: taskId, title, goal, parentId, createdAt: timestamp };

  // 更新 children
  const parentChildren = state.children[parentId] ?? [];

  let newStatuses = {
    ...state.statuses,
    [taskId]: "ready" as TaskStatus,
  };

  // 如果父任务是 running，转为 pending
  if (parentId !== ROOT_TASK_ID && state.statuses[parentId] === "running") {
    newStatuses = {
      ...newStatuses,
      [parentId]: "pending",
    };
  }

  return {
    ...state,
    creations: {
      ...state.creations,
      [taskId]: creation,
    },
    statuses: newStatuses,
    children: {
      ...state.children,
      [parentId]: [...parentChildren, taskId],
      [taskId]: [],
    },
  };
};

/**
 * 处理 task-started 事件
 */
const handleTaskStarted = (
  state: TaskManagerState,
  input: TaskManagerInputTaskStarted
): TaskManagerState => {
  const { taskId } = input;

  // 检查任务是否存在且为 ready 状态
  if (state.statuses[taskId] !== "ready") {
    return state;
  }

  return {
    ...state,
    statuses: {
      ...state.statuses,
      [taskId]: "running",
    },
  };
};

/**
 * 处理 task-completed 事件
 */
const handleTaskCompleted = (
  state: TaskManagerState,
  input: TaskManagerInputTaskCompleted
): TaskManagerState => {
  const { taskId, result } = input;

  // 检查任务是否存在且为 running 状态
  if (state.statuses[taskId] !== "running") {
    return state;
  }

  let newState: TaskManagerState = {
    ...state,
    statuses: {
      ...state.statuses,
      [taskId]: "completed",
    },
    results: {
      ...state.results,
      [taskId]: { type: "success", result },
    },
  };

  // 检查父任务是否需要变为 ready
  newState = checkParentReady(newState, taskId);

  return newState;
};

/**
 * 处理 task-failed 事件
 */
const handleTaskFailed = (
  state: TaskManagerState,
  input: TaskManagerInputTaskFailed
): TaskManagerState => {
  const { taskId, error } = input;

  // 检查任务是否存在且为 running 状态
  if (state.statuses[taskId] !== "running") {
    return state;
  }

  let newState: TaskManagerState = {
    ...state,
    statuses: {
      ...state.statuses,
      [taskId]: "failed",
    },
    results: {
      ...state.results,
      [taskId]: { type: "failure", error },
    },
  };

  // 检查父任务是否需要变为 ready
  newState = checkParentReady(newState, taskId);

  return newState;
};

/**
 * 处理 task-suspended 事件
 */
const handleTaskSuspended = (
  state: TaskManagerState,
  input: TaskManagerInputTaskSuspended
): TaskManagerState => {
  const { taskId, reason } = input;

  // 检查任务是否存在且为 running 状态
  if (state.statuses[taskId] !== "running") {
    return state;
  }

  let newState: TaskManagerState = {
    ...state,
    statuses: {
      ...state.statuses,
      [taskId]: "suspended",
    },
    results: {
      ...state.results,
      [taskId]: { type: "suspended", reason },
    },
  };

  // 检查父任务是否需要变为 ready
  newState = checkParentReady(newState, taskId);

  return newState;
};

/**
 * 处理 task-cancelled 事件
 */
const handleTaskCancelled = (
  state: TaskManagerState,
  input: TaskManagerInputTaskCancelled
): TaskManagerState => {
  const { taskId, reason, timestamp } = input;

  let newState = cancelTaskRecursively(state, taskId, reason, timestamp);

  // 检查父任务是否需要变为 ready
  newState = checkParentReady(newState, taskId);

  return newState;
};

/**
 * 处理 message-appended 事件
 */
const handleMessageAppended = (
  state: TaskManagerState,
  input: TaskManagerInputMessageAppended
): TaskManagerState => {
  const { taskIds, message, timestamp } = input;

  // 过滤有效的 taskIds
  const validTaskIds = taskIds.filter((id) => state.creations[id]);
  if (validTaskIds.length === 0) {
    return state;
  }

  // 添加消息
  const newMessages = validTaskIds.map((taskId) => ({
    taskId,
    message,
    timestamp,
  }));

  // 更新状态：非 running 状态的任务 → ready
  const newStatuses = { ...state.statuses };
  for (const taskId of validTaskIds) {
    const status = state.statuses[taskId];
    if (status !== undefined && status !== "running") {
      newStatuses[taskId] = "ready";
    }
  }

  return {
    ...state,
    statuses: newStatuses,
    appendedMessages: [...state.appendedMessages, ...newMessages],
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
  (input: TaskManagerInput) =>
  (state: TaskManagerState): TaskManagerState => {
    switch (input.type) {
      case "task-created":
        return handleTaskCreated(state, input);
      case "task-started":
        return handleTaskStarted(state, input);
      case "task-completed":
        return handleTaskCompleted(state, input);
      case "task-failed":
        return handleTaskFailed(state, input);
      case "task-suspended":
        return handleTaskSuspended(state, input);
      case "task-cancelled":
        return handleTaskCancelled(state, input);
      case "message-appended":
        return handleMessageAppended(state, input);
      default: {
        // Exhaustive check
        const _exhaustive: never = input;
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
