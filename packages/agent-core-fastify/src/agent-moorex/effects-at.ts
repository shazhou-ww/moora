// ============================================================================
// Agent Moorex Effects At - 计算 Effects
// ============================================================================

import type { AgentState } from "@moora/agent-core-state-machine";
import type { AgentEffect } from "../types";

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
 * call-llm effect 有效的条件：
 * 1. 当前有 ReActContext（已在 agentEffectsAt 中检查）
 * 2. 在当前 ReActContext 中，所有关注的 tool-call 都已经返回了
 * 3. 存在尚未发送给 LLM 的 user message 或 tool-call result
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
  // 检查条件 2: 所有关注的 tool-call 都已经返回了
  if (!areAllToolCallsCompleted(state, reActContext)) {
    return {};
  }

  // 检查条件 3: 存在尚未发送给 LLM 的 user message 或 tool-call result
  if (!hasPendingSignal(state)) {
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

/**
 * 检查当前 ReActContext 中所有关注的 tool-call 是否都已经返回了
 *
 * @internal
 * @param state - Agent 状态
 * @param reActContext - 当前 re-act 上下文
 * @returns 如果所有 tool-call 都有结果，返回 true
 */
const areAllToolCallsCompleted = (
  state: AgentState,
  reActContext: ReActContext
): boolean => {
  for (const toolCallId of reActContext.toolCallIds) {
    const toolCall = state.toolCalls[toolCallId];

    // 如果 tool call 不存在或者没有结果，则说明还有未完成的
    if (!toolCall || toolCall.result === null) {
      return false;
    }
  }

  return true;
};

/**
 * 判断是否存在尚未发送给 LLM 的 user message 或 tool-call result
 *
 * @internal
 * @param state - Agent 状态
 * @returns 如果存在新信号，返回 true
 */
const hasPendingSignal = (state: AgentState): boolean => {
  if (state.lastUserMessageReceivedAt > state.calledLlmAt) {
    return true;
  }

  return state.lastToolCallResultReceivedAt > state.calledLlmAt;
};

