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
  getTerminalTasks,
  getReadyTasks,
  getRunningTasks,
  getTopLevelTasks,
  getChildTasks,
  isAllTerminal,
  getTaskStats,
  getAppendedMessages,
} from "./queries";
import type { TaskManagerInput, TaskInfo, TaskManagerState } from "./types";

// ============================================================================
// Task Manager 类型
// ============================================================================

/**
 * Task Manager 实例类型
 */
export type TaskManager = {
  /** 派发输入事件 */
  dispatch: (input: TaskManagerInput) => void;
  /** 订阅状态变化 */
  subscribe: (handler: (state: TaskManagerState) => void) => Unsubscribe;
  /** 获取当前状态 */
  current: () => TaskManagerState;
  // 查询方法
  /** 获取下一个可执行的任务 */
  getNextTask: () => TaskInfo | null;
  /** 获取指定任务信息 */
  getTaskInfo: (taskId: string) => TaskInfo | null;
  /** 获取所有任务 ID */
  getAllTaskIds: () => string[];
  /** 获取所有活跃任务 */
  getActiveTasks: () => TaskInfo[];
  /** 获取所有终结任务 */
  getTerminalTasks: () => TaskInfo[];
  /** 获取所有就绪任务 */
  getReadyTasks: () => TaskInfo[];
  /** 获取所有运行中任务 */
  getRunningTasks: () => TaskInfo[];
  /** 获取顶层任务 */
  getTopLevelTasks: () => TaskInfo[];
  /** 获取子任务 */
  getChildTasks: (taskId: string) => TaskInfo[];
  /** 检查是否所有任务都已终结 */
  isAllTerminal: () => boolean;
  /** 获取任务统计 */
  getTaskStats: () => ReturnType<typeof getTaskStats>;
  /** 获取任务的追加消息 */
  getAppendedMessages: (taskId: string) => string[];
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

  const dispatch = (input: TaskManagerInput): void => {
    state = transition(input)(state);
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
    getTerminalTasks: () => getTerminalTasks(current()),
    getReadyTasks: () => getReadyTasks(current()),
    getRunningTasks: () => getRunningTasks(current()),
    getTopLevelTasks: () => getTopLevelTasks(current()),
    getChildTasks: (taskId: string) => getChildTasks(current(), taskId),
    isAllTerminal: () => isAllTerminal(current()),
    getTaskStats: () => getTaskStats(current()),
    getAppendedMessages: (taskId: string) =>
      getAppendedMessages(current(), taskId),
  };
};
