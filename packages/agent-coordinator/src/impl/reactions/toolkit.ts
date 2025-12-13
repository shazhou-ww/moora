/**
 * Toolkit Actor Reaction 工厂函数
 */

import type { Dispatch } from "@moora/automata";
import { stateful } from "@moora/effects";
import type { Workforce } from "@moora/workforce";
import type { Actuation } from "@/decl/agent";
import type { PerspectiveOfToolkit } from "@/decl/perspectives";

// ============================================================================
// 类型定义
// ============================================================================

type ToolkitReactionFn = ReturnType<typeof stateful<
  { perspective: PerspectiveOfToolkit; dispatch: Dispatch<Actuation> },
  ToolkitReactionInternalState
>>;

/**
 * Toolkit Reaction 的配置选项
 */
export type ToolkitReactionOptions = {
  /**
   * Workforce 实例，用于查询任务信息
   */
  workforce: Workforce;
};

/**
 * Toolkit Reaction 的内部状态
 */
type ToolkitReactionInternalState = {
  /**
   * 正在执行的 tool call IDs
   */
  executingToolCalls: string[];
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 执行工具调用
 */
async function executeToolCall(
  workforce: Workforce,
  name: string,
  args: string
): Promise<string> {
  try {
    const parsedArgs = JSON.parse(args);

    switch (name) {
      case "query_task": {
        const { taskId } = parsedArgs;
        const task = workforce.getTask(taskId);
        if (!task) {
          return JSON.stringify({ error: `Task ${taskId} not found` });
        }
        return JSON.stringify(task);
      }

      case "list_tasks": {
        const { status } = parsedArgs;
        const allTaskIds = workforce.getAllTaskIds();
        const tasks = allTaskIds
          .map((id) => workforce.getTask(id))
          .filter((task) => task !== undefined);

        const filtered = status
          ? tasks.filter((task) => task!.status === status)
          : tasks;

        return JSON.stringify(filtered);
      }

      case "get_task_children": {
        const { taskId } = parsedArgs;
        const childIds = workforce.getChildTaskIds(taskId);
        const children = childIds
          .map((id) => workforce.getTask(id))
          .filter((task) => task !== undefined);
        return JSON.stringify(children);
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ error: errorMessage });
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建 Toolkit Actor 的 Reaction 函数
 *
 * Toolkit Actor 的 reaction 负责：
 * 1. 监听 toolCallRequests 中未处理的请求
 * 2. 调用 workforce API 查询任务信息
 * 3. dispatch return-tool-result Action
 */
export const createToolkitReaction = (options: ToolkitReactionOptions): ToolkitReactionFn => {
  const { workforce } = options;

  return stateful<
    { perspective: PerspectiveOfToolkit; dispatch: Dispatch<Actuation> },
    ToolkitReactionInternalState
  >({ executingToolCalls: [] }, ({ context: ctx, state, setState }) => {
    const { perspective, dispatch } = ctx;
    const { toolCallRequests, toolResults } = perspective;

    // 找出已经有结果的 tool call IDs
    const completedToolCallIds = new Set(toolResults.map((r) => r.toolCallId));

    // 找出需要执行的 tool calls（没有结果且不在执行中）
    const pendingToolCalls = toolCallRequests.filter(
      (req) =>
        !completedToolCallIds.has(req.toolCallId) &&
        !state.executingToolCalls.includes(req.toolCallId)
    );

    if (pendingToolCalls.length === 0) {
      return;
    }

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

      // eslint-disable-next-line no-undef
      queueMicrotask(async () => {
        const result = await executeToolCall(workforce, name, args);

        // Dispatch tool result
        dispatch({
          type: "return-tool-result",
          toolCallId,
          result,
          timestamp: Date.now(),
        });

        // 从执行中移除
        setState((prev) => ({
          executingToolCalls: prev.executingToolCalls.filter((id) => id !== toolCallId),
        }));
      });
    }
  });
};
