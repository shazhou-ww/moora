/**
 * Task Manager Automata
 *
 * 基于 @moora/automata 的纯状态机实现
 */

import type {
  Input,
  InputCreate,
  InputCancel,
  InputAppend,
  InputComplete,
  InputFail,
  TaskManagerState,
  Completion,
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
  appendedInfos: [],
  completions: {},
  children: {
    [ROOT_TASK_ID]: [],
  },
});

// ============================================================================
// 内部辅助函数
// ============================================================================

/**
 * 获取任务的所有子任务 ID
 */
const getChildIds = (
  state: TaskManagerState,
  taskId: string
): string[] => {
  return state.children[taskId] ?? [];
};

/**
 * 递归取消任务及其所有子任务
 */
const cancelTaskRecursively = (
  state: TaskManagerState,
  taskId: string,
  error: string
): TaskManagerState => {
  // 如果任务不存在或已完成，跳过
  if (!state.creations[taskId] || state.completions[taskId]) {
    return state;
  }

  let newState = { ...state };
  const childIds = getChildIds(state, taskId);

  // 先递归取消所有子任务
  for (const childId of childIds) {
    newState = cancelTaskRecursively(newState, childId, error);
  }

  // 然后取消当前任务
  const completion: Completion = { isSuccess: false, error };
  newState = {
    ...newState,
    completions: {
      ...newState.completions,
      [taskId]: completion,
    },
  };

  return newState;
};

// ============================================================================
// 各个 Input 的处理函数
// ============================================================================

/**
 * 处理 create 输入
 */
const handleCreate = (
  state: TaskManagerState,
  input: InputCreate
): TaskManagerState => {
  const { id, title, goal, parentId, timestamp } = input;

  // 创建任务信息
  const creation = { id, title, goal, parentId, createdAt: timestamp };

  // 更新 children 缓存
  const parentChildren = state.children[parentId] ?? [];

  return {
    ...state,
    creations: {
      ...state.creations,
      [id]: creation,
    },
    children: {
      ...state.children,
      [parentId]: [...parentChildren, id],
      [id]: [], // 新任务没有子任务
    },
  };
};

/**
 * 处理 cancel 输入
 */
const handleCancel = (
  state: TaskManagerState,
  input: InputCancel
): TaskManagerState => {
  const { taskId, error } = input;
  return cancelTaskRecursively(state, taskId, error);
};

/**
 * 处理 append 输入
 */
const handleAppend = (
  state: TaskManagerState,
  input: InputAppend
): TaskManagerState => {
  const { taskIds, info } = input;

  // 仅处理存在的任务，忽略无效 taskIds
  const validTaskIds = taskIds.filter((taskId) => state.creations[taskId]);
  if (validTaskIds.length === 0) {
    return state;
  }

  const appendedInfos = validTaskIds.map((taskId) => ({ taskId, info }));

  return {
    ...state,
    appendedInfos: [...state.appendedInfos, ...appendedInfos],
  };
};

/**
 * 处理 complete 输入
 */
const handleComplete = (
  state: TaskManagerState,
  input: InputComplete
): TaskManagerState => {
  const { taskId, result } = input;

  // 检查任务是否存在
  if (!state.creations[taskId]) {
    return state;
  }

  const completion: Completion = { isSuccess: true, result };

  return {
    ...state,
    completions: {
      ...state.completions,
      [taskId]: completion,
    },
  };
};

/**
 * 处理 fail 输入
 */
const handleFail = (
  state: TaskManagerState,
  input: InputFail
): TaskManagerState => {
  const { taskId, error } = input;

  // 检查任务是否存在
  if (!state.creations[taskId]) {
    return state;
  }

  const completion: Completion = { isSuccess: false, error };

  return {
    ...state,
    completions: {
      ...state.completions,
      [taskId]: completion,
    },
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
  (input: Input) =>
  (state: TaskManagerState): TaskManagerState => {
    switch (input.type) {
      case "create":
        return handleCreate(state, input);
      case "cancel":
        return handleCancel(state, input);
      case "append":
        return handleAppend(state, input);
      case "complete":
        return handleComplete(state, input);
      case "fail":
        return handleFail(state, input);
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
