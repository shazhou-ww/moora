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
    updatedAt: input.timestamp,
  };

  const newIndex = state.assistantMessages.length;

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.assistantMessages = [...state.assistantMessages, assistantMessage];
    draft.assistantMessageIndex = {
      ...state.assistantMessageIndex,
      [input.messageId]: newIndex,
    };
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
  const messageIndex = state.assistantMessageIndex[input.messageId];

  // 如果找不到消息，可能是乱序，直接创建
  if (messageIndex === undefined) {
    return createNewAssistantMessage(input, state);
  }

  // 更新现有消息的内容
  return updateExistingAssistantMessage(input, state, messageIndex);
}

/**
 * 创建新的 assistant message（乱序情况）
 */
function createNewAssistantMessage(
  input: BrainSendMessageComplete,
  state: ReflexorState
): ReflexorState {
  const assistantMessage: AssistantMessage = {
    kind: "assistant",
    id: input.messageId,
    content: input.content,
    receivedAt: input.timestamp,
    updatedAt: input.timestamp,
  };

  const newIndex = state.assistantMessages.length;

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.assistantMessages = [...state.assistantMessages, assistantMessage];
    draft.assistantMessageIndex = {
      ...state.assistantMessageIndex,
      [input.messageId]: newIndex,
    };
    draft.isWaitingBrain = false;
    draft.calledBrainAt = input.timestamp;
  });
}

/**
 * 更新现有的 assistant message
 */
function updateExistingAssistantMessage(
  input: BrainSendMessageComplete,
  state: ReflexorState,
  messageIndex: number
): ReflexorState {
  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.assistantMessages = state.assistantMessages.map((msg, index) => {
      if (index === messageIndex) {
        return {
          ...msg,
          content: input.content,
          updatedAt: input.timestamp,
        };
      }
      return msg;
    });
    draft.isWaitingBrain = false;
    draft.calledBrainAt = input.timestamp;
  });
}
