/**
 * @moora/task-manager
 *
 * 基于 automata 的纯任务管理器
 *
 * @packageDocumentation
 */

// ============================================================================
// 导出常量
// ============================================================================
export { ROOT_TASK_ID } from "./types";

// ============================================================================
// 导出类型
// ============================================================================
export type {
  // Task Creation
  TaskCreation,
  // Appended Info
  AppendedInfo,
  // Completion
  Completion,
  CompletionSuccess,
  CompletionFailure,
  // Task Status (推导的)
  TaskStatus,
  TaskStatusReady,
  TaskStatusPending,
  TaskStatusSucceeded,
  TaskStatusFailed,
  // Task Info (查询结果)
  TaskInfo,
  // State
  TaskManagerState,
  // Input
  Input,
  InputCreate,
  InputCancel,
  InputAppend,
  InputComplete,
  InputFail,
} from "./types";

export type { TaskManager } from "./create";

// ============================================================================
// 导出辅助函数
// ============================================================================
export { isCompleted, isActive } from "./queries";

// ============================================================================
// 导出 Automata
// ============================================================================
export { initial, transition, taskManagerMachine } from "./automata";

// ============================================================================
// 导出查询函数
// ============================================================================
export {
  deriveTaskStatus,
  getTopLevelTaskIds,
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

// ============================================================================
// 导出工厂函数
// ============================================================================
export { createTaskManager } from "./create";
