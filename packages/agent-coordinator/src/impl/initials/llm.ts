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
    // LlmObUser - 用户消息
    userMessages: [],
    // LlmObLlm - 自己维护的助手消息和截止时间
    assiMessages: [],
    cutOff: 0,
    // LlmObToolkit - 工具结果
    toolResults: [],
    // LlmObWorkforce - 任务详情
    topLevelTasks: {},
    // ToolkitObLlm - 工具调用请求
    toolCallRequests: [],
    // WorkforceObLlm - 任务请求
    taskCreateRequests: [],
    messageAppendRequests: [],
    taskCancelRequests: [],
  };
}
