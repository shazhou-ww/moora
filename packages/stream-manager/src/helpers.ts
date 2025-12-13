/**
 * Stream Manager 辅助函数
 */

import type { SSEConnection } from "./types";

/**
 * 将数据发送到 SSE 连接
 */
export function sendToConnection(connection: SSEConnection, data: string): void {
  if (!connection.closed) {
    connection.queue.push(data);
    if (connection.resolve) {
      connection.resolve();
      connection.resolve = null;
    }
  }
}