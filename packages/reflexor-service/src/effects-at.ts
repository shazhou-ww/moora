// ============================================================================
// Reflexor Effects At - 计算 Effects
// ============================================================================

import type { ReflexorState } from "@moora/reflexor-state-machine";
import {
  getLastUserMessageReceivedAt,
  getLastToolCallResultReceivedAt,
} from "@moora/reflexor-state-machine";
import type { ReflexorEffect } from "./types";

/**
 * 从 ReflexorState 计算当前状态下应该运行的副作用集
 *
 * @param state - Reflexor 状态
 * @returns Effects Record，key 作为 Effect 的标识用于 reconciliation
 *
 * @example
 * ```typescript
 * const state: ReflexorState = {
 *   userMessages: [{ kind: 'user', id: 'msg-1', ... }],
 *   assistantMessages: [],
 *   assistantMessageIndex: {},
 *   toolCallRecords: [],
 *   toolCallIndex: {},
 *   calledBrainAt: 0,
 *   isWaitingBrain: false,
 *   pendingToolCallIds: [],
 *   updatedAt: 1234567890,
 * };
 *
 * const effects = reflexorEffectsAt(state);
 * // { 'ask-brain-1234567890': { kind: 'ask-brain', signalsCutAt: 1234567890 } }
 * ```
 */
export const reflexorEffectsAt = (
  state: ReflexorState
): Record<string, ReflexorEffect> => {
  const askBrainEffects = createAskBrainEffects(state);
  const requestToolkitEffects = createRequestToolkitEffects(state);

  return {
    ...askBrainEffects,
    ...requestToolkitEffects,
  };
};

// ============================================================================
// 内部工具函数
// ============================================================================

/**
 * 计算需要触发的 ask-brain 副作用
 *
 * ask-brain effect 有效的条件：
 * 1. 当前没有在等待 Brain 响应
 * 2. 所有待处理的 tool-call 都已经返回了
 * 3. 存在尚未发送给 Brain 的 user message 或 tool-call result
 *
 * @internal
 * @param state - Reflexor 状态
 * @returns ask-brain Effects
 */
const createAskBrainEffects = (
  state: ReflexorState
): Record<string, ReflexorEffect> => {
  // 检查条件 1: 当前没有在等待 Brain 响应
  if (state.isWaitingBrain) {
    return {};
  }

  // 检查条件 2: 所有待处理的 tool-call 都已经返回了
  if (!areAllPendingToolCallsCompleted(state)) {
    return {};
  }

  // 获取时间戳
  const lastUserMessageReceivedAt = getLastUserMessageReceivedAt(state);
  const lastToolCallResultReceivedAt = getLastToolCallResultReceivedAt(state);

  // 检查条件 3: 存在尚未发送给 Brain 的 user message 或 tool-call result
  if (!hasPendingSignal(state, lastUserMessageReceivedAt, lastToolCallResultReceivedAt)) {
    return {};
  }

  // 计算信号截止时间戳：取最新的 user message 或 tool result 的时间戳
  const signalsCutAt = Math.max(
    lastUserMessageReceivedAt,
    lastToolCallResultReceivedAt
  );

  const key = `ask-brain-${signalsCutAt}`;

  return {
    [key]: {
      kind: "ask-brain",
      signalsCutAt,
    },
  };
};

/**
 * 计算需要触发的 request-toolkit 副作用
 *
 * @internal
 * @param state - Reflexor 状态
 * @returns request-toolkit Effects
 */
const createRequestToolkitEffects = (
  state: ReflexorState
): Record<string, ReflexorEffect> => {
  const effects: Record<string, ReflexorEffect> = {};

  for (const toolCallId of state.pendingToolCallIds) {
    const recordIndex = state.toolCallIndex[toolCallId];
    const toolCall = recordIndex !== undefined
      ? state.toolCallRecords[recordIndex]
      : undefined;

    // 只有 result 为 null 的 tool call 才需要执行
    if (toolCall && toolCall.result === null) {
      const key = `request-toolkit-${toolCallId}`;

      effects[key] = {
        kind: "request-toolkit",
        toolCallId,
      };
    }
  }

  return effects;
};

/**
 * 检查所有待处理的 tool-call 是否都已经返回了
 *
 * @internal
 * @param state - Reflexor 状态
 * @returns 如果所有 pending tool-call 都有结果，返回 true
 */
const areAllPendingToolCallsCompleted = (state: ReflexorState): boolean => {
  for (const toolCallId of state.pendingToolCallIds) {
    const recordIndex = state.toolCallIndex[toolCallId];
    const toolCall = recordIndex !== undefined
      ? state.toolCallRecords[recordIndex]
      : undefined;

    // 如果 tool call 不存在或者没有结果，则说明还有未完成的
    if (!toolCall || toolCall.result === null) {
      return false;
    }
  }

  return true;
};

/**
 * 判断是否存在尚未发送给 Brain 的 user message 或 tool-call result
 *
 * @internal
 * @param state - Reflexor 状态
 * @param lastUserMessageReceivedAt - 最后一个用户消息接收时间
 * @param lastToolCallResultReceivedAt - 最后一个工具调用结果接收时间
 * @returns 如果存在新信号，返回 true
 */
const hasPendingSignal = (
  state: ReflexorState,
  lastUserMessageReceivedAt: number,
  lastToolCallResultReceivedAt: number
): boolean => {
  if (lastUserMessageReceivedAt > state.calledBrainAt) {
    return true;
  }

  return lastToolCallResultReceivedAt > state.calledBrainAt;
};
