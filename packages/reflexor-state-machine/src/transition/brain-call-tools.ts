// ============================================================================
// 处理 BrainCallTools 输入
// ============================================================================

import { create } from "mutative";
import type { BrainCallTools } from "../input";
import type { ReflexorState, ToolCallRecord } from "../state";

/**
 * 处理 Brain 请求调用工具
 *
 * @param input - BrainCallTools 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleBrainCallTools(
  input: BrainCallTools,
  state: ReflexorState
): ReflexorState {
  const toolCallIds = Object.keys(input.toolCalls);

  // 创建新的 tool call 记录数组
  const newToolCallRecords: ToolCallRecord[] = [];
  const newToolCallIndex: Record<string, number> = {};
  let currentIndex = state.toolCallRecords.length;

  for (const [id, request] of Object.entries(input.toolCalls)) {
    const record: ToolCallRecord = {
      id,
      name: request.name,
      parameters: request.parameters,
      calledAt: request.calledAt,
      result: null,
    };
    newToolCallRecords.push(record);
    newToolCallIndex[id] = currentIndex;
    currentIndex += 1;
  }

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.toolCallRecords = [...state.toolCallRecords, ...newToolCallRecords];
    draft.toolCallIndex = { ...state.toolCallIndex, ...newToolCallIndex };
    draft.pendingToolCallIds = [
      ...state.pendingToolCallIds,
      ...toolCallIds,
    ];
    draft.isWaitingBrain = false;
  });
}
