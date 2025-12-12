/**
 * Toolkit Actor 的初始状态
 */

import type { PerspectiveOfToolkit } from "@/decl/perspectives";

/**
 * Toolkit Actor 的初始 Perspective
 */
export function initialToolkit(): PerspectiveOfToolkit {
  return {
    // LlmObToolkit - 从 Llm 接收的工具调用请求
    toolCallRequests: [],

    // ToolkitObToolkit - 自己维护的工具结果缓存
    toolResults: [],

    // ToolkitObLlm - 发给 Llm 的工具结果（与 ToolkitObToolkit 重复）
    // toolResults 已包含

    // ToolkitObUser - 发给 User 的工具结果（与 ToolkitObToolkit 重复）
    // toolResults 已包含

    // WorkforceObToolkit - 从 Workforce 接收的任务信息
    allTasks: {},
  };
}
