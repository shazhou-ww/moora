// ============================================================================
// Agent State Machine - Transition Functions
// ============================================================================

import type { Transition } from "@moora/moorex";
import type { AgentInput } from "../input";
import type { AgentState } from "../state";
import { checkTimeIrreversibility } from "./utils";
import { handleUserMessage } from "./user-message";
import { handleLlmMessageStarted } from "./llm-message-started";
import { handleLlmMessageCompleted } from "./llm-message-completed";
import { handleToolCallCompleted } from "./tool-call-completed";
import { handleContextWindowExpanded } from "./context-window-expanded";
import { handleHistoryToolCallsAdded } from "./history-tool-calls-added";
import { handleReActObserved } from "./re-act-observed";

export const DEFAULT_INITIAL_CONTEXT_WINDOW_SIZE = 10 as const;
export const DEFAULT_EXPAND_CONTEXT_WINDOW_SIZE = 10 as const;

export type AgentTransitionOptions = {
  initialContextWindowSize?: number;
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
export const createAgentTransition =
  ({
    initialContextWindowSize = DEFAULT_INITIAL_CONTEXT_WINDOW_SIZE,
    expandContextWindowSize = DEFAULT_EXPAND_CONTEXT_WINDOW_SIZE,
  }: AgentTransitionOptions = {}): Transition<AgentInput, AgentState> =>
  (input) =>
  (state) => {
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
      case "tool-call-completed":
        return handleToolCallCompleted(input, state);
      case "re-act-observed":
        return handleReActObserved(input, state);
      case "context-window-expanded":
        return handleContextWindowExpanded(
          input,
          state,
          expandContextWindowSize
        );
      case "history-tool-calls-added":
        return handleHistoryToolCallsAdded(input, state);
      default:
        // 确保所有 case 都被处理
        const _exhaustive: never = input;
        return state;
    }
  };
