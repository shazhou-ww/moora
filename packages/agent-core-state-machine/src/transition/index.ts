// ============================================================================
// Agent State Machine - Transition Functions
// ============================================================================

import type { AgentInput } from "../input";
import type { AgentState } from "../state";
import { checkTimeIrreversibility } from "./utils";
import { handleUserMessage } from "./user-message";
import { handleLlmMessageStarted } from "./llm-message-started";
import { handleLlmMessageCompleted } from "./llm-message-completed";
import { handleToolCallStarted } from "./tool-call-started";
import { handleToolCallCompleted } from "./tool-call-completed";
import { handleContextWindowExpanded } from "./context-window-expanded";
import { handleHistoryToolCallsAdded } from "./history-tool-calls-added";

/**
 * Agent 状态转换选项
 */
export type AgentTransitionOptions = {
  /**
   * 初始上下文窗口大小，默认为 10
   */
  initialContextWindowSize?: number;

  /**
   * 每次扩展上下文窗口的增量，默认为 10
   */
  expandContextWindowSize?: number;
};

/**
 * 创建 Agent 状态转换函数
 *
 * 返回标准的 moorex transition 函数：`(input: AgentInput) => (state: AgentState) => AgentState`
 *
 * @param options - 转换选项
 * @param options.initialContextWindowSize - 初始上下文窗口大小，默认为 10
 * @param options.expandContextWindowSize - 每次扩展上下文窗口的增量，默认为 10
 * @returns 标准的 moorex transition 函数
 *
 * @example
 * ```typescript
 * const transition = createAgentTransition({
 *   initialContextWindowSize: 20,
 *   expandContextWindowSize: 5,
 * });
 *
 * const newState = transition({
 *   type: "user-message-received",
 *   messageId: "msg-1",
 *   content: "Hello",
 *   timestamp: Date.now(),
 * })(currentState);
 * ```
 */
export function createAgentTransition(
  options?: AgentTransitionOptions
): (input: AgentInput) => (state: AgentState) => AgentState {
  const expandContextWindowSize = options?.expandContextWindowSize ?? 10;
  const initialContextWindowSize = options?.initialContextWindowSize ?? 10;

  return (input: AgentInput) => (state: AgentState): AgentState => {
    // 检查时间不可逆原则
    if (!checkTimeIrreversibility(input, state)) {
      return state;
    }

    switch (input.type) {
      case "user-message-received":
        return handleUserMessage(input, state, initialContextWindowSize);
      case "llm-message-started":
        return handleLlmMessageStarted(input, state);
      case "llm-message-completed":
        return handleLlmMessageCompleted(input, state);
      case "tool-call-started":
        return handleToolCallStarted(input, state);
      case "tool-call-completed":
        return handleToolCallCompleted(input, state);
      case "context-window-expanded":
        return handleContextWindowExpanded(input, state, expandContextWindowSize);
      case "history-tool-calls-added":
        return handleHistoryToolCallsAdded(input, state);
      default:
        // 确保所有 case 都被处理
        const _exhaustive: never = input;
        return state;
    }
  };
}

