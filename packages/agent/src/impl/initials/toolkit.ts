/**
 * Toolkit Actor 的 Initial 函数实现
 */

import type { StateOfToolkit } from "@/decl/states";

/**
 * Toolkit Actor 的初始状态
 *
 * @returns Toolkit 的初始状态
 */
export function initialToolkit(): StateOfToolkit {
  return {
    toolResults: [],
  };
}
