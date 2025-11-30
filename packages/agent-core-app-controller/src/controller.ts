// ============================================================================
// Controller - Agent Controller 实现
// ============================================================================

import type {
  AgentController,
  AgentAppState,
  AgentAppEvent,
} from "@moora/agent-webui-protocol";
import type { AgentState, AgentInput } from "@moora/agent-core-state-machine";
import type { Unsubscribe } from "@moora/moorex";
import type { CreateAgentControllerOptions } from "./types";
import { createPubSub } from "@moora/moorex";
import { createSSEConnection, sendInputToServer } from "./api";
import { mapAppState } from "./map-app-state";
import { interpretAppEvent } from "./interpret-app-event";

/**
 * 创建 Agent Controller
 *
 * @param options - 创建选项
 * @param mapAppStateFn - 状态映射函数（可选，默认使用内置的 mapAppState）
 * @param interpretAppEventFn - 事件解释函数（可选，默认使用内置的 interpretAppEvent）
 * @returns Agent Controller 实例
 *
 * @example
 * ```typescript
 * const controller = createAgentController({
 *   endpoint: "http://localhost:3000/api/agent",
 * });
 *
 * controller.subscribe((state) => {
 *   console.log("State updated:", state);
 * });
 *
 * controller.notify({
 *   type: "user-message",
 *   content: "Hello, Agent!",
 *   taskHints: [],
 * });
 * ```
 */
export function createAgentController(
  options: CreateAgentControllerOptions,
  mapAppStateFn: (state: AgentState) => AgentAppState = mapAppState,
  interpretAppEventFn: (event: AgentAppEvent) => AgentInput[] = interpretAppEvent
): AgentController {
  const { endpoint } = options;

  // 当前状态
  let currentState: AgentAppState = {
    updatedAt: Date.now(),
    messages: [],
    tasks: [],
  };

  // 状态发布订阅系统
  const statePubSub = createPubSub<AgentAppState>();

  // 处理状态更新
  const handleStateUpdate = (agentState: AgentState) => {
    currentState = mapAppStateFn(agentState);
    statePubSub.pub(currentState);
  };

  // 创建 SSE 连接
  const sseConnection = createSSEConnection(endpoint, handleStateUpdate);

  // 初始连接
  sseConnection.connect();

  // 处理错误
  const handleError = (error: string) => {
    // 错误通过消息方式告知用户，而不是单独的 error 字段
    // 这里可以记录错误日志，但不更新状态
    console.error("Agent controller error:", error);
  };

  return {
    subscribe: (handler: (state: AgentAppState) => void): Unsubscribe => {
      // 立即发送当前状态
      handler(currentState);

      // 订阅后续更新
      return statePubSub.sub(handler);
    },

    notify: (event: AgentAppEvent): void => {
      const inputs = interpretAppEventFn(event);

      // 发送输入
      sendInputToServer(endpoint, inputs, handleError);
    },
  };
}

