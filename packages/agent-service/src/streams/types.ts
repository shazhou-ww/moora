/**
 * StreamManager 类型定义
 */

import type { PubSub, CancelFn } from "@moora/automata";

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
export type StreamConnection = {
  messageId: string;
  content: string;
  pubsub: PubSub<string>;
  isActive: boolean;
  timeoutId: NodeJS.Timeout | null;
};

/**
 * StreamManager 实例
 */
export type StreamManager = {
  /**
   * 开始流式生成
   */
  startStream: (messageId: string) => void;
  /**
   * 追加 chunk
   */
  appendChunk: (messageId: string, chunk: string) => void;
  /**
   * 结束流式生成
   */
  endStream: (messageId: string, finalContent: string) => void;
  /**
   * 订阅流式更新
   *
   * @param messageId - 消息 ID
   * @param connection - SSE 连接
   * @returns 取消订阅函数，如果流不存在返回 null
   */
  subscribe: (
    messageId: string,
    connection: SSEConnection
  ) => CancelFn | null;
  /**
   * 获取流式消息的当前内容
   */
  getContent: (messageId: string) => string | null;
  /**
   * 检查流是否活跃
   */
  isActive: (messageId: string) => boolean;
};

