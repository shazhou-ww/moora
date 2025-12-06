/**
 * GET /agent SSE handler
 *
 * 处理 Agent 状态的 SSE 连接，发送全量数据和增量 patch
 */

import { sse } from "elysia";
import { createAgent } from "@moora/agent";
import type { ContextOfUser } from "@moora/agent";
import type { AgentSSEConnection } from "../types";

/**
 * 创建 GET /agent SSE handler
 *
 * @param agent - Agent 实例
 * @param connections - SSE 连接集合
 * @returns SSE 生成器函数
 */
export function createAgentSSEHandler(
  agent: ReturnType<typeof createAgent>,
  connections: Set<AgentSSEConnection>
) {
  return function* () {
    console.log("[createAgentSSEHandler] New SSE connection established");

    const connection: AgentSSEConnection = {
      queue: [],
      resolve: null,
      closed: false,
    };

    connections.add(connection);
    console.log("[createAgentSSEHandler] Connection added, total connections:", connections.size);

    try {
      // 发送初始全量数据
      const state = agent.current();
      const context: ContextOfUser = {
        userMessages: state.userMessages,
        assiMessages: state.assiMessages,
      };
      const fullData = JSON.stringify({
        type: "full",
        data: context,
      });
      yield sse(fullData);

      // 保持连接打开，等待后续更新
      while (!connection.closed) {
        yield new Promise<void>((resolve) => {
          connection.resolve = resolve;
          if (connection.queue.length > 0) {
            resolve();
          }
        });

        while (connection.queue.length > 0 && !connection.closed) {
          const data = connection.queue.shift();
          if (data) {
            yield sse(data);
          }
        }
      }
    } catch (error) {
      console.log("[createAgentSSEHandler] Connection error:", error);
      connection.closed = true;
      throw error;
    } finally {
      console.log("[createAgentSSEHandler] Connection closing, removing from set");
      connection.closed = true;
      connections.delete(connection);
      console.log("[createAgentSSEHandler] Connection removed, total connections:", connections.size);
    }
  };
}
