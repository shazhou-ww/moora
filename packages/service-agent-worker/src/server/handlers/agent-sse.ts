/**
 * GET /agent SSE handler
 *
 * 处理 Agent 状态的 SSE 连接，发送全量数据和增量 patch
 */

import { sse } from "elysia";
import { createAgent } from "@moora/agent-worker";
import type { PerspectiveOfUser } from "@moora/agent-worker";
import type { Subscribe } from "@moora/pub-sub";
import { getLogger } from "@/logger";

const logger = getLogger();

/**
 * SSE 连接状态
 */
type SSEConnectionState = {
  queue: string[];
  resolve: (() => void) | null;
  closed: boolean;
};

/**
 * 创建 GET /agent SSE handler
 *
 * @param agent - Agent 实例
 * @param subscribePatch - 订阅 patch 的回调函数
 * @returns SSE 生成器函数
 */
export function createAgentSSEHandler(
  agent: ReturnType<typeof createAgent>,
  subscribePatch: Subscribe<string>
) {
  return function* () {
    logger.server.debug("Agent SSE: New connection");

    const state: SSEConnectionState = {
      queue: [],
      resolve: null,
      closed: false,
    };

    // 心跳定时器，每 30 秒发送一次心跳保持连接
    const heartbeatInterval = setInterval(() => {
      if (!state.closed) {
        state.queue.push(JSON.stringify({ type: "heartbeat" }));
        if (state.resolve) {
          state.resolve();
          state.resolve = null;
        }
      }
    }, 30000);

    // 订阅 patch
    const unsubscribe = subscribePatch((patch) => {
      logger.server.debug("Agent SSE: Received patch from pubsub");
      if (state.closed) {
        logger.server.debug("Agent SSE: Connection closed, ignoring patch");
        return;
      }

      state.queue.push(patch);
      logger.server.debug(`Agent SSE: Queue length: ${state.queue.length}`);
      if (state.resolve) {
        logger.server.debug("Agent SSE: Resolving pending promise");
        state.resolve();
        state.resolve = null;
      }
    });

    try {
      // 发送初始全量数据
      const worldscape = agent.current();
      const perspective: PerspectiveOfUser = {
        userMessages: worldscape.userMessages,
        assiMessages: worldscape.assiMessages,
        toolCallRequests: worldscape.toolCallRequests,
        toolResults: worldscape.toolResults,
      };
      const fullData = JSON.stringify({
        type: "full",
        data: perspective,
      });
      logger.server.debug("Agent SSE: Sending full data");
      yield sse(fullData);

      // 保持连接打开，等待后续更新
      while (!state.closed) {
        logger.server.debug("Agent SSE: Waiting for updates...");
        yield new Promise<void>((resolve) => {
          state.resolve = resolve;
          if (state.queue.length > 0) {
            logger.server.debug("Agent SSE: Queue not empty, resolving immediately");
            resolve();
          }
        });

        while (state.queue.length > 0 && !state.closed) {
          const data = state.queue.shift();
          if (data) {
            logger.server.debug("Agent SSE: Sending patch data");
            yield sse(data);
          }
        }
      }
    } catch (error) {
      logger.server.error("Agent SSE: Error", error as Record<string, unknown>);
      state.closed = true;
      throw error;
    } finally {
      logger.server.debug("Agent SSE: Connection closed");
      state.closed = true;
      clearInterval(heartbeatInterval);
      unsubscribe();
    }
  };
}
