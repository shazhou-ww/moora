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
  ToolCallRecord,
  ReactContext,
  AgentState,
} from "./state";

export {
  toolDefinitionSchema,
  toolCallSuccessSchema,
  toolCallFailedSchema,
  toolCallResultSchema,
  toolCallRecordSchema,
  reactContextSchema,
  agentStateSchema,
} from "./state";

// Input 相关类型
export type {
  UserMessageReceived,
  LlmMessageStarted,
  LlmMessageCompleted,
  ToolCallStarted,
  ToolCallCompleted,
  ContextWindowExpanded,
  HistoryToolCallsAdded,
  AgentInput,
} from "./input";

export {
  userMessageReceivedSchema,
  llmMessageStartedSchema,
  llmMessageCompletedSchema,
  toolCallStartedSchema,
  toolCallCompletedSchema,
  contextWindowExpandedSchema,
  historyToolCallsAddedSchema,
  agentInputSchema,
} from "./input";

// ============================================================================
// 导出 State Machine 函数
// ============================================================================

export { initialAgentState } from "./initial";
export { createAgentTransition } from "./transition";
export type { AgentTransitionOptions } from "./transition";
