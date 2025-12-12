/**
 * User Reaction 工厂函数
 */

import type { ReactionFnOf, NotifyUser } from "@/decl";
import type { USER } from "@/decl";

/**
 * User Reaction 依赖
 */
export type UserReactionDeps = {
  /** 通知用户的回调函数 */
  notifyUser: NotifyUser;
};

/**
 * 创建 User Reaction
 *
 * User 主要是被动接收通知，不主动触发 Action
 */
export function createUserReaction(
  _deps: UserReactionDeps
): ReactionFnOf<typeof USER> {
  return async ({ perspective: _perspective, dispatch: _dispatch }) => {
    // User Actor 本身不需要主动做任何事
    // 所有对用户的通知都由 Workforce 通过 NotifyTaskCompletion Action 触发
    // 这里只是保持接口一致性
  };
}
