/**
 * User Actor 初始化函数
 */

import type { PerspectiveOfUser } from "@/decl";

/**
 * 初始化 User Actor 的状态
 *
 * @returns User 的初始 Perspective
 */
export function initialUser(): PerspectiveOfUser {
  return {
    // UserObUser & UserObLlm - 用户消息列表
    userMessages: [],
  };
}
