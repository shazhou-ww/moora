/**
 * CallLlm 相关类型定义
 *
 * 定义 LLM 调用的抽象接口类型，使 agent 包与具体实现解耦。
 */

import type { UserMessage, AssiMessageCompleted } from "./messages";

// ============================================================================
// CallLlm 相关类型
// ============================================================================

/**
 * LLM 调用的消息类型
 *
 * 只包含 UserMessage 和已完成的 AssiMessage（streaming = false）
 */
export type CallLlmMessage = UserMessage | AssiMessageCompleted;

/**
 * LLM 调用的场景类型
 *
 * 目前只支持 ReAct Loop 场景
 */
export type CallLlmScenario = "re-act-loop";

/**
 * LLM 工具定义
 */
export type CallLlmToolDefinition = {
  name: string;
  description: string;
  parameters: string; // JSON Schema as JSON string
};

/**
 * 已完成的工具调用记录
 */
export type CallLlmToolCall = {
  toolCallId: string; // unique identifier for the tool call
  name: string;
  parameter: string; // JSON string of arguments
  result: string; // JSON string of result
  requestedAt: number; // timestamp
  respondedAt: number; // timestamp
};

/**
 * callLlm 的 context 参数
 */
export type CallLlmContext = {
  messages: CallLlmMessage[];
  scenario: CallLlmScenario;
  tools: CallLlmToolDefinition[];
  toolCalls: CallLlmToolCall[];
};

/**
 * callLlm 的 callbacks 参数
 */
export type CallLlmCallbacks = {
  /** 开始生成消息（收到第一个 chunk 时调用），返回 messageId 用于流式管理 */
  onStart: () => string;
  /** 流式输出一个 chunk */
  onChunk: (chunk: string) => void;
  /** 消息输出完成（只有在 onStart 被调用后才应该调用） */
  onComplete: (content: string) => void;
  /** 发起工具调用请求（toolCallId 由 reaction 内部生成） */
  onToolCall: (request: { name: string; arguments: string }) => void;
};

/**
 * callLlm 函数类型
 *
 * 调用 LLM 的抽象接口，由外部实现具体的 LLM 调用逻辑。
 */
export type CallLlm = (
  context: CallLlmContext,
  callbacks: CallLlmCallbacks
) => void | Promise<void>;
