/**
 * Workforce Actor 初始化函数
 */

import type { PerspectiveOfWorkforce } from "@/decl";

/**
 * 初始化 Workforce Actor 的状态
 *
 * @returns Workforce 的初始 Perspective
 */
export function initialWorkforce(): PerspectiveOfWorkforce {
  return {
    // WorkforceObUser - 已通知用户的任务完成事件
    notifiedTaskCompletions: [],

    // WorkforceObLlm - Llm 的请求列表
    taskCreateRequests: [],
    messageAppendRequests: [],
    taskCancelRequests: [],

    // WorkforceObWorkforce - 内部状态
    topLevelTaskIds: [],
    taskCache: {},
  };
}
