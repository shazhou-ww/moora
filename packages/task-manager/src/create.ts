/**
 * Task Manager 工厂函数
 *
 * 创建一个可操作的 Task Manager 实例
 */

import type { Unsubscribe } from "@moora/automata";
import { createPubSub } from "@moora/automata";

import { initial, transition } from "./automata";
import {
  getNextTask,
  getTaskInfo,
  getAllTaskIds,
  getActiveTasks,
  getCompletedTasks,
  getTopLevelTasks,
  getChildTasks,
  isAllCompleted,
  getTaskStats,
} from "./queries";
import type { Actuation, TaskInfo, TaskManagerState } from "./types";

// ============================================================================
// Task Manager 类型
// ============================================================================

/**
 * Task Manager 实例类型
 */
export type TaskManager = {
  dispatch: (actuation: Actuation) => void;
  subscribe: (handler: (state: TaskManagerState) => void) => Unsubscribe;
  current: () => TaskManagerState;
  // 查询方法
  getNextTask: () => TaskInfo | null;
  getTaskInfo: (taskId: string) => TaskInfo | null;
  getAllTaskIds: () => string[];
  getActiveTasks: () => TaskInfo[];
  getCompletedTasks: () => TaskInfo[];
  getTopLevelTasks: () => TaskInfo[];
  getChildTasks: (taskId: string) => TaskInfo[];
  isAllCompleted: () => boolean;
  getTaskStats: () => ReturnType<typeof getTaskStats>;
};

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建 Task Manager 实例
 *
 * 使用同步的状态更新，适合需要立即读取状态的场景
 */
export const createTaskManager = (): TaskManager => {
  let state = initial();
  const pubsub = createPubSub<TaskManagerState>();

  const dispatch = (actuation: Actuation): void => {
    state = transition(actuation)(state);
    pubsub.pub(state);
  };

  const subscribe = (handler: (s: TaskManagerState) => void): Unsubscribe => {
    return pubsub.sub(handler);
  };

  const current = (): TaskManagerState => state;

  return {
    dispatch,
    subscribe,
    current,
    // 查询方法，绑定到当前状态
    getNextTask: () => getNextTask(current()),
    getTaskInfo: (taskId: string) => getTaskInfo(current(), taskId),
    getAllTaskIds: () => getAllTaskIds(current()),
    getActiveTasks: () => getActiveTasks(current()),
    getCompletedTasks: () => getCompletedTasks(current()),
    getTopLevelTasks: () => getTopLevelTasks(current()),
    getChildTasks: (taskId: string) => getChildTasks(current(), taskId),
    isAllCompleted: () => isAllCompleted(current()),
    getTaskStats: () => getTaskStats(current()),
  };
};
