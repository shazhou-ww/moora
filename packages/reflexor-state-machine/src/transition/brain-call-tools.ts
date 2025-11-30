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

  // 创建新的 tool call 记录
  const newToolCalls: Record<string, ToolCallRecord> = {};
  for (const [id, request] of Object.entries(input.toolCalls)) {
    newToolCalls[id] = {
      name: request.name,
      parameters: request.parameters,
      calledAt: request.calledAt,
      result: null,
    };
  }

  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.toolCalls = { ...state.toolCalls, ...newToolCalls };
    draft.pendingToolCallIds = [
      ...state.pendingToolCallIds,
      ...toolCallIds,
    ];
    draft.isWaitingBrain = false;
  });
}

