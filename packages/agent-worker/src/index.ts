/**
 * @moora/agent-worker
 *
 * 完整的 Agent 实现，基于 Automata 和迭代式建模方法论
 */

// ============================================================================
// Agent 核心类型
// ============================================================================
export type {
  Agent,
  AgentUpdatePack,
  Worldscape,
  Actuation,
  ReactionFns,
  AgentReaction,
} from "./decl";

// ============================================================================
// Actors 类型
// ============================================================================
export type {
  Actors,
  AppearanceOfUser,
  AppearanceOfLlm,
  AppearanceOfToolkit,
  PerspectiveOfUser,
  PerspectiveOfLlm,
  PerspectiveOfToolkit,
  ActionFromUser,
  ActionFromLlm,
  ActionFromToolkit,
  SendUserMessage,
  StartAssiMessageStream,
  EndAssiMessageStream,
  RequestToolCall,
  ReceiveToolResult,
  ToolCallRequest,
  ToolResult,
  ToolCallRequests,
  ToolResults,
} from "./decl";

// ============================================================================
// Reaction 类型
// ============================================================================
export type {
  CallTool,
  NotifyUser,
  LlmReactionOptions,
  ToolkitReactionOptions,
  UserReactionOptions,
  ReactionOptions,
} from "./decl";

// ============================================================================
// Agent 工厂函数
// ============================================================================
export { createAgent } from "./impl/agent";

// createReaction - 将 ReactionFns 组合为 AgentReaction
export { createReaction } from "./impl/agent/reaction";

// ============================================================================
// Reaction 工厂函数
// ============================================================================
export {
  createUserReaction,
  createLlmReaction,
  createToolkitReaction,
} from "./impl/reactions";
