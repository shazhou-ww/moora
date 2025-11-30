// ============================================================================
// Agent Moorex Effects At - 计算 Effects
// ============================================================================

import type { AgentState } from "@moora/agent-core-state-machine";
import type { AgentEffect } from "../types";

/**
 * 从 AgentState 计算当前状态下关心的副作用集
 * 
 * @param state - Agent 状态
 * @returns Effects Record，key 作为 Effect 的标识用于 reconciliation
 * 
 * @example
 * ```typescript
 * const state: AgentState = {
 *   messages: [{ id: 'msg-1', ... }],
 *   tools: {},
 *   toolCalls: {},
 *   reactContext: { 
 *     contextWindowSize: 10, 
 *     toolCallIds: [],
 *     updatedAt: 1234567890,
 *     startedAt: 1234567890,
 *   },
 * };
 * 
 * const effects = agentEffectsAt(state);
 * // { 'call-llm-1234567890': { type: 'call-llm', contextUpdatedAt: 1234567890 } }
 * ```
 */
export const agentEffectsAt = (
  state: AgentState
): Record<string, AgentEffect> => {
  const effects: Record<string, AgentEffect> = {};

  // 如果没有 reactContext，说明当前没有需要处理的 react-loop
  if (!state.reactContext) {
    return effects;
  }

  const { reactContext } = state;

  // 获取上下文窗口内的消息（最新的 N 条消息）
  const contextMessages = state.messages.slice(
    -reactContext.contextWindowSize
  );

  // 找到最新的用户消息
  const contextUserMessages = contextMessages.filter(
    (msg) => msg.role === "user"
  );

  if (contextUserMessages.length > 0) {
    // 获取最新的用户消息
    const lastUserMessage =
      contextUserMessages[contextUserMessages.length - 1];

    if (lastUserMessage) {
      // 检查是否已经有对应的助手消息（在上下文窗口中）
      const hasAssistantResponse = contextMessages.some(
        (msg) => msg.role === "assistant"
      );

      // 如果还没有助手响应，需要调用 LLM
      if (!hasAssistantResponse) {
        const key = `call-llm-${reactContext.updatedAt}`;

        effects[key] = {
          type: "call-llm",
          contextUpdatedAt: reactContext.updatedAt,
        };
      }
    }
  }

  // 根据 reactContext.toolCallIds 生成 Tool 调用 Effects
  // 只处理那些还没有完成的 Tool Calls（在 toolCalls 中不存在或 result 为 null）
  for (const toolCallId of reactContext.toolCallIds) {
    const toolCall = state.toolCalls[toolCallId];
    
    // 如果 Tool Call 不存在或未完成（result 为 null），需要调用
    if (!toolCall || toolCall.result === null) {
      const key = `call-tool-${toolCallId}`;

      effects[key] = {
        type: "call-tool",
        toolCallId,
      };
    }
  }

  return effects;
};

