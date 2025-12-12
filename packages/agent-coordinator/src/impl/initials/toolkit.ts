/**
 * Toolkit Actor 的初始状态
 */

import type { PerspectiveOfToolkit } from "@/decl/perspectives";

/**
 * Toolkit Actor 的初始 Perspective
 */
export function initialToolkit(): PerspectiveOfToolkit {
  return {
    toolCallRequests: [],
    toolResults: [],
    allTasks: {},
  };
}
