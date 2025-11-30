// ============================================================================
// Handle ReAct Observed - 处理 ReAct Loop 观察输入
// ============================================================================

import type { AgentState, ToolCallRecord, ToolCallRequest } from "../state";
import type { ReActObserved } from "../input";

/**
 * 处理 ReAct Loop 观察输入
 *
 * @internal
 */
export const handleReActObserved = (
  { observation, timestamp, calledLlmAt }: ReActObserved,
  state: AgentState
): AgentState => {
  const currentContext = state.reActContext;

  if (!currentContext) {
    console.warn(
      `[AgentStateMachine] Ignoring re-act-observed without ReAct context`
    );
    return state;
  }

  if (observation.type === "continue-re-act") {
    const nextToolCalls = createToolCallRecords(
      state.toolCalls,
      observation.toolCalls
    );

    return {
      ...state,
      toolCalls: nextToolCalls,
      reActContext: {
        ...currentContext,
        toolCallIds: [
          ...new Set([
            ...currentContext.toolCallIds,
            ...Object.keys(observation.toolCalls),
          ]),
        ],
        updatedAt: timestamp,
      },
      calledLlmAt,
      updatedAt: timestamp,
    };
  }

  return {
    ...state,
    reActContext: null,
    calledLlmAt,
    updatedAt: timestamp,
  };
};

/**
 * 创建 Tool Call 记录
 *
 * @internal
 */
const createToolCallRecords = (
  existing: AgentState["toolCalls"],
  plans: Record<string, ToolCallRequest>
): AgentState["toolCalls"] => {
  let hasNewRecord = false;
  let nextToolCalls: Record<string, ToolCallRecord> | null = null;

  for (const [toolCallId, request] of Object.entries(plans)) {
    if (existing[toolCallId]) {
      continue;
    }

    if (!hasNewRecord) {
      hasNewRecord = true;
      nextToolCalls = { ...existing };
    }

    nextToolCalls![toolCallId] = {
      ...request,
      result: null,
    };
  }

  return (nextToolCalls ?? existing) as AgentState["toolCalls"];
};

