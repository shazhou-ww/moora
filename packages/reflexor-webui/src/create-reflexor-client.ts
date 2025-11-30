// ============================================================================
// 创建 Reflexor 客户端
// ============================================================================

import { createReflexorTransition } from "@moora/reflexor-state-machine";
import type { ReflexorInput, ReflexorState } from "@moora/reflexor-state-machine";
import type {
  ReflexorClient,
  ReflexorClientConfig,
  Unsubscribe,
} from "./types";
import { sseEventSchema } from "./types";

/**
 * 创建 Reflexor 客户端
 *
 * @param config - 客户端配置
 * @returns Reflexor 客户端实例
 *
 * @example
 * ```typescript
 * const client = createReflexorClient({
 *   baseUrl: "http://localhost:3000/api/reflexor",
 * });
 *
 * // 连接到服务端
 * client.connect();
 *
 * // 订阅状态变化
 * const unsubscribe = client.subscribe((state) => {
 *   console.log("State updated:", state);
 * });
 *
 * // 发送消息
 * await client.send({
 *   type: "user-send-message",
 *   messageId: "msg-1",
 *   content: "Hello",
 * });
 *
 * // 断开连接
 * client.disconnect();
 * ```
 */
export const createReflexorClient = (
  config: ReflexorClientConfig
): ReflexorClient => {
  const { baseUrl } = config;

  let currentState: ReflexorState | null = null;
  let eventSource: EventSource | null = null;
  const subscribers = new Set<(state: ReflexorState) => void>();
  const transition = createReflexorTransition();

  /**
   * 通知所有订阅者状态变化
   */
  const notifySubscribers = (state: ReflexorState): void => {
    for (const handler of subscribers) {
      handler(state);
    }
  };

  /**
   * 处理 SSE 事件
   */
  const handleSSEEvent = (eventData: string): void => {
    try {
      const parsed = JSON.parse(eventData) as unknown;
      const result = sseEventSchema.safeParse(parsed);

      if (!result.success) {
        console.warn("Invalid SSE event:", result.error);
        return;
      }

      const event = result.data;

      switch (event.type) {
        case "state-updated":
          // 直接使用服务端的状态
          currentState = event.state;
          notifySubscribers(currentState);
          break;

        case "input-received":
          // 使用 transition 更新本地状态
          if (currentState) {
            currentState = transition(event.input)(currentState);
            notifySubscribers(currentState);
          }
          break;
      }
    } catch (error) {
      console.error("Error parsing SSE event:", error);
    }
  };

  /**
   * 连接到服务端 SSE
   */
  const connect = (): void => {
    if (eventSource) {
      return;
    }

    eventSource = new EventSource(baseUrl);

    eventSource.onmessage = (event) => {
      handleSSEEvent(event.data);
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
    };
  };

  /**
   * 断开 SSE 连接
   */
  const disconnect = (): void => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  /**
   * 获取当前状态
   */
  const current = (): ReflexorState | null => {
    return currentState;
  };

  /**
   * 发送用户输入到服务端
   */
  const send = async (
    input: Omit<ReflexorInput, "timestamp">
  ): Promise<{ success: boolean; timestamp?: number }> => {
    try {
      // 添加临时时间戳（会被服务端覆盖）
      const inputWithTimestamp = {
        ...input,
        timestamp: Date.now(),
      };

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputWithTimestamp),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to send input:", error);
        return { success: false };
      }

      const result = await response.json() as { success: boolean; timestamp?: number };
      return result;
    } catch (error) {
      console.error("Error sending input:", error);
      return { success: false };
    }
  };

  /**
   * 订阅状态变化
   */
  const subscribe = (handler: (state: ReflexorState) => void): Unsubscribe => {
    subscribers.add(handler);

    // 如果已有状态，立即通知
    if (currentState) {
      handler(currentState);
    }

    return () => {
      subscribers.delete(handler);
    };
  };

  /**
   * 是否已连接
   */
  const isConnected = (): boolean => {
    return eventSource !== null && eventSource.readyState === EventSource.OPEN;
  };

  return {
    current,
    send,
    subscribe,
    connect,
    disconnect,
    isConnected,
  };
};

