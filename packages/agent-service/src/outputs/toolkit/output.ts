/**
 * Toolkit Output 函数实现
 *
 * 监听 tool call requests 并执行工具调用，返回结果
 */

import type { Toolkit } from "@moora/toolkit";
import type { PerspectiveOfToolkit, Actuation } from "@moora/agent";
import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";
import { stateful } from "@moora/effects";
import { getLogger } from "@/logger";

const logger = getLogger().toolkit;

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Toolkit Output 的内部状态
 * 用于跟踪正在执行的 tool calls
 */
type ToolkitOutputInternalState = {
  /**
   * 正在执行的 tool call IDs
   */
  executingToolCalls: string[];
};

/**
 * 创建 Toolkit Output 函数的选项
 */
export type CreateToolkitOutputOptions = {
  /**
   * Toolkit 实例
   */
  toolkit: Toolkit;
};

// ============================================================================
// 实现
// ============================================================================

/**
 * 创建 Toolkit Output 函数
 *
 * 监听 PerspectiveOfToolkit 中的 toolCallRequests，对于尚未处理且未在执行中的请求：
 * 1. 调用对应的 tool
 * 2. 将结果 dispatch 为 ToolResult
 *
 * @param options - 创建选项
 * @returns Toolkit Output 函数
 */
export function createToolkitOutput(
  options: CreateToolkitOutputOptions
): Eff<{ perspective: PerspectiveOfToolkit; dispatch: Dispatch<Actuation> }> {
  const { toolkit } = options;

  return stateful<
    { perspective: PerspectiveOfToolkit; dispatch: Dispatch<Actuation> },
    ToolkitOutputInternalState
  >(
    { executingToolCalls: [] },
    ({ context: ctx, state, setState }) => {
      const { perspective, dispatch } = ctx;
      const { toolCallRequests, toolResults } = perspective;

      // 找出已经有结果的 tool call IDs
      const completedToolCallIds = new Set(
        toolResults.map((r) => r.toolCallId)
      );

      // 找出需要执行的 tool calls（没有结果且不在执行中）
      const pendingToolCalls = toolCallRequests.filter(
        (req) =>
          !completedToolCallIds.has(req.toolCallId) &&
          !state.executingToolCalls.includes(req.toolCallId)
      );

      if (pendingToolCalls.length === 0) {
        return;
      }

      logger.debug("Found pending tool calls", {
        count: pendingToolCalls.length,
        toolCallIds: pendingToolCalls.map((t) => t.toolCallId),
      });

      // 将所有 pending tool calls 标记为执行中
      setState((prev) => ({
        executingToolCalls: [
          ...prev.executingToolCalls,
          ...pendingToolCalls.map((t) => t.toolCallId),
        ],
      }));

      // 异步执行每个 tool call
      for (const toolCall of pendingToolCalls) {
        const { toolCallId, name, arguments: args } = toolCall;

        logger.info("Executing tool call", { toolCallId, name, arguments: args });

        queueMicrotask(async () => {
          let result: string;

          try {
            // 检查工具是否存在
            if (!toolkit.hasTool(name)) {
              result = JSON.stringify({
                error: "Tool not found: ${name}",
              });
              logger.warn("Tool not found", { toolCallId, name });
            } else {
              // 执行工具
              logger.debug("Invoking toolkit", { toolCallId, name, argsLength: args.length });
              result = await toolkit.invoke(name, args);
              logger.info("Tool call completed", {
                toolCallId,
                name,
                resultLength: result.length,
              });
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            result = JSON.stringify({ error: errorMessage });
            logger.error("Tool call failed", {
              toolCallId,
              name,
              error: errorMessage,
            });
          }

          // 先 Dispatch tool result，确保 toolResults 更新在 executingToolCalls 更新之前
          // 这样 setState 触发的 reaction 重新执行时，toolResults 已经包含新结果，
          // 不会再次检测该 toolCallId 为 pending
          logger.debug("Dispatching receive-tool-result", {
            toolCallId,
            name,
            resultLength: result.length,
            timestamp: Date.now(),
          });
          dispatch({
            type: "receive-tool-result",
            toolCallId,
            result,
            timestamp: Date.now(),
          });
          logger.debug("Dispatched receive-tool-result", { toolCallId, name });

          // 从执行中移除
          setState((prev) => ({
            executingToolCalls: prev.executingToolCalls.filter(
              (id) => id !== toolCallId
            ),
          }));
          logger.debug("Removed from executingToolCalls", { toolCallId, name });
        });
      }
    }
  );
}