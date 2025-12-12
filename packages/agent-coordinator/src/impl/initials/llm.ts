/**
 * Llm Actor 初始化函数
 */

import type { PerspectiveOfLlm } from "@/decl";

/**
 * 初始化 Llm Actor 的状态
 *
 * @returns Llm 的初始 Perspective（只包含 Llm 的输出）
 */
export function initialLlm(): PerspectiveOfLlm {
  return {
    // LlmObUser - 发给 User 的助手消息
    // LlmObLlm - 自己维护的助手消息和截止时间
    assiMessages: [],
    cutOff: 0,

    // LlmObToolkit - 发给 Toolkit 的工具调用请求
    toolCallRequests: [],

    // LlmObWorkforce - 发给 Workforce 的任务请求
    taskCreateRequests: [],
    messageAppendRequests: [],
    taskCancelRequests: [],
  };
}
