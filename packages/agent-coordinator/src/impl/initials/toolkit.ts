/**
 * Toolkit Actor 的初始状态
 */

import type { PerspectiveOfToolkit } from "@/decl/perspectives";

/**
 * Toolkit Actor 的初始 Perspective
 */
export function initialToolkit(): PerspectiveOfToolkit {
  return {
    // ToolkitObLlm - 工具调用请求
    toolCallRequests: [],
    // ToolkitObToolkit - 工具结果缓存
    toolResults: [],
  };
}
