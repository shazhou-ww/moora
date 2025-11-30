// ============================================================================
// Agent Core State Machine 导出
// ============================================================================

/**
 * Agent Core State Machine
 *
 * 提供 Agent 的状态机定义，包括：
 * - Agent State: 内部状态类型
 * - Agent Input: 状态机输入信号类型
 * - Agent State Machine: 状态机实现
 */

// ============================================================================
// 导出所有类型
// ============================================================================

// State 相关类型
export type {
  ToolDefinition,
  ToolCallSuccess,
  ToolCallFailed,
  ToolCallResult,
  ToolCallRequest,
  ToolCallRecord,
  ReActContext,
  AgentState,
} from "./state";

export {
  toolDefinitionSchema,
  toolCallSuccessSchema,
  toolCallFailedSchema,
  toolCallResultSchema,
  toolCallRequestSchema,
  toolCallRecordSchema,
  reActContextSchema,
  agentStateSchema,
} from "./state";

// Input 相关类型
export type {
  BaseAgentInput,
  UserMessageReceived,
  LlmMessageStarted,
  LlmMessageCompleted,
  ToolCallCompleted,
  ReActObservation,
  ReActObserved,
  ContextWindowExpanded,
  HistoryToolCallsAdded,
  AgentInput,
} from "./input";

export {
  baseAgentInputSchema,
  userMessageReceivedSchema,
  llmMessageStartedSchema,
  llmMessageCompletedSchema,
  toolCallCompletedSchema,
  reActObservationSchema,
  reActObservedSchema,
  contextWindowExpandedSchema,
  historyToolCallsAddedSchema,
  agentInputSchema,
} from "./input";

// ============================================================================
// 导出 State Machine 函数
// ============================================================================

export { initializeAgentState, createAgentInitial } from "./initial";
export { createAgentTransition } from "./transition";
export type { AgentTransitionOptions } from "./transition";
