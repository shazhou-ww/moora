// ============================================================================
// Agent Moorex Effects At - 计算 Effects
// ============================================================================

import type { AgentState } from "@moora/agent-core-state-machine";
import type { AgentEffect } from "../types";
import { hasPendingUserMessage } from "./message-selectors";

/**
 * @internal
 */
type ReActContext = NonNullable<AgentState["reActContext"]>;

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
 *   reActContext: { 
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
  if (!state.reActContext) {
    return {};
  }

  const callLlmEffects = createCallLlmEffects(state, state.reActContext);
  const callToolEffects = createCallToolEffects(state, state.reActContext);

  return {
    ...callLlmEffects,
    ...callToolEffects,
  };
};

// ============================================================================
// 内部工具函数
// ============================================================================

/**
 * 计算需要触发的 call-llm 副作用
 *
 * @internal
 * @param state - Agent 状态
 * @param reActContext - 当前 re-act 上下文
 * @returns call-llm Effects
 */
const createCallLlmEffects = (
  state: AgentState,
  reActContext: ReActContext
): Record<string, AgentEffect> => {
  if (!hasPendingUserMessage(state.messages)) {
    return {};
  }

  const key = `call-llm-${reActContext.updatedAt}`;

  return {
    [key]: {
      type: "call-llm",
      contextUpdatedAt: reActContext.updatedAt,
    },
  };
};

/**
 * 计算需要触发的 call-tool 副作用
 *
 * @internal
 * @param state - Agent 状态
 * @param reActContext - 当前 re-act 上下文
 * @returns call-tool Effects
 */
const createCallToolEffects = (
  state: AgentState,
  reActContext: ReActContext
): Record<string, AgentEffect> => {
  const effects: Record<string, AgentEffect> = {};

  for (const toolCallId of reActContext.toolCallIds) {
    const toolCall = state.toolCalls[toolCallId];

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

