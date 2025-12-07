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
  EffectFns,
  PartialEffectFns,
  Actors,
  StateOfUser,
  StateOfLlm,
  ContextOfUser,
  ContextOfLlm,
  ContextOfToolkit,
  InputFromUser,
  InputFromLlm,
  InputFromToolkit,
  SendUserMessage,
  StartAssiMessageStream,
  EndAssiMessageStream,
  RequestToolCall,
  ReceiveToolResult,
  ToolCallRequest,
  ToolResult,
  ToolCallRequests,
  ToolResults,
  UserMessage,
  AssiMessage,
  BaseMessage,
} from "./decl";

// 导出 Agent 更新相关类型
export type { AgentUpdatePack } from "./impl/agent/create";

// ============================================================================
// 导出函数
// ============================================================================
export { createAgent } from "./impl/agent";
