/**
 * Workforce Actor 初始化函数
 */

import type { PerspectiveOfWorkforce } from "@/decl";

/**
 * 初始化 Workforce Actor 的状态
 *
 * @returns Workforce 的初始 Perspective（只包含 Workforce 的输出）
 */
export function initialWorkforce(): PerspectiveOfWorkforce {
  return {
    // WorkforceObUser - 发给 User 的任务信息
    ongoingTopLevelTasks: [],
    notifiedTaskCompletions: [],

    // WorkforceObLlm - 发给 Llm 的任务详情
    topLevelTasks: {},

    // WorkforceObWorkforce - 自己维护的任务状态
    topLevelTaskIds: [],
    taskCache: {},
  };
}
