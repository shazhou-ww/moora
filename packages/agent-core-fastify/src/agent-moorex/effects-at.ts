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
 *   reactContext: { contextWindowSize: 10, toolCallIds: [] },
 * };
 * 
 * const effects = agentEffectsAt(state);
 * // { 'effect-llm-msg-1': { type: 'call-llm', ... } }
 * ```
 */
export const agentEffectsAt = (
  state: AgentState
): Record<string, AgentEffect> => {
  const effects: Record<string, AgentEffect> = {};

  // 获取上下文窗口内的消息（最新的 N 条消息）
  const contextMessages = state.messages.slice(
    -state.reactContext.contextWindowSize
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
        const callId = `llm-${Date.now()}-${Math.random()}`;
        const effectId = `effect-llm-${lastUserMessage.id}`;

        // 构建消息历史（用于上下文）
        // 使用上下文窗口内的消息，过滤掉正在流式输出的助手消息
        const messageHistory = contextMessages
          .filter((msg) => {
            // 只过滤掉正在流式输出的助手消息
            if (msg.role === "assistant" && msg.streaming) {
              return false;
            }
            return true;
          })
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        effects[effectId] = {
          type: "call-llm",
          id: effectId,
          requestId: lastUserMessage.id,
          callId,
          prompt: lastUserMessage.content,
          messageHistory: messageHistory.length > 0 ? messageHistory : undefined,
        };
      }
    }
  }

  // TODO: 根据状态决定是否需要调用 Tool
  // 这通常需要从 LLM 响应中解析出 Tool 调用请求

  return effects;
};

