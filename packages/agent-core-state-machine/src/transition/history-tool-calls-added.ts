// ============================================================================
// Handle History Tool Calls Added - 处理加载历史 ToolCall 结果到上下文输入
// ============================================================================

import type { AgentState } from "../state";
import type { HistoryToolCallsAdded } from "../input";

/**
 * 处理加载历史 ToolCall 结果到上下文输入
 *
 * @internal
 */
export const handleHistoryToolCallsAdded = (
  { toolCallIds, timestamp }: HistoryToolCallsAdded,
  state: AgentState
): AgentState => {
  const { reActContext } = state;

  // 检查 reActContext 是否存在
  if (!reActContext) {
    console.warn(
      `[AgentStateMachine] Ignoring history tool calls added without ReAct context`
    );
    return state;
  }

  return {
    ...state,
    reActContext: {
      ...reActContext,

      // 把 input.toolCallIds 添加到 reActContext.toolCallIds 中，去重
      toolCallIds: [
        ...new Set([
          ...reActContext.toolCallIds,
          ...toolCallIds,
        ]),
      ],

      // 更新 reActContext 时间戳
      updatedAt: timestamp,
    },

    // 更新状态时间戳
    updatedAt: timestamp,
  };
};
