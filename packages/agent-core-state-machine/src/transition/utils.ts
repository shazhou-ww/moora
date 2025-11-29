// ============================================================================
// Transition Utils - 辅助函数
// ============================================================================

import type { AgentInput } from "../input";
import type { AgentState } from "../state";

/**
 * 从输入中提取时间戳
 *
 * @internal
 */
export const getInputTimestamp = (input: AgentInput): number => {
  switch (input.type) {
    case "user-message-received":
      return input.timestamp;
    case "llm-message-started":
      return input.timestamp;
    case "llm-message-completed":
      return input.timestamp;
    case "tool-call-started":
      return input.timestamp;
    case "tool-call-completed":
      return input.timestamp;
    case "context-window-expanded":
      return input.timestamp;
    case "history-tool-calls-added":
      return input.timestamp;
    default:
      const _exhaustive: never = input;
      return Date.now();
  }
};

/**
 * 检查时间不可逆原则
 *
 * 如果输入的时间戳小于等于 state 的时间戳，视为无效输入。
 *
 * @internal
 */
export const checkTimeIrreversibility = (
  input: AgentInput,
  state: AgentState
): boolean => {
  const inputTimestamp = getInputTimestamp(input);
  if (inputTimestamp <= state.timestamp) {
    console.warn(
      `[AgentStateMachine] Ignoring input with invalid timestamp: type=${input.type}, inputTimestamp=${inputTimestamp}, stateTimestamp=${state.timestamp}`
    );
    return false;
  }
  return true;
};


