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
export { USER, LLM, type Actors } from "./actors";

// ============================================================================
// Observations
// ============================================================================
export type {
  UserObLlm,
  UserObUser,
  LlmObLlm,
  LlmObUser,
} from "./observations";
export {
  userObLlmSchema,
  userObUserSchema,
  llmObLlmSchema,
  llmObUserSchema,
} from "./observations";

// ============================================================================
// Appearances
// ============================================================================
export type { AppearanceOfUser, AppearanceOfLlm } from "./appearances";
export { appearanceOfUserSchema, appearanceOfLlmSchema } from "./appearances";

// ============================================================================
// Perspectives
// ============================================================================
export type { PerspectiveOfUser, PerspectiveOfLlm } from "./perspectives";
export { perspectiveOfUserSchema, perspectiveOfLlmSchema } from "./perspectives";

// ============================================================================
// Actions
// ============================================================================
export type {
  SendUserMessage,
  StartAssiMessageStream,
  EndAssiMessageStream,
  ActionFromUser,
  ActionFromLlm,
} from "./actions";
export {
  sendUserMessageSchema,
  startAssiMessageStreamSchema,
  endAssiMessageStreamSchema,
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
  NotifyUser,
  LlmReactionOptions,
  UserReactionOptions,
} from "./reactions";
