// ============================================================================
// Handle User Message - 处理用户消息输入
// ============================================================================

import type { UserMessage } from "@moora/agent-webui-protocol";
import type { AgentState } from "../state";
import type { UserMessageReceived } from "../input";
import { messageIdExists } from "./utils";

/**
 * 处理用户消息输入
 *
 * 当收到用户消息时：
 * - 将消息加入消息列表
 * - 如果有 reActContext，则把 context window + 1
 * - 否则，按照 initialContextWindowSize 创建一个 reActContext
 *
 * @internal
 */
export const handleUserMessage = (
  { messageId, content, timestamp }: UserMessageReceived,
  state: AgentState,
  initialContextWindowSize: number
): AgentState => {
  // 检查消息 ID 是否已存在
  if (messageIdExists(state, messageId)) {
    console.warn(
      `[AgentStateMachine] Ignoring user message with duplicate ID: ${messageId}`
    );
    return state;
  }

  // 创建新的用户消息
  const newMessage: UserMessage = {
    id: messageId,
    role: "user",
    content,
    receivedAt: timestamp,
    taskIds: [],
  };

  // 在消息列表末尾加入 newMessage
  const messages = [...state.messages, newMessage];

  const currentReActContext = state.reActContext;

  // 判断是否有 reActContext
  const reActContext = currentReActContext
    ? // 如果有 reActContext，则把 context window + 1
      {
        ...currentReActContext,
        contextWindowSize: currentReActContext.contextWindowSize + 1,
        updatedAt: timestamp,
      }
    : // 如果没有 reActContext，则创建新的 reActContext
      {
        contextWindowSize: initialContextWindowSize,
        toolCallIds: [],
        startedAt: timestamp,
        updatedAt: timestamp,
      };

  return {
    ...state,
    messages,
    reActContext,
    // 更新状态时间戳
    updatedAt: timestamp,
  };
};


