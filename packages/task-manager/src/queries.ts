/**
 * Task Manager 查询函数
 *
 * 提供对 TaskManagerState 的只读查询
 */

import type { TaskInfo, TaskManagerState, TaskStatus } from "./types";
import { ROOT_TASK_ID } from "./types";

// ============================================================================
// 状态辅助函数
// ============================================================================

/**
 * 检查状态是否为终结状态
 */
export const isTerminalStatus = (status: TaskStatus): boolean =>
  status === "completed" ||
  status === "failed" ||
  status === "suspended" ||
  status === "cancelled";

/**
 * 检查状态是否为活跃状态（未终结）
 */
export const isActiveStatus = (status: TaskStatus): boolean =>
  !isTerminalStatus(status);

// ============================================================================
// 内部辅助函数
// ============================================================================

/**
 * 将状态的各部分组装为 TaskInfo
 */
const toTaskInfo = (
  state: TaskManagerState,
  taskId: string
): TaskInfo | null => {
  const creation = state.creations[taskId];
  const status = state.statuses[taskId];

  if (!creation || status === undefined) return null;

  const childIds = state.children[taskId] ?? [];
  const appendedMessages = state.appendedMessages
    .filter((msg) => msg.taskId === taskId)
    .map((msg) => msg.message);
  const result = state.results[taskId] ?? null;

  return {
    id: creation.id,
    title: creation.title,
    goal: creation.goal,
    parentId: creation.parentId,
    childIds,
    appendedMessages,
    status,
    result,
    createdAt: creation.createdAt,
  };
};

// ============================================================================
// 查询函数
// ============================================================================

/**
 * 获取顶层任务 ID 列表
 */
export const getTopLevelTaskIds = (state: TaskManagerState): string[] => {
  return state.children[ROOT_TASK_ID] ?? [];
};

/**
 * 获取下一个需要执行的任务
 *
 * 返回所有 ready 状态的任务中，创建时间最早的一个
 */
export const getNextTask = (state: TaskManagerState): TaskInfo | null => {
  const taskIds = Object.keys(state.creations);

  // 找出所有 ready 状态的任务
  const readyTaskIds = taskIds.filter((taskId) => {
    return state.statuses[taskId] === "ready";
  });

  if (readyTaskIds.length === 0) {
    return null;
  }

  // 按创建时间排序，返回最早的
  readyTaskIds.sort((a, b) => {
    const creationA = state.creations[a];
    const creationB = state.creations[b];
    if (!creationA || !creationB) return 0;
    return creationA.createdAt - creationB.createdAt;
  });

  const earliestTaskId = readyTaskIds[0];
  if (!earliestTaskId) return null;

  return toTaskInfo(state, earliestTaskId);
};

/**
 * 获取特定任务的详细信息
 */
export const getTaskInfo = (
  state: TaskManagerState,
  taskId: string
): TaskInfo | null => {
  return toTaskInfo(state, taskId);
};

/**
 * 获取所有任务 ID
 */
export const getAllTaskIds = (state: TaskManagerState): string[] => {
  return Object.keys(state.creations);
};

/**
 * 获取所有活跃（未终结）的任务
 */
export const getActiveTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.keys(state.creations)
    .filter((taskId) => {
      const status = state.statuses[taskId];
      return status !== undefined && isActiveStatus(status);
    })
    .map((taskId) => toTaskInfo(state, taskId))
    .filter((info): info is TaskInfo => info !== null);
};

/**
 * 获取所有终结的任务
 */
export const getTerminalTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.keys(state.creations)
    .filter((taskId) => {
      const status = state.statuses[taskId];
      return status !== undefined && isTerminalStatus(status);
    })
    .map((taskId) => toTaskInfo(state, taskId))
    .filter((info): info is TaskInfo => info !== null);
};

/**
 * 获取所有 ready 状态的任务
 */
export const getReadyTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.keys(state.creations)
    .filter((taskId) => state.statuses[taskId] === "ready")
    .map((taskId) => toTaskInfo(state, taskId))
    .filter((info): info is TaskInfo => info !== null);
};

/**
 * 获取所有 running 状态的任务
 */
export const getRunningTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.keys(state.creations)
    .filter((taskId) => state.statuses[taskId] === "running")
    .map((taskId) => toTaskInfo(state, taskId))
    .filter((info): info is TaskInfo => info !== null);
};

/**
 * 获取顶层任务
 */
export const getTopLevelTasks = (state: TaskManagerState): TaskInfo[] => {
  return getTopLevelTaskIds(state)
    .map((id) => toTaskInfo(state, id))
    .filter((info): info is TaskInfo => info !== null);
};

/**
 * 获取特定任务的子任务
 */
export const getChildTasks = (
  state: TaskManagerState,
  taskId: string
): TaskInfo[] => {
  const childIds = state.children[taskId] ?? [];
  return childIds
    .map((id) => toTaskInfo(state, id))
    .filter((info): info is TaskInfo => info !== null);
};

/**
 * 检查是否所有任务都已终结
 */
export const isAllTerminal = (state: TaskManagerState): boolean => {
  return Object.keys(state.creations).every((taskId) => {
    const status = state.statuses[taskId];
    return status !== undefined && isTerminalStatus(status);
  });
};

/**
 * 获取任务统计信息
 */
export const getTaskStats = (
  state: TaskManagerState
): {
  total: number;
  ready: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  suspended: number;
  cancelled: number;
} => {
  const taskIds = Object.keys(state.creations);
  let ready = 0;
  let pending = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;
  let suspended = 0;
  let cancelled = 0;

  for (const taskId of taskIds) {
    const status = state.statuses[taskId];
    switch (status) {
      case "ready":
        ready++;
        break;
      case "pending":
        pending++;
        break;
      case "running":
        running++;
        break;
      case "completed":
        completed++;
        break;
      case "failed":
        failed++;
        break;
      case "suspended":
        suspended++;
        break;
      case "cancelled":
        cancelled++;
        break;
    }
  }

  return {
    total: taskIds.length,
    ready,
    pending,
    running,
    completed,
    failed,
    suspended,
    cancelled,
  };
};

/**
 * 获取任务的追加消息
 */
export const getAppendedMessages = (
  state: TaskManagerState,
  taskId: string
): string[] => {
  return state.appendedMessages
    .filter((msg) => msg.taskId === taskId)
    .map((msg) => msg.message);
};
