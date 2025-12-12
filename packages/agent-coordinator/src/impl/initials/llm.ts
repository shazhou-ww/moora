/**
 * Llm Actor 初始化函数
 */

import type { PerspectiveOfLlm } from "@/decl";

/**
 * 初始化 Llm Actor 的状态
 *
 * @returns Llm 的初始 Perspective
 */
export function initialLlm(): PerspectiveOfLlm {
  return {
    // LlmObUser - 用户消息列表
    userMessages: [],

    // LlmObLlm - 自身状态
    assiMessages: [],
    cutOff: 0,

    // LlmObToolkit - 工具调用结果
    toolResults: [],

    // LlmObWorkforce - 所有顶层任务详情
    topLevelTasks: {},

    // LlmObToolkit - 工具调用请求（输出）
    toolCallRequests: [],
  };
}
