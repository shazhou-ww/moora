// ============================================================================
// Handle Tool Call Completed - 处理 Tool Call 完成输入
// ============================================================================

import type { AgentState } from "../state";
import type { ToolCallCompleted } from "../input";

/**
 * 处理 Tool Call 完成输入
 *
 * @internal
 */
export const handleToolCallCompleted = (
  { toolCallId, result, timestamp }: ToolCallCompleted,
  state: AgentState
): AgentState => {
  const existingToolCall = state.toolCalls[toolCallId];

  // 检查 Tool Call 记录是否存在
  if (!existingToolCall) {
    console.warn(
      `[AgentStateMachine] tool-call-completed received for non-existent tool call: ${toolCallId}`
    );
    return state;
  }

  // 更新 Tool Call 记录的结果，添加 receivedAt
  const toolCall = {
    ...existingToolCall,
    result: {
      ...result,
      receivedAt: timestamp,
    },
  };

  // 更新 Tool Call 记录
  const toolCalls = { ...state.toolCalls, [toolCallId]: toolCall };

  return {
    ...state,
    toolCalls,
    lastToolCallResultReceivedAt: Math.max(
      state.lastToolCallResultReceivedAt,
      timestamp
    ),
    // 更新状态时间戳
    updatedAt: timestamp,
  };
};


