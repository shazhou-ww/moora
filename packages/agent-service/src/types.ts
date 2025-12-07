/**
 * @moora/agent-service 全局类型定义
 */

import type { PubSub, CancelFn } from "@moora/automata";
import type OpenAI from "openai";
import type { UserMessage, AssiMessage, ToolCallRequest, ToolResult } from "@moora/agent";

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

/**
 * OpenAI 消息类型
 */
export type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Streaming LLM Call 的选项
 */
export type StreamLlmCallOptions = {
  /**
   * OpenAI 客户端
   */
  openai: OpenAI;
  /**
   * 模型名称
   */
  model: string;
  /**
   * System prompt
   */
  prompt: string;
  /**
   * 用户消息列表
   */
  userMessages: UserMessage[];
  /**
   * 助手消息列表
   */
  assiMessages: AssiMessage[];
  /**
   * Toolkit 实例（可选）
   */
  toolkit?: import("@moora/toolkit").Toolkit;
  /**
   * 工具调用请求列表
   */
  toolCallRequests: ToolCallRequest[];
  /**
   * 工具执行结果列表
   */
  toolResults: ToolResult[];
  /**
   * StreamManager 实例
   */
  streamManager: StreamManager;
  /**
   * 消息 ID
   */
  messageId: string;
  /**
   * 在收到第一个 chunk 时的回调
   */
  onFirstChunk?: () => void;
};

/**
 * 流式 LLM 调用结果中的 tool call 信息
 */
export type LlmToolCall = {
  id: string;
  name: string;
  arguments: string;
};

/**
 * 流式 LLM 调用的结果
 */
export type StreamLlmCallResult = {
  /**
   * 文本内容（如果 LLM 只返回 tool_calls，则为空字符串）
   */
  content: string;
  /**
   * 工具调用列表（如果没有工具调用，则为空数组）
   */
  toolCalls: LlmToolCall[];
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

/**
 * 创建 LLM Output 函数的选项
 */
export type CreateLlmOutputOptions = {
  /**
   * OpenAI 客户端配置
   */
  openai: OpenAIConfig;
  /**
   * System prompt
   */
  prompt: string;
  /**
   * StreamManager 实例
   */
  streamManager: StreamManager;
  /**
   * Toolkit 实例（可选）
   */
  toolkit?: import("@moora/toolkit").Toolkit;
};

