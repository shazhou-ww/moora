/**
 * User Actor 状态转换函数
 */

import type {
  AppearanceOfUser,
  ActionFromUser,
  PerspectiveOfUser,
  SendUserMessage,
} from "@/decl";

/**
 * User 的状态转换函数
 *
 * 处理 User 的 Action，更新其 Perspective
 */
export function transitionUser(
  appearance: AppearanceOfUser,
  action: ActionFromUser
): Partial<PerspectiveOfUser> {
  // ActionFromUser 目前只有 SendUserMessage 一种类型
  return handleSendUserMessage(appearance, action);
}

/**
 * 处理发送用户消息
 */
function handleSendUserMessage(
  appearance: AppearanceOfUser,
  action: SendUserMessage
): Partial<PerspectiveOfUser> {
  return {
    // UserObUser & UserObLlm - 追加新的用户消息
    userMessages: [
      ...appearance.userMessages,
      {
        role: "user" as const,
        id: action.id,
        content: action.content,
        timestamp: action.timestamp,
      },
    ],
  };
}
