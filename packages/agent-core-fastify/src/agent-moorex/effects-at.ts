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
 *   phase: 'processing',
 *   currentRequestId: 'req-1',
 *   messages: [{ role: 'user', content: 'Hello', ... }],
 *   ...
 * };
 * 
 * const effects = agentEffectsAt(state);
 * // { 'effect-llm-req-1': { type: 'call-llm', ... } }
 * ```
 */
export const agentEffectsAt = (
  state: AgentState
): Record<string, AgentEffect> => {
  const effects: Record<string, AgentEffect> = {};

  // 如果处于 processing 状态且有用户消息，需要调用 LLM
  if (state.phase === "processing" && state.currentRequestId) {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((msg) => msg.role === "user" && msg.id);

    if (lastUserMessage) {
      // 检查是否已经有对应的 LLM 调用
      const existingLLMCall = state.llmHistory.find(
        (call) =>
          call.requestId === state.currentRequestId &&
          !call.response &&
          !call.error
      );

      if (!existingLLMCall) {
        // 创建新的 LLM 调用 Effect
        const callId = `llm-${Date.now()}-${Math.random()}`;
        const effectId = `effect-llm-${state.currentRequestId}`;

        // 构建消息历史（用于上下文）
        const messageHistory = state.messages
          .filter((msg) => !msg.streaming)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        effects[effectId] = {
          type: "call-llm",
          id: effectId,
          requestId: state.currentRequestId,
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

