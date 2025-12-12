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
    // UserObLlm - 用户消息列表
    userMessages: [],

    // LlmObLlm - 助手消息和截止时间
    assiMessages: [],
    cutOff: 0,

    // LlmObUser - 发给 User 的助手消息（与 LlmObLlm 重复）
    // assiMessages 已包含

    // LlmObToolkit - 发给 Toolkit 的工具调用请求
    toolCallRequests: [],

    // ToolkitObLlm - 从 Toolkit 接收的工具结果
    toolResults: [],

    // LlmObWorkforce - 发给 Workforce 的任务请求
    taskCreateRequests: [],
    messageAppendRequests: [],
    taskCancelRequests: [],

    // WorkforceObLlm - 从 Workforce 接收的任务详情
    topLevelTasks: {},
  };
}
