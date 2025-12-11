/**
 * @moora/agent-worker
 *
 * 完整的 Agent 实现，基于 Automata 和迭代式建模方法论
 */

import type { Worldscape, Actuation } from "./decl/agent";

// ============================================================================
// 导出类型
// ============================================================================
export type {
  Worldscape,
  Actuation,
  ReactionFns,
  AgentReaction,
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
  // Reaction types
  CallTool,
  NotifyUser,
  LlmReactionOptions,
  ToolkitReactionOptions,
  UserReactionOptions,
  ReactionOptions,
} from "./decl";

// 导出 Agent 更新相关类型
export type { AgentUpdatePack } from "./impl/agent/create";

// ============================================================================
// 导出函数
// ============================================================================
export { createAgent } from "./impl/agent";

// createReaction - 将 ReactionFns 组合为 AgentReaction
export { createReaction } from "./impl/agent/reaction";

// Reaction factory functions
export {
  createUserReaction,
  createLlmReaction,
  createToolkitReaction,
} from "./impl/reactions";
