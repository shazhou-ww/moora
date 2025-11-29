// ============================================================================
// Handle User Message - 处理用户消息输入
// ============================================================================

import { create } from "mutative";
import type { AgentState } from "../state";
import type { UserMessageReceived } from "../input";

/**
 * 处理用户消息输入
 *
 * 当收到用户消息时：
 * - 将消息加入消息列表
 * - 如果有 reactContext，则把 context window + 1
 * - 否则，按照 initialContextWindowSize 创建一个 reactContext
 *
 * @internal
 */
export const handleUserMessage = (
  input: UserMessageReceived,
  state: AgentState,
  initialContextWindowSize: number
): AgentState => {
  // 检查消息 ID 是否已存在
  const existingIndex = state.messages.findIndex(
    (msg) => msg.id === input.messageId
  );

  if (existingIndex >= 0) {
    console.warn(
      `[AgentStateMachine] Ignoring user message with duplicate ID: ${input.messageId}`
    );
    return state;
  }

  // 检查时间戳是否大于最后一条消息的时间戳
  if (state.messages.length > 0) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && input.timestamp <= lastMessage.timestamp) {
      console.warn(
        `[AgentStateMachine] Ignoring user message with invalid timestamp: messageId=${input.messageId}, timestamp=${input.timestamp}, lastMessageTimestamp=${lastMessage.timestamp}`
      );
      return state;
    }
  }

  return create(state, (draft) => {
    const newMessage = {
      id: input.messageId,
      role: "user" as const,
      content: input.content,
      timestamp: input.timestamp,
      taskIds: [] as string[],
    };

    // 添加新消息（由于已验证时间戳，直接 push 到末尾即可）
    draft.messages.push(newMessage);

    // 更新状态时间戳
    draft.timestamp = input.timestamp;

    // 判断是否有 reactContext
    if (draft.reactContext) {
      // 如果有，则把 context window + 1
      draft.reactContext.contextWindowSize += 1;
    } else {
      // 否则，按照 initialContextWindowSize 创建一个 reactContext
      draft.reactContext = {
        contextWindowSize: initialContextWindowSize,
        toolCallIds: [],
        startedAt: input.timestamp,
      };
    }
  });
};


