/**
 * Toolkit Actor 状态转换函数
 */

import type {
  AppearanceOfToolkit,
  ActionFromToolkit,
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
): Partial<AppearanceOfToolkit> {
  // ActionFromToolkit 目前只有 ReturnToolResult 一种类型
  return handleReturnToolResult(appearance, action);
}

/**
 * 处理工具返回结果
 */
function handleReturnToolResult(
  appearance: AppearanceOfToolkit,
  action: ReturnToolResult
): Partial<AppearanceOfToolkit> {
  return {
    // ToolkitObUser & ToolkitObLlm & ToolkitObToolkit - 追加新的工具结果
    toolResults: [
      ...appearance.toolResults,
      {
        toolCallId: action.toolCallId,
        result: action.result,
        timestamp: action.timestamp,
      },
    ],
  };
}
