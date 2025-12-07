/**
 * Llm Actor 的 Initial 函数实现
 */

import type { StateOfLlm } from "@/decl/states";

/**
 * Llm Actor 的初始状态
 *
 * @returns Llm 的初始状态
 */
export function initialLlm(): StateOfLlm {
  return {
    assiMessages: [],
    cutOff: 0,
    toolCallRequests: [],
  };
}
