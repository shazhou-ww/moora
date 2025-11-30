// ============================================================================
// 处理 UserTakeAction 输入
// ============================================================================

import { create } from "mutative";
import type { UserTakeAction } from "../input";
import type { ReflexorState } from "../state";

/**
 * 用户操作类型
 */
type UserAction =
  | { kind: "cancel" }
  | { kind: "retry" }
  | { kind: "clear" };

/**
 * 解析用户操作
 *
 * @param actionJson - JSON 编码的操作数据
 * @returns 解析后的操作，如果解析失败则返回 null
 */
function parseAction(actionJson: string): UserAction | null {
  try {
    const parsed = JSON.parse(actionJson) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "kind" in parsed &&
      typeof (parsed as { kind: unknown }).kind === "string"
    ) {
      return parsed as UserAction;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 处理用户执行操作
 *
 * @param input - UserTakeAction 输入
 * @param state - 当前状态
 * @returns 新状态
 */
export function handleUserTakeAction(
  input: UserTakeAction,
  state: ReflexorState
): ReflexorState {
  const action = parseAction(input.action);
  if (!action) {
    return state;
  }

  switch (action.kind) {
    case "cancel":
      return handleCancel(input, state);
    case "retry":
      return handleRetry(input, state);
    case "clear":
      return handleClear(input, state);
    default:
      return state;
  }
}

/**
 * 处理取消操作
 */
function handleCancel(
  input: UserTakeAction,
  state: ReflexorState
): ReflexorState {
  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.isWaitingBrain = false;
    draft.pendingToolCallIds = [];
  });
}

/**
 * 处理重试操作
 */
function handleRetry(
  input: UserTakeAction,
  state: ReflexorState
): ReflexorState {
  // 重试：重置 calledBrainAt 以触发新的 LLM 调用
  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.calledBrainAt = 0;
    draft.isWaitingBrain = false;
  });
}

/**
 * 处理清空操作
 */
function handleClear(
  input: UserTakeAction,
  state: ReflexorState
): ReflexorState {
  return create(state, (draft) => {
    draft.updatedAt = input.timestamp;
    draft.messages = [];
    draft.toolCalls = {};
    draft.lastUserMessageReceivedAt = 0;
    draft.lastToolCallResultReceivedAt = 0;
    draft.calledBrainAt = 0;
    draft.isWaitingBrain = false;
    draft.pendingToolCallIds = [];
  });
}

