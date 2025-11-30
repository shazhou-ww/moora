// ============================================================================
// 处理 ToolkitRespond 和 ToolkitError 输入
// ============================================================================

import { create } from "mutative";
import type { ToolkitRespond, ToolkitError } from "../input";
import type { ReflexorState, ToolCallResult } from "../state";

/**
 * 处理 Toolkit 返回结果
 *
 * @param input - ToolkitRespond 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleToolkitRespond(
  input: ToolkitRespond,
  state: ReflexorState
): ReflexorState {
  const toolCallIndex = state.toolCallIndex[input.toolCallId];
  if (toolCallIndex === undefined) {
    // Tool call 不存在，忽略
    return state;
  }

  const result: ToolCallResult = {
    isSuccess: true,
    content: input.result,
    receivedAt: input.timestamp,
  };

  return updateToolCallResult(input.toolCallId, result, input.timestamp, state);
}

/**
 * 处理 Toolkit 返回错误
 *
 * @param input - ToolkitError 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleToolkitError(
  input: ToolkitError,
  state: ReflexorState
): ReflexorState {
  const toolCallIndex = state.toolCallIndex[input.toolCallId];
  if (toolCallIndex === undefined) {
    // Tool call 不存在，忽略
    return state;
  }

  const result: ToolCallResult = {
    isSuccess: false,
    error: input.error,
    receivedAt: input.timestamp,
  };

  return updateToolCallResult(input.toolCallId, result, input.timestamp, state);
}

/**
 * 更新 Tool Call 结果
 *
 * @param toolCallId - Tool Call ID
 * @param result - 结果
 * @param timestamp - 时间戳
 * @param state - 当前状态
 * @returns 新状态
 */
function updateToolCallResult(
  toolCallId: string,
  result: ToolCallResult,
  timestamp: number,
  state: ReflexorState
): ReflexorState {
  const recordIndex = state.toolCallIndex[toolCallId];
  if (recordIndex === undefined) {
    return state;
  }

  const existingRecord = state.toolCallRecords[recordIndex];
  if (!existingRecord) {
    return state;
  }

  return create(state, (draft) => {
    draft.updatedAt = timestamp;
    draft.toolCallRecords = state.toolCallRecords.map((record, index) => {
      if (index === recordIndex) {
        return {
          ...record,
          result,
        };
      }
      return record;
    });
    // 从 pending 列表中移除
    draft.pendingToolCallIds = state.pendingToolCallIds.filter(
      (id) => id !== toolCallId
    );
  });
}
