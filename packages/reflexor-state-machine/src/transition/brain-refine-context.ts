// ============================================================================
// 处理 BrainRefineContext 输入
// ============================================================================

import { create } from "mutative";
import type { BrainRefineContext } from "../input";
import type {
  ReflexorState,
  UserMessage,
  AssistantMessage,
} from "../state";

/**
 * 处理 Brain 优化上下文
 *
 * @param input - BrainRefineContext 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleBrainRefineContext(
  input: BrainRefineContext,
  state: ReflexorState
): ReflexorState {
  const { refinement } = input;

  switch (refinement.kind) {
    case "compress":
      return handleCompress(input, state);
    case "load-history":
      return handleLoadHistory(input, state);
    case "load-tool-results":
      return handleLoadToolResults(input, state);
    default:
      return state;
  }
}

/**
 * 处理上下文压缩
 */
function handleCompress(
  input: BrainRefineContext,
  state: ReflexorState
): ReflexorState {
  // 压缩上下文：用摘要替换现有消息
  // 这里简化处理，实际实现可能需要更复杂的逻辑
  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    // 保留压缩摘要作为系统消息或其他处理
  });
}

/**
 * 处理加载历史消息
 *
 * 将历史消息按类型分离添加到对应的数组前面，并更新索引。
 */
function handleLoadHistory(
  input: BrainRefineContext,
  state: ReflexorState
): ReflexorState {
  if (input.refinement.kind !== "load-history") {
    return state;
  }

  const { userMessages, assistantMessages } = separateMessages(
    input.refinement.messages
  );

  // 重建 assistantMessageIndex
  const newAssistantMessageIndex: Record<string, number> = {};
  assistantMessages.forEach((msg, index) => {
    newAssistantMessageIndex[msg.id] = index;
  });
  // 调整现有索引的偏移量
  const offset = assistantMessages.length;
  for (const [id, index] of Object.entries(state.assistantMessageIndex)) {
    newAssistantMessageIndex[id] = index + offset;
  }

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.userMessages = [...userMessages, ...state.userMessages];
    draft.assistantMessages = [...assistantMessages, ...state.assistantMessages];
    draft.assistantMessageIndex = newAssistantMessageIndex;
  });
}

/**
 * 分离混合消息数组为 user 和 assistant 消息
 */
function separateMessages(messages: readonly (UserMessage | AssistantMessage)[]): {
  userMessages: UserMessage[];
  assistantMessages: AssistantMessage[];
} {
  const userMessages: UserMessage[] = [];
  const assistantMessages: AssistantMessage[] = [];

  for (const msg of messages) {
    if (msg.kind === "user") {
      userMessages.push(msg);
    } else {
      assistantMessages.push(msg);
    }
  }

  return { userMessages, assistantMessages };
}

/**
 * 处理加载历史 Tool Results
 */
function handleLoadToolResults(
  input: BrainRefineContext,
  state: ReflexorState
): ReflexorState {
  if (input.refinement.kind !== "load-tool-results") {
    return state;
  }

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    // Tool results 已经在 toolCallRecords 中，这里只需要更新时间戳
  });
}
