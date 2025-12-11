/**
 * @moora/agent-starter
 *
 * 最小 Agent 实现，基于 Automata 和迭代式建模方法论
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
  PerspectiveOfUser,
  PerspectiveOfLlm,
  ActionFromUser,
  ActionFromLlm,
  SendUserMessage,
  StartAssiMessageStream,
  EndAssiMessageStream,
  // Reaction types
  NotifyUser,
  LlmReactionOptions,
  UserReactionOptions,
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
} from "./impl/reactions";
