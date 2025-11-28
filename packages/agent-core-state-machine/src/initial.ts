// ============================================================================
// Agent State Machine - Initial State
// ============================================================================

import type { AgentState } from "./state";

/**
 * Agent 状态机的初始状态
 *
 * @param initialContextWindowSize - 初始上下文窗口大小，默认为 10
 * @returns 初始的 Agent 状态
 *
 * @example
 * ```typescript
 * const initialState = initialAgentState(20);
 * // {
 * //   messages: [],
 * //   tools: {},
 * //   toolCalls: {},
 * //   reactContext: { contextWindowSize: 20, toolCallIds: [] }
 * // }
 * ```
 */
export function initialAgentState(
  initialContextWindowSize: number = 10
): AgentState {
  return {
    messages: [],
    tools: {},
    toolCalls: {},
    reactContext: {
      contextWindowSize: initialContextWindowSize,
      toolCallIds: [],
    },
  };
}

