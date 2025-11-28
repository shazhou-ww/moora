// ============================================================================
// App Controller Mappers - 状态和事件映射函数
// ============================================================================

import type { AgentAppState, AgentAppEvent } from "@moora/agent-webui-protocol";
import type { AgentState, AgentInput } from "@moora/agent-core-state-machine";

/**
 * 将 AgentState 映射为 AgentAppState
 * 
 * @param state - Agent 内部状态
 * @returns 用户可见的应用状态
 * 
 * @example
 * ```typescript
 * const agentState: AgentState = {
 *   phase: 'processing',
 *   messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
 *   llmHistory: [],
 *   toolHistory: [],
 * };
 * 
 * const appState = mapAppState(agentState);
 * // { status: 'thinking', messages: [...], isProcessing: true }
 * ```
 */
export const mapAppState = (state: AgentState): AgentAppState => {
  // 转换消息格式
  const messages = state.messages.map((msg) => {
    if (msg.role === "user") {
      return {
        id: msg.id,
        role: "user" as const,
        content: msg.content,
        timestamp: msg.timestamp,
        taskIds: msg.taskIds,
      };
    } else {
      return {
        id: msg.id,
        role: "assistant" as const,
        content: msg.content,
        timestamp: msg.timestamp,
        streaming: msg.streaming ?? false,
        taskIds: msg.taskIds,
      };
    }
  });

  // 转换 tasks 格式（移除 requestId 字段，因为这是内部字段）
  const tasks = state.tasks.map((task) => ({
    id: task.id,
    status: task.status,
    summary: task.summary,
  }));

  return {
    messages,
    tasks,
  };
};

/**
 * 将 AgentAppEvent 解释为 AgentInput 数组
 * 
 * @param event - 应用事件
 * @returns Agent 输入信号数组
 * 
 * @example
 * ```typescript
 * const event: AgentAppEvent = {
 *   type: 'user-message',
 *   content: 'Hello',
 * };
 * 
 * const inputs = interpretAppEvent(event);
 * // [{ type: 'user-message', requestId: '...', content: 'Hello' }]
 * ```
 */
export const interpretAppEvent = (event: AgentAppEvent): AgentInput[] => {
  switch (event.type) {
    case "user-message": {
      const requestId = `req-${Date.now()}-${Math.random()}`;
      return [
        {
          type: "user-message",
          requestId,
          content: event.content,
          taskHints: event.taskHints,
        },
      ];
    }

    case "cancel-task": {
      return [
        {
          type: "cancel-task",
          taskId: event.taskId,
        },
      ];
    }

    case "update-task-summary": {
      return [
        {
          type: "update-task-summary",
          taskId: event.taskId,
          summary: event.summary,
        },
      ];
    }

    default: {
      return [];
    }
  }
};

