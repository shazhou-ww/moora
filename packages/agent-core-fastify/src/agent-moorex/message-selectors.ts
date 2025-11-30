// ============================================================================
// Agent Message Selectors - 消息选择器
// ============================================================================

import type { AgentState } from "@moora/agent-core-state-machine";

/**
 * 判断是否存在待响应的用户消息
 *
 * @internal
 * @param messages - Agent 历史消息
 * @returns 是否存在尚未收到助手响应的最新用户消息
 */
export const hasPendingUserMessage = (
  messages: AgentState["messages"]
): boolean => findPendingUserMessageIndex(messages) !== -1;

/**
 * 找到需要响应的最新用户消息索引
 *
 * @internal
 * @param messages - Agent 历史消息
 * @returns 待响应用户消息的索引，若不存在则返回 -1
 */
export const findPendingUserMessageIndex = (
  messages: AgentState["messages"]
): number => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (!message || message.role !== "user") {
      continue;
    }

    if (!hasAssistantAfter(messages, index)) {
      return index;
    }
  }

  return -1;
};

/**
 * 判断指定索引之后是否存在助手消息
 *
 * @internal
 * @param messages - Agent 历史消息
 * @param fromIndex - 起始索引
 * @returns 是否存在助手消息
 */
const hasAssistantAfter = (
  messages: AgentState["messages"],
  fromIndex: number
): boolean => {
  for (let index = fromIndex + 1; index < messages.length; index += 1) {
    const message = messages[index];

    if (message && message.role === "assistant") {
      return true;
    }
  }

  return false;
};

