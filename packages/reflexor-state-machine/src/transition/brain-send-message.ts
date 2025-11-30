// ============================================================================
// 处理 BrainSendMessageStart 和 BrainSendMessageComplete 输入
// ============================================================================

import { create } from "mutative";
import type {
  BrainSendMessageStart,
  BrainSendMessageComplete,
} from "../input";
import type { AssistantMessage, ReflexorState } from "../state";

/**
 * 处理 Brain 开始输出消息
 *
 * 在 state 中创建空内容的 assistant message。
 *
 * @param input - BrainSendMessageStart 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleBrainSendMessageStart(
  input: BrainSendMessageStart,
  state: ReflexorState
): ReflexorState {
  const assistantMessage: AssistantMessage = {
    kind: "assistant",
    id: input.messageId,
    content: "", // 空内容，等待 streaming 完成
    receivedAt: input.timestamp,
  };

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.messages = [...state.messages, assistantMessage];
    draft.isWaitingBrain = true;
  });
}

/**
 * 处理 Brain 完成输出消息
 *
 * 更新 state 中的 assistant message 为完整内容。
 *
 * @param input - BrainSendMessageComplete 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleBrainSendMessageComplete(
  input: BrainSendMessageComplete,
  state: ReflexorState
): ReflexorState {
  // 找到对应的 assistant message 并更新内容
  const messageIndex = state.messages.findIndex(
    (msg) => msg.kind === "assistant" && msg.id === input.messageId
  );

  if (messageIndex === -1) {
    // 如果找不到消息，可能是乱序，直接创建
    const assistantMessage: AssistantMessage = {
      kind: "assistant",
      id: input.messageId,
      content: input.content,
      receivedAt: input.timestamp,
    };

    return create(state, (draft) => {
      draft.updatedAt = input.timestamp;
      draft.messages = [...state.messages, assistantMessage];
      draft.isWaitingBrain = false;
      draft.calledBrainAt = input.timestamp;
    });
  }

  // 更新现有消息的内容
  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.messages = state.messages.map((msg, index) => {
      if (index === messageIndex && msg.kind === "assistant") {
        return {
          ...msg,
          content: input.content,
        };
      }
      return msg;
    });
    draft.isWaitingBrain = false;
    draft.calledBrainAt = input.timestamp;
  });
}

