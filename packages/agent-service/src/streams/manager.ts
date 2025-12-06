/**
 * StreamManager - 管理流式消息的连接和分发
 */

/**
 * SSE 连接
 */
export type SSEConnection = {
  queue: string[];
  resolve: (() => void) | null;
  closed: boolean;
};

/**
 * 流式消息连接
 */
type StreamConnection = {
  messageId: string;
  content: string;
  connections: Set<SSEConnection>;
  isActive: boolean;
  timeoutId: NodeJS.Timeout | null;
};

/**
 * StreamManager 类
 *
 * 管理所有流式消息的连接和 chunk 分发
 */
export class StreamManager {
  private streams: Map<string, StreamConnection>;
  private readonly timeoutMs: number;

  /**
   * 创建 StreamManager 实例
   *
   * @param timeoutMs - 流式连接超时时间（毫秒），默认 5 分钟
   */
  constructor(timeoutMs: number = 5 * 60 * 1000) {
    this.streams = new Map();
    this.timeoutMs = timeoutMs;
  }

  /**
   * 开始流式生成
   *
   * @param messageId - 消息 ID
   */
  startStream(messageId: string): void {
    const connection: StreamConnection = {
      messageId,
      content: "",
      connections: new Set(),
      isActive: true,
      timeoutId: null,
    };

    this.streams.set(messageId, connection);
    this.resetTimeout(messageId);
  }

  /**
   * 追加 chunk
   *
   * @param messageId - 消息 ID
   * @param chunk - 内容块
   */
  appendChunk(messageId: string, chunk: string): void {
    const stream = this.streams.get(messageId);

    if (!stream) {
      console.warn(`Stream not found for messageId: ${messageId}`);
      return;
    }

    // 更新累积内容
    stream.content += chunk;

    // 分发到所有连接
    const chunkData = JSON.stringify({
      type: "chunk",
      chunk,
    });

    this.broadcastToConnections(stream.connections, chunkData);
    this.resetTimeout(messageId);
  }

  /**
   * 结束流式生成
   *
   * @param messageId - 消息 ID
   * @param finalContent - 最终完整内容
   */
  endStream(messageId: string, finalContent: string): void {
    const stream = this.streams.get(messageId);

    if (!stream) {
      console.warn(`Stream not found for messageId: ${messageId}`);
      return;
    }

    // 更新最终内容
    stream.content = finalContent;
    stream.isActive = false;

    // 发送结束事件
    const endData = JSON.stringify({
      type: "end",
      content: finalContent,
    });

    this.broadcastToConnections(stream.connections, endData);

    // 清理超时
    if (stream.timeoutId) {
      clearTimeout(stream.timeoutId);
      stream.timeoutId = null;
    }

    // 延迟清理（给客户端时间接收结束事件）
    setTimeout(() => {
      this.cleanupStream(messageId);
    }, 1000);
  }

  /**
   * 订阅流式更新
   *
   * @param messageId - 消息 ID
   * @param connection - SSE 连接
   */
  subscribe(messageId: string, connection: SSEConnection): void {
    const stream = this.streams.get(messageId);

    if (!stream) {
      console.warn(`Stream not found for messageId: ${messageId}`);
      return;
    }

    stream.connections.add(connection);
    this.resetTimeout(messageId);

    // 发送当前已累积的内容（如果存在）
    if (stream.content) {
      const initialData = JSON.stringify({
        type: "initial",
        content: stream.content,
        isActive: stream.isActive,
      });

      this.sendToConnection(connection, initialData);
    }
  }

  /**
   * 取消订阅
   *
   * @param messageId - 消息 ID
   * @param connection - SSE 连接
   */
  unsubscribe(messageId: string, connection: SSEConnection): void {
    const stream = this.streams.get(messageId);

    if (!stream) {
      return;
    }

    stream.connections.delete(connection);

    // 如果没有连接了，清理流
    if (stream.connections.size === 0) {
      this.cleanupStream(messageId);
    }
  }

  /**
   * 获取流式消息的当前内容
   *
   * @param messageId - 消息 ID
   * @returns 当前内容，如果不存在返回 null
   */
  getContent(messageId: string): string | null {
    const stream = this.streams.get(messageId);
    return stream ? stream.content : null;
  }

  /**
   * 检查流是否活跃
   *
   * @param messageId - 消息 ID
   * @returns 是否活跃
   */
  isActive(messageId: string): boolean {
    const stream = this.streams.get(messageId);
    return stream ? stream.isActive : false;
  }

  /**
   * 重置超时
   *
   * @param messageId - 消息 ID
   */
  private resetTimeout(messageId: string): void {
    const stream = this.streams.get(messageId);

    if (!stream) {
      return;
    }

    // 清除旧的超时
    if (stream.timeoutId) {
      clearTimeout(stream.timeoutId);
    }

    // 设置新的超时
    stream.timeoutId = setTimeout(() => {
      this.cleanupStream(messageId);
    }, this.timeoutMs);
  }

  /**
   * 清理流
   *
   * @param messageId - 消息 ID
   */
  private cleanupStream(messageId: string): void {
    const stream = this.streams.get(messageId);

    if (!stream) {
      return;
    }

    // 关闭所有连接
    stream.connections.forEach((connection) => {
      connection.closed = true;
      if (connection.resolve) {
        connection.resolve();
      }
    });

    // 清除超时
    if (stream.timeoutId) {
      clearTimeout(stream.timeoutId);
    }

    // 从 Map 中移除
    this.streams.delete(messageId);
  }

  /**
   * 广播消息到所有连接
   *
   * @param connections - 连接集合
   * @param data - 数据
   */
  private broadcastToConnections(
    connections: Set<SSEConnection>,
    data: string
  ): void {
    connections.forEach((connection) => {
      if (!connection.closed) {
        this.sendToConnection(connection, data);
      }
    });
  }

  /**
   * 发送消息到单个连接
   *
   * @param connection - SSE 连接
   * @param data - 数据
   */
  private sendToConnection(connection: SSEConnection, data: string): void {
    if (connection.closed) {
      return;
    }

    connection.queue.push(data);

    if (connection.resolve) {
      connection.resolve();
      connection.resolve = null;
    }
  }
}
