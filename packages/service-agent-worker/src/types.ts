/**
 * @moora/service-agent-worker 全局类型定义
 */

import type { PubSub, CancelFn } from "@moora/pub-sub";

// ============================================================================
// OpenAI 相关类型
// ============================================================================

/**
 * OpenAI Endpoint 配置
 */
export type OpenAIEndpoint = {
  url: string;
  key: string;
};

/**
 * OpenAI 配置
 */
export type OpenAIConfig = {
  endpoint: OpenAIEndpoint;
  model: string;
};

// ============================================================================
// Stream 相关类型
// ============================================================================

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

// ============================================================================
// Service 相关类型
// ============================================================================

/**
 * 创建服务的选项
 */
export type CreateServiceOptions = {
  /**
   * OpenAI 配置
   */
  openai: OpenAIConfig;
  /**
   * System prompt
   */
  prompt: string;
  /**
   * Toolkit 实例（可选，默认使用空 toolkit）
   */
  toolkit?: import("@moora/toolkit").Toolkit;
  /**
   * Tavily API Key（可选，用于启用 Tavily 搜索工具）
   */
  tavilyApiKey?: string;
};
