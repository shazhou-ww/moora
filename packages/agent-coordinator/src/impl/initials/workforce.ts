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
    // LlmObWorkforce - 从 Llm 接收的任务请求
    taskCreateRequests: [],
    messageAppendRequests: [],
    taskCancelRequests: [],

    // WorkforceObWorkforce - 自己维护的任务状态
    topLevelTaskIds: [],
    taskCache: {},

    // WorkforceObUser - 发给 User 的任务信息
    ongoingTopLevelTasks: [],
    notifiedTaskCompletions: [],

    // WorkforceObLlm - 发给 Llm 的任务详情
    topLevelTasks: {},

    // WorkforceObToolkit - 发给 Toolkit 的所有任务
    allTasks: {},
  };
}
