/**
 * Task Manager 查询函数
 *
 * 提供对 TaskManagerState 的只读查询
 */

import type { Task, TaskInfo, TaskManagerState } from "./types";
import { isActive, isCompleted } from "./types";

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 将内部 Task 转换为对外的 TaskInfo
 */
const toTaskInfo = (task: Task): TaskInfo => ({
  id: task.id,
  title: task.title,
  goal: task.goal,
  parentId: task.parentId,
  dependencies: task.dependencies,
  childIds: task.childIds,
  appendedInfos: task.appendedInfos,
  status: task.status,
});

/**
 * 检查任务是否可以被执行（ready 且没有未完成的子任务）
 */
const isExecutable = (task: Task, tasks: Record<string, Task>): boolean => {
  // 任务必须是 ready 状态
  if (task.status.type !== "ready") return false;

  // 如果有子任务，所有子任务必须已完成
  if (task.childIds.length > 0) {
    const allChildrenCompleted = task.childIds.every((childId) => {
      const child = tasks[childId];
      return child && isCompleted(child.status);
    });
    if (!allChildrenCompleted) return false;
  }

  return true;
};

/**
 * 深度优先搜索获取下一个可执行的任务
 *
 * 优先执行子任务，然后是父任务
 */
const findNextExecutableTask = (
  taskId: string,
  tasks: Record<string, Task>
): Task | null => {
  const task = tasks[taskId];
  if (!task) return null;

  // 如果任务已完成，跳过
  if (isCompleted(task.status)) return null;

  // 如果有子任务，先检查子任务
  for (const childId of task.childIds) {
    const childResult = findNextExecutableTask(childId, tasks);
    if (childResult) return childResult;
  }

  // 检查当前任务是否可执行
  if (isExecutable(task, tasks)) return task;

  return null;
};

// ============================================================================
// 查询函数
// ============================================================================

/**
 * 获取下一个需要执行的任务
 *
 * 按照创建顺序遍历顶层任务，深度优先搜索找到第一个可执行的任务
 */
export const getNextTask = (state: TaskManagerState): TaskInfo | null => {
  for (const topLevelId of state.topLevelTaskIds) {
    const result = findNextExecutableTask(topLevelId, state.tasks);
    if (result) return toTaskInfo(result);
  }
  return null;
};

/**
 * 获取特定任务的详细信息
 */
export const getTaskInfo = (
  state: TaskManagerState,
  taskId: string
): TaskInfo | null => {
  const task = state.tasks[taskId];
  if (!task) return null;
  return toTaskInfo(task);
};

/**
 * 获取所有任务 ID
 */
export const getAllTaskIds = (state: TaskManagerState): string[] => {
  return Object.keys(state.tasks);
};

/**
 * 获取所有活跃（未完成）的任务
 */
export const getActiveTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.values(state.tasks)
    .filter((task) => isActive(task.status))
    .map(toTaskInfo);
};

/**
 * 获取所有已完成的任务
 */
export const getCompletedTasks = (state: TaskManagerState): TaskInfo[] => {
  return Object.values(state.tasks)
    .filter((task) => isCompleted(task.status))
    .map(toTaskInfo);
};

/**
 * 获取顶层任务
 */
export const getTopLevelTasks = (state: TaskManagerState): TaskInfo[] => {
  return state.topLevelTaskIds
    .map((id) => state.tasks[id])
    .filter((task): task is Task => task !== undefined)
    .map(toTaskInfo);
};

/**
 * 获取特定任务的子任务
 */
export const getChildTasks = (
  state: TaskManagerState,
  taskId: string
): TaskInfo[] => {
  const task = state.tasks[taskId];
  if (!task) return [];

  return task.childIds
    .map((id) => state.tasks[id])
    .filter((t): t is Task => t !== undefined)
    .map(toTaskInfo);
};

/**
 * 检查是否所有任务都已完成
 */
export const isAllCompleted = (state: TaskManagerState): boolean => {
  return Object.values(state.tasks).every((task) => isCompleted(task.status));
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
  const tasks = Object.values(state.tasks);
  return {
    total: tasks.length,
    ready: tasks.filter((t) => t.status.type === "ready").length,
    pending: tasks.filter((t) => t.status.type === "pending").length,
    succeeded: tasks.filter((t) => t.status.type === "succeeded").length,
    failed: tasks.filter((t) => t.status.type === "failed").length,
  };
};
