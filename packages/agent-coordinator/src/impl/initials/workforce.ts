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
    // WorkforceObLlm - 任务请求
    taskCreateRequests: [],
    messageAppendRequests: [],
    taskCancelRequests: [],
    // WorkforceObWorkforce - 自己维护的任务状态
    topLevelTaskIds: [],
    taskCache: {},
  };
}
