// ============================================================================
// Map App State - 状态映射函数
// ============================================================================

import type { AgentAppState } from "@moora/agent-webui-protocol";
import type { AgentState } from "@moora/agent-core-state-machine";

/**
 * 将 AgentState 映射为 AgentAppState
 *
 * @param state - Agent 内部状态
 * @returns 用户可见的应用状态
 *
 * @example
 * ```typescript
 * const agentState: AgentState = {
 *   messages: [{ id: "msg-1", role: "user", content: "Hello", receivedAt: Date.now(), taskIds: [] }],
 *   tools: {},
 *   toolCalls: {},
 *   reActContext: { contextWindowSize: 10, toolCallIds: [], startedAt: Date.now(), updatedAt: Date.now() },
 * };
 *
 * const appState = mapAppState(agentState);
 * // { messages: [...], tasks: [] }
 * ```
 */
export function mapAppState(state: AgentState): AgentAppState {
  // 转换消息格式：messages 已经是按 receivedAt 排序的数组
  const messages = state.messages.map((msg) => {
    if (msg.role === "user") {
      return {
        id: msg.id,
        role: "user" as const,
        content: msg.content,
        receivedAt: msg.receivedAt,
        taskIds: msg.taskIds,
      };
    } else {
      return {
        id: msg.id,
        role: "assistant" as const,
        content: msg.content,
        receivedAt: msg.receivedAt,
        updatedAt: msg.updatedAt,
        streaming: msg.streaming ?? false,
        taskIds: msg.taskIds,
      };
    }
  });

  // TODO: task 相关的功能 agent-core-state-machine 暂时没支持
  // 从消息中提取所有 taskIds，然后构建 tasks
  // 注意：新版的 AgentState 中没有直接的 tasks 字段
  // 我们需要从 messages 的 taskIds 中推断任务
  // 这里暂时返回空数组，因为任务信息可能需要从其他地方获取
  // 或者需要根据业务逻辑从 messages 中推断
  const tasks: AgentAppState["tasks"] = [];

  return {
    updatedAt: state.updatedAt,
    messages,
    tasks,
  };
}

