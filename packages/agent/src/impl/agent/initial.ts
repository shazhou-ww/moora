/**
 * Agent 的初始状态实现
 */

import type { AgentState } from "@/decl/agent";
import { initialUser } from "@/impl/initials/user";
import { initialLlm } from "@/impl/initials/llm";
import { initialToolkit } from "@/impl/initials/toolkit";

/**
 * Agent 的初始状态
 *
 * @returns Agent 的初始状态
 */
export function initial(): AgentState {
  const userState = initialUser();
  const llmState = initialLlm();
  const toolkitState = initialToolkit();

  return {
    ...userState,
    ...llmState,
    ...toolkitState,
  };
}
