// ============================================================================
// Channel AGENT -> AGENT (Loopback) 的 transition 函数
// ============================================================================

import { create } from "mutative";
import type { OutputFromAgent } from "../types/signal";
import type { StateAgentAgent } from "../types/state";

/**
 * Channel AGENT -> AGENT (Loopback) 的 transition 函数
 * 
 * State 随 Agent 的 Output 变化：
 * - 记录所有 Agent 处理操作到历史中
 * - 记录处理了哪些用户消息和工具结果（用于跟踪处理进度）
 */
export function transitionAgentAgent(
  output: OutputFromAgent,
  state: StateAgentAgent
): StateAgentAgent {
  return create(state, (draft) => {
    draft.processingHistory.push({
      type: output.type,
      toolCallId: output.type === "callTool" ? output.toolCallId : undefined,
      messageId:
        output.type === "sendChunk" || output.type === "completeMessage"
          ? output.messageId
          : undefined,
      processedUserMessageIds:
        (output.type === "sendChunk" || output.type === "completeMessage") &&
        output.processedUserMessageIds
          ? output.processedUserMessageIds
          : undefined,
      processedToolResultIds:
        (output.type === "sendChunk" || output.type === "completeMessage") &&
        output.processedToolResultIds
          ? output.processedToolResultIds
          : undefined,
      timestamp: Date.now(),
    });
  });
}

