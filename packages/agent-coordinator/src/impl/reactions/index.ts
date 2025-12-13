/**
 * Reaction 统一导出
 */

export { createUserReaction } from "./user";
export type { UserReactionDeps } from "./user";

export { createLlmReaction } from "./llm";
export type { LlmReactionDeps } from "./llm";

export { createToolkitReaction } from "./toolkit";
export type { ToolkitReactionOptions } from "./toolkit";

export { createWorkforceReaction } from "./workforce";
export type { WorkforceReactionDeps } from "./workforce";

// ============================================================================
// 伪工具导出（从 llm 模块重导出）
// ============================================================================

export type {
  TaskDefinition,
  CreateTasksParams,
  AppendMessageParams,
  CancelTasksParams,
  CoordinatorPseudoToolCall,
} from "./llm";

export {
  WF_CREATE_TASKS,
  WF_APPEND_MESSAGE,
  WF_CANCEL_TASKS,
  WF_QUERY_TASKS,
  coordinatorPseudoToolInfos,
  isCoordinatorPseudoTool,
  parseCoordinatorPseudoToolCall,
} from "./llm";
