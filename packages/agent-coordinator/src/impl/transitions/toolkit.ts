/**
 * Toolkit Actor 状态转换函数
 */

import type {
  AppearanceOfToolkit,
  ActionFromToolkit,
  PerspectiveOfToolkit,
  ReturnToolResult,
} from "@/decl";

/**
 * Toolkit 的状态转换函数
 *
 * 处理 Toolkit 的 Action，更新其 Perspective
 */
export function transitionToolkit(
  appearance: AppearanceOfToolkit,
  action: ActionFromToolkit
): PerspectiveOfToolkit {
  // ActionFromToolkit 目前只有 ReturnToolResult 一种类型
  return handleReturnToolResult(appearance, action);
}

/**
 * 处理工具返回结果
 */
function handleReturnToolResult(
  appearance: AppearanceOfToolkit,
  action: ReturnToolResult
): PerspectiveOfToolkit {
  return {
    // ToolkitObLlm - 保持不变
    toolCallRequests: appearance.toolCallRequests,

    // ToolkitObToolkit - 追加新的工具结果
    toolResults: [
      ...appearance.toolResults,
      {
        toolCallId: action.toolCallId,
        result: action.result,
        timestamp: action.timestamp,
      },
    ],

    // ToolkitObWorkforce - 保持不变
    allTasks: appearance.allTasks,
  };
}
