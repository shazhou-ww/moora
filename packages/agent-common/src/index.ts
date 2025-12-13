/**
 * @moora/agent-common
 *
 * 公共类型和 schema，供 agent-starter 和 agent-worker 复用
 */

// ============================================================================
// Message Types
// ============================================================================
export type {
  BaseMessage,
  UserMessage,
  AssiMessage,
  AssiMessageStreaming,
  AssiMessageCompleted,
  UserMessages,
  AssiMessages,
} from "./messages";
export {
  baseMessageSchema,
  userMessageSchema,
  assiMessageSchema,
  assiMessageStreamingSchema,
  assiMessageCompletedSchema,
} from "./messages";

// ============================================================================
// CallLlm Types
// ============================================================================
export type {
  CallLlmMessage,
  CallLlmScenario,
  CallLlmToolDefinition,
  CallLlmToolCall,
  CallLlmToolChoice,
  CallLlmContext,
  CallLlmCallbacks,
  CallLlm,
} from "./call-llm";
