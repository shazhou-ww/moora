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

    // LlmObUser - 助手消息列表
    assiMessages: [],

    // ToolkitObUser - 工具调用结果
    toolResults: [],

    // WorkforceObUser - 正在进行的顶层任务和通知状态
    ongoingTopLevelTasks: [],
    notifiedTaskCompletions: [],
  };
}
