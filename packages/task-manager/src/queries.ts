/**
 * Task Manager 查询函数
 *
 * 提供对 TaskManagerState 的只读查询
 * TaskStatus 从 completions 和 children 推导
 */

import type { TaskInfo, TaskManagerState, TaskStatus } from "./types";
import { ROOT_TASK_ID } from "./types";

// ============================================================================
// 状态辅助函数
// ============================================================================

/**
 * 检查任务是否已完成（成功或失败）
 */
export const isCompleted = (status: TaskStatus): boolean =>
  status.type === "succeeded" || status.type === "failed";

/**
 * 检查任务是否活跃（未完成）
 */
export const isActive = (status: TaskStatus): boolean => !isCompleted(status);

// ============================================================================
// 状态推导函数
// ============================================================================

/**
 * 推导任务状态
 *
 * 规则：
 * - 如果任务在 completions 中，返回 succeeded 或 failed
 * - 如果任务有子任务且存在未完成的子任务，返回 pending
 * - 否则返回 ready
 */
export const deriveTaskStatus = (
  state: TaskManagerState,
  taskId: string
): TaskStatus => {
  const completion = state.completions[taskId];

  // 如果已完成，根据 isSuccess 返回 succeeded 或 failed
  if (completion) {
    if (completion.isSuccess) {
      return { type: "succeeded", result: completion.result };
    } else {
      return { type: "failed", error: completion.error };
    }
  }

  // 检查子任务
  const childIds = state.children[taskId] ?? [];

  // 如果有子任务，检查是否都已完成
  if (childIds.length > 0) {
    const allChildrenCompleted = childIds.every((childId) => {
      return state.completions[childId] !== undefined;
    });

    if (!allChildrenCompleted) {
      return { type: "pending" };
    }
  }

  return { type: "ready" };
};

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
  if (!creation) return null;

  const childIds = state.children[taskId] ?? [];
  const appendedInfos = state.appendedInfos
    .filter((info) => info.taskId === taskId)
    .map((info) => info.info);
  const status = deriveTaskStatus(state, taskId);

  return {
    id: creation.id,
    title: creation.title,
    goal: creation.goal,
    parentId: creation.parentId,
    childIds,
    appendedInfos,
    status,
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
    const status = deriveTaskStatus(state, taskId);
    return status.type === "ready";
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
 * 获取所有活跃（未完成）的任务
 */
export const getActiveTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.keys(state.creations)
    .filter((taskId) => {
      const status = deriveTaskStatus(state, taskId);
      return status.type === "pending" || status.type === "ready";
    })
    .map((taskId) => toTaskInfo(state, taskId))
    .filter((info): info is TaskInfo => info !== null);
};

/**
 * 获取所有已完成的任务
 */
export const getCompletedTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.keys(state.creations)
    .filter((taskId) => {
      const status = deriveTaskStatus(state, taskId);
      return isCompleted(status);
    })
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
 * 检查是否所有任务都已完成
 */
export const isAllCompleted = (state: TaskManagerState): boolean => {
  return Object.keys(state.creations).every((taskId) => {
    const status = deriveTaskStatus(state, taskId);
    return isCompleted(status);
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
  succeeded: number;
  failed: number;
} => {
  const taskIds = Object.keys(state.creations);
  let ready = 0;
  let pending = 0;
  let succeeded = 0;
  let failed = 0;

  for (const taskId of taskIds) {
    const status = deriveTaskStatus(state, taskId);
    switch (status.type) {
      case "ready":
        ready++;
        break;
      case "pending":
        pending++;
        break;
      case "succeeded":
        succeeded++;
        break;
      case "failed":
        failed++;
        break;
    }
  }

  return {
    total: taskIds.length,
    ready,
    pending,
    succeeded,
    failed,
  };
};
