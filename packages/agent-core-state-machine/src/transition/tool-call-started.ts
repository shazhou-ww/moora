// ============================================================================
// Handle Tool Call Started - 处理 Tool Call 开始输入
// ============================================================================

import type { AgentState } from "../state";
import type { ToolCallStarted } from "../input";

/**
 * 处理 Tool Call 开始输入
 *
 * @internal
 */
export const handleToolCallStarted = (
  { toolCallId, name, parameters, timestamp }: ToolCallStarted,
  state: AgentState
): AgentState => {
  // 检查 Tool Call 记录是否已存在
  if (state.toolCalls[toolCallId]) {
    console.warn(
      `[AgentStateMachine] tool-call-started received for existing tool call: ${toolCallId}`
    );
    return state;
  }

  const currentReActContext = state.reActContext;

  // 检查 reActContext 是否存在，ToolCallStarted 必须发生在 ReAct Loop 中
  if (!currentReActContext) {
    console.warn(
      `[AgentStateMachine] tool-call-started received without ReAct context`
    );
    return state;
  }

  // 创建 Tool Call 记录
  const toolCalls = {
    ...state.toolCalls,
    [toolCallId]: {
      name,
      parameters,
      calledAt: timestamp,
      result: null,
    },
  };

  // 更新 toolCallIds
  const toolCallIdSet = new Set([...currentReActContext.toolCallIds, toolCallId]);

  // 更新 reActContext
  const reActContext = {
    ...currentReActContext,
    toolCallIds: Array.from(toolCallIdSet),
    updatedAt: timestamp,
  };


  return {
    ...state,
    toolCalls,
    reActContext,
    // 更新状态时间戳
    updatedAt: timestamp,
  };
};


