/**
 * LLM Reaction 模块导出
 */

// ============================================================================
// Reaction 导出
// ============================================================================

export { createLlmReaction } from "./reaction";
export type { LlmReactionDeps } from "./reaction";

// ============================================================================
// 伪工具类型导出
// ============================================================================

export type {
  TaskDefinition,
  CreateTasksParams,
  AppendMessageParams,
  CancelTasksParams,
  CoordinatorPseudoToolCall,
} from "./pseudo-tools";

// ============================================================================
// 伪工具常量和函数导出
// ============================================================================

export {
  WF_CREATE_TASKS,
  WF_APPEND_MESSAGE,
  WF_CANCEL_TASKS,
  WF_QUERY_TASKS,
  coordinatorPseudoToolInfos,
  isCoordinatorPseudoTool,
  parseCoordinatorPseudoToolCall,
} from "./pseudo-tools";
