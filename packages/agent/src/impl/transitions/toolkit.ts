/**
 * Toolkit Actor 的 Transition 函数实现
 */

import type { StateOfToolkit } from "@/decl/states";
import type { InputFromToolkit, ToolResult } from "@/decl/inputs";

/**
 * Toolkit Actor 的状态转换函数
 *
 * 根据 Input 更新 Toolkit 的状态。
 * 这是一个纯函数，不产生副作用。
 *
 * @param input - Toolkit 的输入
 * @returns 状态转换函数
 */
export function transitionToolkit(
  input: InputFromToolkit
): (state: StateOfToolkit) => StateOfToolkit {
  return (state: StateOfToolkit) => {
    if (input.type === "tool-result") {
      return transitionToolkitResult(input)(state);
    }
    return state;
  };
}

/**
 * 处理工具执行结果的转换
 */
function transitionToolkitResult(
  input: ToolResult
): (state: StateOfToolkit) => StateOfToolkit {
  return (state: StateOfToolkit) => {
    return {
      ...state,
      toolResults: [
        ...state.toolResults,
        {
          toolCallId: input.toolCallId,
          result: input.result,
          timestamp: input.timestamp,
        },
      ],
    };
  };
}
