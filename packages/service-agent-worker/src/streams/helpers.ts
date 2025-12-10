/**
 * StreamManager 辅助函数
 */

import type { SSEConnection } from "@/types";

/**
 * 发送消息到单个连接
 *
 * @internal
 */
export function sendToConnection(
  connection: SSEConnection,
  data: string
): void {
  if (connection.closed) {
    return;
  }

  connection.queue.push(data);

  if (connection.resolve) {
    connection.resolve();
    connection.resolve = null;
  }
}

