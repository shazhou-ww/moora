/**
 * Agent 的状态转换函数实现
 */

import type { AgentState, AgentInput } from "@/decl/agent";
import { transitionUser } from "@/impl/transitions/user";
import { transitionLlm } from "@/impl/transitions/llm";

/**
 * Agent 的状态转换函数
 *
 * 根据 Input 的类型，调用对应 Actor 的 transition 函数。
 *
 * @param input - Agent 的输入
 * @returns 状态转换函数
 */
export function transition(
  input: AgentInput
): (state: AgentState) => AgentState {
  return (state: AgentState) => {
    const { userMessages, assiMessages } = state;

    // 根据 Input 类型调用对应的 transition 函数
    if (input.type === "send-user-message") {
      const newUserState = transitionUser(input)({ userMessages });
      return { ...state, userMessages: newUserState.userMessages };
    } else if (
      input.type === "start-assi-message-stream" ||
      input.type === "end-assi-message-stream"
    ) {
      const newLlmState = transitionLlm(input)({ assiMessages });
      return { ...state, assiMessages: newLlmState.assiMessages };
    }

    return state;
  };
}
