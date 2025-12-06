/**
 * 流式连接工具
 */

import type { StreamMessageEvent } from "@/types";

/**
 * 创建流式连接
 *
 * @param messageId - 消息 ID
 * @param onInitial - 初始数据回调
 * @param onChunk - Chunk 数据回调
 * @param onEnd - 结束回调
 * @returns 关闭连接的函数
 */
export function createStreamConnection(
  messageId: string,
  onInitial: (content: string) => void,
  onChunk: (chunk: string) => void,
  onEnd: (content: string) => void
): () => void {
  const eventSource = new EventSource(`/api/streams/${messageId}`);

  eventSource.onmessage = (event) => {
    try {
      const message: StreamMessageEvent = JSON.parse(event.data);

      if (message.type === "initial") {
        onInitial(message.content);
      } else if (message.type === "chunk") {
        onChunk(message.chunk);
      } else if (message.type === "end") {
        onEnd(message.content);
        // 收到结束事件后关闭连接
        eventSource.close();
      }
    } catch (error) {
      console.error("Failed to parse stream message:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error("Stream connection error:", error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}
