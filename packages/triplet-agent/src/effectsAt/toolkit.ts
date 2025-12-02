// ============================================================================
// Toolkit 节点的 effectsAt 函数
// ============================================================================

import type { StateForToolkit, EffectOfToolkit } from "../types/effects";

/**
 * Toolkit 节点的 effectsAt 函数
 * 
 * 根据节点的"综合观察"（所有入边 Channel 的 State）推导出要触发的 Effect。
 * Toolkit 的入边：
 * - Channel_AGENT_TOOLKIT: StateAgentToolkit
 * - Channel_TOOLKIT_TOOLKIT (loopback): StateToolkitToolkit
 * 
 * 当有待执行的工具调用时，需要执行工具。
 */
export function effectsAtForToolkit(
  state: StateForToolkit
): Record<string, EffectOfToolkit> {
  const effects: Record<string, EffectOfToolkit> = {};

  // 为每个待执行的工具调用创建 Effect
  for (const toolCall of state.agentToolkit.pendingToolCalls) {
    effects[`tool:${toolCall.toolCallId}`] = {
      kind: "executeTool",
      toolCallId: toolCall.toolCallId,
    };
  }

  return effects;
}

