// ============================================================================
// 处理 UserSendMessage 输入
// ============================================================================

import { create } from "mutative";
import type { UserSendMessage } from "../input";
import type { ReflexorState, UserMessage } from "../state";

/**
 * 处理用户发送消息
 *
 * @param input - UserSendMessage 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleUserSendMessage(
  input: UserSendMessage,
  state: ReflexorState
): ReflexorState {
  const userMessage: UserMessage = {
    kind: "user",
    id: input.messageId,
    content: input.content,
    receivedAt: input.timestamp,
  };

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.messages = [...state.messages, userMessage];
    draft.lastUserMessageReceivedAt = input.timestamp;
  });
}

