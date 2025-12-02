// ============================================================================
// Agent 节点的 effectsAt 函数
// ============================================================================

import type { StateForAgent, EffectOfAgent } from "../types/effects";

/**
 * Agent 节点的 effectsAt 函数
 * 
 * 根据节点的"综合观察"（所有入边 Channel 的 State）推导出要触发的 Effect。
 * Agent 的入边：
 * - Channel_USER_AGENT: StateUserAgent
 * - Channel_TOOLKIT_AGENT: StateToolkitAgent
 * - Channel_AGENT_AGENT (loopback): StateAgentAgent
 * - Channel_AGENT_TOOLKIT: StateAgentToolkit（用于查找 tool call 请求信息）
 * 
 * 当有新的用户消息或工具执行结果时，需要调用 LLM。
 * 通过检查 processingHistory 来判断哪些输入已经被处理过。
 */
export function effectsAtForAgent(
  state: StateForAgent
): Record<string, EffectOfAgent> {
  // 收集所有已处理的用户消息 ID 和工具结果 ID
  const processedUserMessageIds = new Set<string>();
  const processedToolResultIds = new Set<string>();
  
  for (const historyItem of state.agentAgent.processingHistory) {
    if (historyItem.processedUserMessageIds) {
      for (const id of historyItem.processedUserMessageIds) {
        processedUserMessageIds.add(id);
      }
    }
    if (historyItem.processedToolResultIds) {
      for (const id of historyItem.processedToolResultIds) {
        processedToolResultIds.add(id);
      }
    }
  }

  // 检查是否有未处理的用户消息
  const hasUnprocessedUserMessages = state.userAgent.userMessages.some(
    (msg) => !processedUserMessageIds.has(msg.id)
  );

  // 检查是否有未处理的工具结果
  const hasUnprocessedToolResults = state.toolkitAgent.toolResults.some(
    (result) => !processedToolResultIds.has(result.toolCallId)
  );

  // 如果有未处理的输入，需要调用 LLM
  if (hasUnprocessedUserMessages || hasUnprocessedToolResults) {
    return { agent: { kind: "callLLM" } };
  }

  return {};
}

