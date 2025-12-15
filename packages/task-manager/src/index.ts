/**
 * @moora/task-manager
 *
 * 基于 automata 的纯任务管理器
 *
 * @packageDocumentation
 */

// ============================================================================
// 导出类型
// ============================================================================
export type {
  // Task Status
  TaskStatus,
  TaskStatusReady,
  TaskStatusPending,
  TaskStatusSucceeded,
  TaskStatusFailed,
  // Task
  Task,
  TaskInfo,
  TaskDefinition,
  SubTaskDefinition,
  // State
  TaskManagerState,
  // Actuations
  Actuation,
  ActuationSchedule,
  ActuationCancel,
  ActuationAppendInfo,
  ActuationBreakDown,
  ActuationComplete,
  ActuationFail,
} from "./types";

export type { TaskManager } from "./create";

// ============================================================================
// 导出辅助函数
// ============================================================================
export { isCompleted, isActive } from "./types";

// ============================================================================
// 导出 Automata
// ============================================================================
export { initial, transition, taskManagerMachine } from "./automata";

// ============================================================================
// 导出查询函数
// ============================================================================
export {
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
