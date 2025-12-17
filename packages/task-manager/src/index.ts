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
  // Appended Message
  AppendedMessage,
  // Task Status
  TaskStatus,
  // Task Result
  TaskResult,
  TaskResultSuccess,
  TaskResultFailure,
  TaskResultSuspended,
  TaskResultCancelled,
  // Task Info (查询结果)
  TaskInfo,
  // State
  TaskManagerState,
  // Input
  TaskManagerInput,
  TaskManagerInputTaskCreated,
  TaskManagerInputTaskStarted,
  TaskManagerInputTaskCompleted,
  TaskManagerInputTaskFailed,
  TaskManagerInputTaskSuspended,
  TaskManagerInputTaskCancelled,
  TaskManagerInputMessageAppended,
} from "./types";

export type { TaskManager } from "./create";

// ============================================================================
// 导出辅助函数
// ============================================================================
export { isTerminalStatus, isActiveStatus } from "./queries";

// ============================================================================
// 导出 Automata
// ============================================================================
export { initial, transition, taskManagerMachine } from "./automata";

// ============================================================================
// 导出查询函数
// ============================================================================
export {
  getTopLevelTaskIds,
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

// ============================================================================
// 导出工厂函数
// ============================================================================
export { createTaskManager } from "./create";
