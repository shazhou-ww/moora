// ============================================================================
// App Controller 辅助函数
// ============================================================================

import type { AgentState, AgentInput } from "@moora/agent-core-state-machine";

/**
 * SSE 连接管理器
 * @internal
 */
export type SSEConnection = {
  connect: () => void;
  close: () => void;
};

/**
 * 创建 SSE 连接管理器
 * @internal
 */
export const createSSEConnection = (
  endpoint: string,
  onStateUpdate: (state: AgentState) => void
): SSEConnection => {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 处理 state-updated 事件
        if (data.type === "state-updated") {
          const agentState: AgentState = data.state;
          onStateUpdate(agentState);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      // 尝试重连
      if (eventSource?.readyState === EventSource.CLOSED) {
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 1000);
      }
    };
  };

  const close = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  return {
    connect,
    close,
  };
};

/**
 * 发送输入到服务端
 * @internal
 */
export const sendInputToServer = async (
  endpoint: string,
  inputs: AgentInput[],
  onError: (error: string) => void
): Promise<void> => {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputs),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending input:", error);
    onError(errorMessage);
  }
};

