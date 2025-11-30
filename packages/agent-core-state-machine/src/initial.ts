// ============================================================================
// Agent State Machine - Initial State
// ============================================================================

import type { Initial } from "@moora/moorex";
import type { AgentState, ToolDefinition } from "./state";

/**
 * 初始化 Agent 状态
 *
 * 创建一个新的 Agent 状态，包含指定的工具定义。
 *
 * @param options - 初始化选项
 * @param options.tools - 初始工具定义，默认为空对象
 * @returns 初始的 Agent 状态
 *
 * @example
 * ```typescript
 * const initialState = initializeAgentState({
 *   tools: {
 *     search: {
 *       description: "Search tool",
 *       schema: JSON.stringify({ type: "object", properties: {} }),
 *     },
 *   },
 * });
 * // {
 * //   updatedAt: Date.now(),
 * //   messages: [],
 * //   tools: { search: { ... } },
 * //   toolCalls: {},
 * //   reActContext: null
 * // }
 * ```
 */
export function initializeAgentState(options?: {
  tools?: Record<string, ToolDefinition>;
}): AgentState {
  const now = Date.now();
  return {
    updatedAt: now,
    messages: [],
    tools: options?.tools ?? {},
    toolCalls: {},
    calledLlmAt: 0,
    lastUserMessageReceivedAt: 0,
    lastToolCallResultReceivedAt: 0,
    reActContext: null,
  };
}

/**
 * 创建 Agent 初始状态函数
 *
 * 返回标准的 moorex Initial 函数：`() => AgentState`
 *
 * @param initialState - 初始状态
 * @returns 标准的 moorex Initial 函数
 *
 * @example
 * ```typescript
 * const initialState = initializeAgentState({ tools: { ... } });
 * const initial = createAgentInitial(initialState);
 *
 * const state = initial();
 * // 返回 initialState
 * ```
 */
export function createAgentInitial(
  initialState: AgentState
): Initial<AgentState> {
  return () => initialState;
}

