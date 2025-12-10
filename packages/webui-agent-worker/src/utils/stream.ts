/**
 * 流式连接工具
 */

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
  const url = `/api/streams/${messageId}`;
  console.debug(`[Stream] Connecting to ${url}`);
  const eventSource = new EventSource(url);

  eventSource.onopen = () => {
    console.debug(`[Stream] Connection opened for messageId: ${messageId}`);
  };

  eventSource.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.debug(`[Stream] Received message for ${messageId}:`, message.type);

      if (message.type === "connected") {
        // 连接确认消息，忽略
        console.debug(`[Stream] Connection confirmed for ${messageId}`);
      } else if (message.type === "initial") {
        console.debug(`[Stream] Initial content length: ${message.content.length}`);
        onInitial(message.content);
      } else if (message.type === "chunk") {
        console.debug(`[Stream] Chunk length: ${message.chunk.length}`);
        onChunk(message.chunk);
      } else if (message.type === "end") {
        console.debug(`[Stream] End content length: ${message.content.length}`);
        onEnd(message.content);
        // 收到结束事件后关闭连接
        eventSource.close();
      } else if (message.type === "error") {
        console.error(`[Stream] Server error: ${message.message}`);
        eventSource.close();
      }
    } catch (error) {
      console.error("Failed to parse stream message:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error(`[Stream] Connection error for ${messageId}:`, error);
    eventSource.close();
  };

  return () => {
    console.debug(`[Stream] Closing connection for messageId: ${messageId}`);
    eventSource.close();
  };
}
