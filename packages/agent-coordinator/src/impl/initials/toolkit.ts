/**
 * Toolkit Actor 的初始状态
 */

import type { PerspectiveOfToolkit } from "@/decl/perspectives";

/**
 * Toolkit Actor 的初始 Perspective（只包含 Toolkit 的输出）
 */
export function initialToolkit(): PerspectiveOfToolkit {
  return {
    // ToolkitObUser & ToolkitObLlm & ToolkitObToolkit - 工具结果缓存
    toolResults: [],
  };
}
