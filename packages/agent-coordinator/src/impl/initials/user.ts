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
    // UserObUser: 用户消息列表和已通知的任务完成
    userMessages: [],
    notifiedTaskCompletions: [],
    // UserObLlm: 助手消息
    assiMessages: [],
    // UserObToolkit: 工具结果
    toolResults: [],
    // UserObWorkforce: 正在进行的任务
    ongoingTopLevelTasks: [],
  };
}
