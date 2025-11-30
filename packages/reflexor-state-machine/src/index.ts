// ============================================================================
// Reflexor State Machine 导出
// ============================================================================

/**
 * Reflexor State Machine
 *
 * 提供前后端共享的状态机定义，包括：
 * - ReflexorState: 状态类型
 * - ReflexorInput: 输入信号类型
 * - initial: 初始状态函数
 * - transition: 状态转换函数
 */

// ============================================================================
// 导出所有类型
// ============================================================================

// State 相关类型
export type {
  UserMessage,
  AssistantMessage,
  ReflexorMessage,
  ToolCallRequest,
  ToolCallSuccess,
  ToolCallFailed,
  ToolCallResult,
  ToolCallRecord,
  ContextCompress,
  ContextLoadHistory,
  ContextLoadToolResults,
  ContextRefinement,
  ReflexorState,
} from "./state";

// State 相关 Schemas
export {
  userMessageSchema,
  assistantMessageSchema,
  reflexorMessageSchema,
  toolCallRequestSchema,
  toolCallSuccessSchema,
  toolCallFailedSchema,
  toolCallResultSchema,
  toolCallRecordSchema,
  contextCompressSchema,
  contextLoadHistorySchema,
  contextLoadToolResultsSchema,
  contextRefinementSchema,
  reflexorStateSchema,
} from "./state";

// State 工具函数
export {
  getMergedMessages,
  getAllMessageIds,
  getLastUserMessageReceivedAt,
  getLastToolCallResultReceivedAt,
} from "./state";

// Input 相关类型
export type {
  BaseInput,
  UserSendMessage,
  UserTakeAction,
  BrainRefineContext,
  BrainCallTools,
  BrainSendMessageStart,
  BrainSendMessageComplete,
  ToolkitRespond,
  ToolkitError,
  ReflexorInput,
} from "./input";

// Input 相关 Schemas
export {
  baseInputSchema,
  userSendMessageSchema,
  userTakeActionSchema,
  brainRefineContextSchema,
  brainCallToolsSchema,
  brainSendMessageStartSchema,
  brainSendMessageCompleteSchema,
  toolkitRespondSchema,
  toolkitErrorSchema,
  reflexorInputSchema,
} from "./input";

// ============================================================================
// 导出 State Machine 函数
// ============================================================================

export { initializeReflexorState, createReflexorInitial } from "./initial";
export { createReflexorTransition } from "./transition";
