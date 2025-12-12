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
    // UserObUser - 用户消息列表
    userMessages: [],

    // UserObLlm - 助手消息列表
    assiMessages: [],

    // UserObWorkforce - 正在进行的顶层任务
    ongoingTopLevelTasks: [],
  };
}
