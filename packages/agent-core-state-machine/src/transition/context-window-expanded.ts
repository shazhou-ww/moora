// ============================================================================
// Handle Context Window Expanded - 处理扩展上下文窗口输入
// ============================================================================

import type { AgentState } from "../state";
import type { ContextWindowExpanded } from "../input";

/**
 * 处理扩展上下文窗口输入
 *
 * @internal
 */
export const handleContextWindowExpanded = (
  { timestamp }: ContextWindowExpanded,
  state: AgentState,
  expandContextWindowSize: number
): AgentState => {
  const { reActContext } = state;

  // 检查 reActContext 是否存在
  if (!reActContext) {
    console.warn(
      `[AgentStateMachine] Ignoring context window expanded without ReAct context`
    );
    return state;
  }

  return {
    ...state,
    reActContext: {
      ...reActContext,

      // 扩展上下文窗口大小，但不超过消息列表长度
      contextWindowSize: Math.min(
        reActContext.contextWindowSize + expandContextWindowSize,
        state.messages.length
      ),

      // 更新 reActContext 时间戳
      updatedAt: timestamp,
    },

    // 更新状态时间戳
    updatedAt: timestamp,
  };
};


