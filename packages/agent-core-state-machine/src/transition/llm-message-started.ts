// ============================================================================
// Handle LLM Message Started - 处理 LLM 消息开始输入
// ============================================================================

import type { AssistantMessage } from "@moora/agent-webui-protocol";
import type { AgentState } from "../state";
import type { LlmMessageStarted } from "../input";
import { messageIdExists } from "./utils";

/**
 * 处理 LLM 消息开始输入
 *
 * 当 LLM 开始向用户发送消息时：
 * - assistant-message（此时 content 为空）加入历史消息列表
 * - 仅承担消息流式输出的起点标记，不影响 ReAct Loop 的生命周期
 * - 时间戳以开始事件为准
 *
 * @internal
 */
export const handleLlmMessageStarted = (
  { messageId, timestamp }: LlmMessageStarted,
  state: AgentState
): AgentState => {
  // 检查消息 ID 是否已存在
  if (messageIdExists(state, messageId)) {
    console.warn(
      `[AgentStateMachine] Ignoring llm message started with duplicate ID: ${messageId}`
    );
    return state;
  }

  // 创建新的助手消息，content 为空字符串
  // receivedAt 以开始事件为准，updatedAt 暂时等于 receivedAt（会在 completed 时更新）
  const newMessage: AssistantMessage = {
    id: messageId,
    role: "assistant",
    content: "",
    receivedAt: timestamp,
    updatedAt: timestamp,
    streaming: true,
    taskIds: [],
  };

  // 在消息列表末尾加入 newMessage
  const messages = [...state.messages, newMessage];

  return {
    ...state,
    messages,
    // 更新状态时间戳
    updatedAt: timestamp,
  };
};


