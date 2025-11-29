// ============================================================================
// Handle LLM Message Completed - 处理 LLM 消息完成输入
// ============================================================================

import { create } from "mutative";
import type { AgentState } from "../state";
import type { LlmMessageCompleted } from "../input";

/**
 * 处理 LLM 消息完成输入
 *
 * 当 LLM 完成消息流式输出时：
 * - 只修改 content，不修改时间戳
 * - 确保历史消息列表按事件排序（时间戳以开始事件为准）
 *
 * @internal
 */
export const handleLlmMessageCompleted = (
  input: LlmMessageCompleted,
  state: AgentState
): AgentState => {
  return create(state, (draft) => {
    const existingIndex = draft.messages.findIndex(
      (msg) => msg.id === input.messageId
    );

    if (existingIndex >= 0) {
      const existingMessage = draft.messages[existingIndex];
      if (existingMessage && existingMessage.role === "assistant") {
        // 只更新消息内容为完整内容，并标记不再流式输出
        // 不修改时间戳，保持以开始事件为准
        draft.messages[existingIndex] = {
          ...existingMessage,
          content: input.content,
          streaming: false,
        };
      }
    } else {
      // 如果消息不存在，创建新的助手消息
      // 这种情况不应该发生，因为应该在 llm-message-started 时已创建
      console.warn(
        `[AgentStateMachine] llm-message-completed received for non-existent message: ${input.messageId}`
      );
      const newMessage = {
        id: input.messageId,
        role: "assistant" as const,
        content: input.content,
        timestamp: input.timestamp,
        streaming: false,
        taskIds: [] as string[],
      };

      // 保持按时间戳排序
      const insertIndex = draft.messages.findIndex(
        (msg) => msg.timestamp > input.timestamp
      );
      if (insertIndex >= 0) {
        draft.messages.splice(insertIndex, 0, newMessage);
      } else {
        draft.messages.push(newMessage);
      }
    }

    // 更新状态时间戳
    draft.timestamp = input.timestamp;
  });
};


