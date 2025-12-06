/**
 * @moora/agent
 *
 * 完整的 Agent 实现，基于 Automata 和迭代式建模方法论
 */

import type { AgentState, AgentInput } from "./decl/agent";

// ============================================================================
// 导出类型
// ============================================================================
export type {
  AgentState,
  AgentInput,
  Output,
  OutputFns,
  Actors,
  StateOfUser,
  StateOfLlm,
  ContextOfUser,
  ContextOfLlm,
  InputFromUser,
  InputFromLlm,
  SendUserMessage,
  StartAssiMessageStream,
  EndAssiMessageStream,
  UserMessage,
  AssiMessage,
  BaseMessage,
} from "./decl";

// ============================================================================
// 导出函数
// ============================================================================
export { createAgent } from "./impl/agent";
