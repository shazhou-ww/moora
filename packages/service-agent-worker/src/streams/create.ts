/**
 * 创建 StreamManager 实例
 */

import { createPubSub } from "@moora/pub-sub";
import type { CancelFn } from "@moora/pub-sub";
import type { SSEConnection, StreamConnection, StreamManager } from "@/types";
import { sendToConnection } from "./helpers";
import { getLogger } from "@/logger";

const logger = getLogger().stream;

/**
 * 创建 StreamManager 实例
 *
 * 管理所有流式消息的连接和 chunk 分发
 *
 * @param timeoutMs - 流式连接超时时间（毫秒），默认 5 分钟
 * @returns StreamManager 实例
 *
 * @example
 * ```typescript
 * const streamManager = createStreamManager();
 * streamManager.startStream("message-123");
 * streamManager.appendChunk("message-123", "Hello");
 * streamManager.endStream("message-123", "Hello World");
 * ```
 */
export function createStreamManager(
  timeoutMs: number = 5 * 60 * 1000
): StreamManager {
  const streams = new Map<string, StreamConnection>();

  /**
   * 清理流
   *
   * @internal
   */
  const cleanupStream = (messageId: string): void => {
    const stream = streams.get(messageId);

    if (!stream) {
      return;
    }

    if (stream.timeoutId) {
      clearTimeout(stream.timeoutId);
    }

    streams.delete(messageId);
  };

  /**
   * 重置超时
   *
   * @internal
   */
  const resetTimeout = (messageId: string): void => {
    const stream = streams.get(messageId);

    if (!stream) {
      return;
    }

    if (stream.timeoutId) {
      clearTimeout(stream.timeoutId);
    }

    stream.timeoutId = setTimeout(() => {
      cleanupStream(messageId);
    }, timeoutMs);
  };

  /**
   * 开始流式生成
   */
  const startStream = (messageId: string): void => {
    const connection: StreamConnection = {
      messageId,
      content: "",
      pubsub: createPubSub<string>(),
      isActive: true,
      timeoutId: null,
    };

    streams.set(messageId, connection);
    resetTimeout(messageId);
  };

  /**
   * 追加 chunk
   */
  const appendChunk = (messageId: string, chunk: string): void => {
    const stream = streams.get(messageId);

    if (!stream) {
      logger.debug("Stream not found, chunk ignored", { messageId });
      return;
    }

    stream.content += chunk;

    const chunkData = JSON.stringify({
      type: "chunk",
      chunk,
    });

    stream.pubsub.pub(chunkData);
    resetTimeout(messageId);
  };

  /**
   * 结束流式生成
   */
  const endStream = (messageId: string, finalContent: string): void => {
    const stream = streams.get(messageId);

    if (!stream) {
      logger.debug("Stream not found, endStream ignored", { messageId });
      return;
    }

    stream.content = finalContent;
    stream.isActive = false;

    const endData = JSON.stringify({
      type: "end",
      content: finalContent,
    });

    stream.pubsub.pub(endData);

    if (stream.timeoutId) {
      clearTimeout(stream.timeoutId);
      stream.timeoutId = null;
    }

    setTimeout(() => {
      cleanupStream(messageId);
    }, 1000);
  };

  /**
   * 订阅流式更新
   */
  const subscribe = (
    messageId: string,
    connection: SSEConnection
  ): CancelFn | null => {
    const stream = streams.get(messageId);

    if (!stream) {
      logger.warn("Stream not found, connection closed", { messageId });
      connection.closed = true;
      if (connection.resolve) {
        connection.resolve();
      }
      return null;
    }

    resetTimeout(messageId);

    // 订阅 pubsub，handler 将数据推送到 connection.queue
    const unsubscribe = stream.pubsub.sub((data: string) => {
      if (!connection.closed) {
        sendToConnection(connection, data);
      }
    });

    // 发送当前已累积的内容（如果存在）
    if (stream.content) {
      const initialData = JSON.stringify({
        type: "initial",
        content: stream.content,
        isActive: stream.isActive,
      });

      sendToConnection(connection, initialData);
    }

    return unsubscribe;
  };

  /**
   * 获取流式消息的当前内容
   */
  const getContent = (messageId: string): string | null => {
    const stream = streams.get(messageId);
    return stream ? stream.content : null;
  };

  /**
   * 检查流是否活跃
   */
  const isActive = (messageId: string): boolean => {
    const stream = streams.get(messageId);
    return stream ? stream.isActive : false;
  };

  return {
    startStream,
    appendChunk,
    endStream,
    subscribe,
    getContent,
    isActive,
  };
}

