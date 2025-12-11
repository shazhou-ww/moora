/**
 * 类型声明综合导出
 */

// ============================================================================
// Common types from @moora/agent-common (re-export for convenience)
// ============================================================================
export type {
  BaseMessage,
  UserMessage,
  AssiMessage,
  AssiMessageStreaming,
  AssiMessageCompleted,
  UserMessages,
  AssiMessages,
  CallLlmMessage,
  CallLlmScenario,
  CallLlmToolDefinition,
  CallLlmToolCall,
  CallLlmContext,
  CallLlmCallbacks,
  CallLlm,
} from "@moora/agent-common";
export {
  baseMessageSchema,
  userMessageSchema,
  assiMessageSchema,
  assiMessageStreamingSchema,
  assiMessageCompletedSchema,
} from "@moora/agent-common";

// ============================================================================
// Actors
// ============================================================================
export { USER, LLM, TOOLKIT, type Actors } from "./actors";

// ============================================================================
// Observations
// ============================================================================
export type {
  ToolCallRequest,
  ToolResult,
  ToolCallRequests,
  ToolResults,
  UserObLlm,
  UserObUser,
  LlmObLlm,
  LlmObUser,
  LlmObToolkit,
  ToolkitObLlm,
  ToolkitObToolkit,
  UserObToolkit,
} from "./observations";
export {
  toolCallRequestSchema,
  toolResultSchema,
  userObLlmSchema,
  userObUserSchema,
  llmObLlmSchema,
  llmObUserSchema,
  llmObToolkitSchema,
  toolkitObLlmSchema,
  toolkitObToolkitSchema,
  userObToolkitSchema,
} from "./observations";

// ============================================================================
// Appearances
// ============================================================================
export type { AppearanceOfUser, AppearanceOfLlm, AppearanceOfToolkit } from "./appearances";
export { appearanceOfUserSchema, appearanceOfLlmSchema, appearanceOfToolkitSchema } from "./appearances";

// ============================================================================
// Perspectives
// ============================================================================
export type { PerspectiveOfUser, PerspectiveOfLlm, PerspectiveOfToolkit } from "./perspectives";
export { perspectiveOfUserSchema, perspectiveOfLlmSchema, perspectiveOfToolkitSchema } from "./perspectives";

// ============================================================================
// Actions
// ============================================================================
export type {
  SendUserMessage,
  StartAssiMessageStream,
  EndAssiMessageStream,
  RequestToolCall,
  ReceiveToolResult,
  ActionFromUser,
  ActionFromLlm,
  ActionFromToolkit,
} from "./actions";
export {
  sendUserMessageSchema,
  startAssiMessageStreamSchema,
  endAssiMessageStreamSchema,
  requestToolCallSchema,
  receiveToolResultSchema,
} from "./actions";

// ============================================================================
// Helpers
// ============================================================================
export type {
  AppearanceOf,
  PerspectiveOf,
  ActionFrom,
  InitialFnOf,
  TransitionFnOf,
  ReactionFnOf,
} from "./helpers";

// ============================================================================
// Agent
// ============================================================================
export type { Worldscape, Actuation, ReactionFns, AgentReaction, AgentUpdatePack, Agent } from "./agent";

// ============================================================================
// Reactions
// ============================================================================
export type {
  CallTool,
  NotifyUser,
  LlmReactionOptions,
  ToolkitReactionOptions,
  UserReactionOptions,
  ReactionOptions,
} from "./reactions";
