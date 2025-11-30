// ============================================================================
// Transition 工具函数
// ============================================================================

import type { BaseInput } from "../input";
import type { ReflexorState } from "../state";

/**
 * 检查时间不可逆原则
 *
 * 任何早于 state.updatedAt 的 Input 都会被拒绝。
 *
 * @param input - 输入信号
 * @param state - 当前状态
 * @returns 如果输入有效（时间戳 >= state.updatedAt），返回 true
 *
 * @example
 * ```typescript
 * const isValid = checkTimeIrreversibility(input, state);
 * if (!isValid) {
 *   return state; // 拒绝过时的输入
 * }
 * ```
 */
export function checkTimeIrreversibility(
  input: BaseInput,
  state: ReflexorState
): boolean {
  return input.timestamp >= state.updatedAt;
}

