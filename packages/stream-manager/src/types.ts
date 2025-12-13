/**
 * Stream Manager 类型定义
 */

import type { CancelFn } from "@moora/pub-sub";

/**
 * SSE 连接状态
 */
export type SSEConnection = {
  queue: string[];
  resolve: (() => void) | null;
  closed: boolean;
};

/**
 * 流式连接状态
 */
export type StreamConnection = {
  messageId: string;
  content: string;
  pubsub: {
    sub: (callback: (data: string) => void) => CancelFn;
    pub: (data: string) => void;
  };
  isActive: boolean;
  timeoutId: NodeJS.Timeout | null;
};

/**
 * Stream Manager 接口
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
   */
  subscribe: (messageId: string, connection: SSEConnection) => CancelFn | null;

  /**
   * 获取流式消息的当前内容
   */
  getContent: (messageId: string) => string | null;

  /**
   * 检查流是否活跃
   */
  isActive: (messageId: string) => boolean;
};