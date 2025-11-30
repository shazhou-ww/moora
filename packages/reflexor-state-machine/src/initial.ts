// ============================================================================
// Reflexor State Machine - Initial State
// ============================================================================

import type { Initial } from "@moora/moorex";
import type { ReflexorState } from "./state";

/**
 * 初始化 Reflexor 状态
 *
 * 创建一个新的 Reflexor 状态。
 *
 * @returns 初始的 Reflexor 状态
 *
 * @example
 * ```typescript
 * const initialState = initializeReflexorState();
 * // {
 * //   updatedAt: Date.now(),
 * //   messages: [],
 * //   toolCalls: {},
 * //   lastUserMessageReceivedAt: 0,
 * //   lastToolCallResultReceivedAt: 0,
 * //   calledBrainAt: 0,
 * //   isWaitingBrain: false,
 * //   pendingToolCallIds: [],
 * // }
 * ```
 */
export function initializeReflexorState(): ReflexorState {
  const now = Date.now();
  return {
    updatedAt: now,
    messages: [],
    toolCalls: {},
    lastUserMessageReceivedAt: 0,
    lastToolCallResultReceivedAt: 0,
    calledBrainAt: 0,
    isWaitingBrain: false,
    pendingToolCallIds: [],
  };
}

/**
 * 创建 Reflexor 初始状态函数
 *
 * 返回标准的 moorex Initial 函数：`() => ReflexorState`
 *
 * @param initialState - 初始状态
 * @returns 标准的 moorex Initial 函数
 *
 * @example
 * ```typescript
 * const initialState = initializeReflexorState();
 * const initial = createReflexorInitial(initialState);
 *
 * const state = initial();
 * // 返回 initialState
 * ```
 */
export function createReflexorInitial(
  initialState: ReflexorState
): Initial<ReflexorState> {
  return () => initialState;
}

