/**
 * @moora/workforce
 *
 * Workforce management for agent task scheduling and coordination
 */

// ============================================================================
// 核心类型导出
// ============================================================================
export type {
  // Task 类型
  TaskId,
  MessageId,
  TaskStatus,
  TaskSuccessResult,
  TaskFailureResult,
  TaskResult,
  TaskInput,
  TaskRuntimeData,
  TaskRuntimeStatus,
  Task,
  // Task 事件类型
  TaskCreatedEvent,
  TaskStartedEvent,
  TaskMessageAppendedEvent,
  TaskCancelledEvent,
  TaskSucceededEvent,
  TaskFailedEvent,
  TaskEvent,
  // Task 详情事件类型
  TaskDetailUserMessageEvent,
  TaskDetailStreamChunkEvent,
  TaskDetailStreamCompleteEvent,
  TaskDetailToolCallRequestEvent,
  TaskDetailToolCallResponseEvent,
  TaskDetailEvent,
  // 事件处理器类型
  TaskEventHandler,
  TaskDetailEventHandler,
  SubscribeTaskEvent,
  SubscribeTaskDetailEvent,
  // Workforce 类型
  WorkforceConfig,
  CreateTaskInput,
  AppendMessageInput,
  Workforce,
} from "./types";

export { ROOT_TASK_ID } from "./types";

// ============================================================================
// 伪工具类型导出
// ============================================================================
export type {
  TaskSucceedParams,
  TaskFailParams,
  SubtaskDefinition,
  TaskBreakdownParams,
  PseudoToolCall,
} from "./impl";

export {
  WF_TASK_SUCCEED,
  WF_TASK_FAIL,
  WF_TASK_BREAKDOWN,
  isPseudoTool,
  parsePseudoToolCall,
  pseudoToolInfos,
} from "./impl";

// ============================================================================
// Zod Schemas 导出
// ============================================================================
export {
  taskSucceedParamsSchema,
  taskFailParamsSchema,
  subtaskDefinitionSchema,
  taskBreakdownParamsSchema,
  taskSucceedJsonSchema,
  taskFailJsonSchema,
  taskBreakdownJsonSchema,
} from "./impl";

// ============================================================================
// 核心工厂函数导出
// ============================================================================
export { createWorkforce } from "./impl";
