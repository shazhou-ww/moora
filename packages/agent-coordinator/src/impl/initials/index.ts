/**
 * Worldscape 初始状态
 */

import type { Worldscape } from "@/decl";

/**
 * 创建 Worldscape 的初始状态
 *
 * Worldscape = AppearanceOfUser & AppearanceOfLlm & AppearanceOfToolkit & AppearanceOfWorkforce
 *
 * @returns Worldscape 的初始值
 */
export function initialWorldscape(): Worldscape {
  return {
    // === AppearanceOfUser ===
    // UserObUser: 用户消息
    userMessages: [],

    // === AppearanceOfLlm ===
    // LlmObLlm: Llm 自己维护的状态
    assiMessages: [],
    llmProceedCutOff: 0,
    toolCallRequests: [],
    validTasks: [],
    // UserObLlm / WorkforceObLlm: Llm 发起的消息追加请求
    messageAppendRequests: [],

    // === AppearanceOfToolkit ===
    // ToolkitObToolkit: 工具结果
    toolResults: [],

    // === AppearanceOfWorkforce ===
    // UserObWorkforce / LlmObWorkforce: 顶层任务状态
    topLevelTasks: [],
    // WorkforceObWorkforce: 消息投递截止时间
    appendMessageCutOff: 0,
  };
}
