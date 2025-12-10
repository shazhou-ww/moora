/**
 * GET /streams/:messageId SSE handler
 *
 * 处理流式消息的 SSE 连接
 */

import { sse } from "elysia";
import type { StreamManager, SSEConnection } from "@/types";

/**
 * 创建 GET /streams/:messageId SSE handler
 *
 * @param streamManager - StreamManager 实例
 * @returns SSE 生成器函数
 */
export function createStreamSSEHandler(streamManager: StreamManager) {
  return function* ({ params }: { params: { messageId: string } }) {
    const { messageId } = params;

    const connection: SSEConnection = {
      queue: [],
      resolve: null,
      closed: false,
    };

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = streamManager.subscribe(messageId, connection);

      if (!unsubscribe) {
        yield sse(JSON.stringify({ type: "error", message: "Stream not found" }));
        return;
      }

      // 先 yield 一个 SSE 消息来确保 Content-Type 正确设置
      // Elysia 根据第一个 yield 的值来决定 Content-Type
      yield sse(JSON.stringify({ type: "connected", messageId }));

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
      connection.closed = true;
      throw error;
    } finally {
      connection.closed = true;
      if (unsubscribe) {
        unsubscribe();
      }
    }
  };
}
