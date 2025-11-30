// ============================================================================
// Reflexor WebUI 类型定义
// ============================================================================

import { z } from "zod";
import type { ReflexorInput, ReflexorState } from "@moora/reflexor-state-machine";
import {
  reflexorInputSchema,
  reflexorStateSchema,
} from "@moora/reflexor-state-machine";

// ============================================================================
// SSE 事件类型
// ============================================================================

/**
 * 收到输入事件
 */
export const inputReceivedEventSchema = z
  .object({
    type: z.literal("input-received"),
    input: reflexorInputSchema,
  })
  .readonly();

export type InputReceivedEvent = z.infer<typeof inputReceivedEventSchema>;

/**
 * 状态更新事件
 */
export const stateUpdatedEventSchema = z
  .object({
    type: z.literal("state-updated"),
    state: reflexorStateSchema,
  })
  .readonly();

export type StateUpdatedEvent = z.infer<typeof stateUpdatedEventSchema>;

/**
 * SSE 事件类型
 *
 * 前端通过 SSE 接收的所有事件类型。
 */
export const sseEventSchema = z.discriminatedUnion("type", [
  inputReceivedEventSchema,
  stateUpdatedEventSchema,
]);

export type SSEEvent = z.infer<typeof sseEventSchema>;

// ============================================================================
// 客户端类型
// ============================================================================

/**
 * 取消订阅函数
 */
export type Unsubscribe = () => void;

/**
 * Reflexor 客户端配置
 */
export type ReflexorClientConfig = {
  /**
   * 服务端 API 基础 URL
   *
   * @example "http://localhost:3000/api/reflexor"
   */
  baseUrl: string;
};

/**
 * Reflexor 客户端
 *
 * 前端用于与 Reflexor Service 通信的客户端。
 */
export type ReflexorClient = {
  /**
   * 获取当前状态
   */
  current: () => ReflexorState | null;

  /**
   * 发送用户输入到服务端
   *
   * @param input - 用户输入（不含 timestamp，由服务端生成）
   * @returns Promise<boolean> 是否发送成功
   */
  send: (
    input: Omit<ReflexorInput, "timestamp">
  ) => Promise<{ success: boolean; timestamp?: number }>;

  /**
   * 订阅状态变化
   *
   * @param handler - 状态变化处理函数
   * @returns 取消订阅函数
   */
  subscribe: (handler: (state: ReflexorState) => void) => Unsubscribe;

  /**
   * 连接到服务端 SSE
   */
  connect: () => void;

  /**
   * 断开 SSE 连接
   */
  disconnect: () => void;

  /**
   * 是否已连接
   */
  isConnected: () => boolean;
};

// ============================================================================
// 乐观渲染相关类型
// ============================================================================

/**
 * 待确认的消息
 */
export type PendingMessage = {
  /**
   * 消息 ID
   */
  messageId: string;

  /**
   * 消息内容
   */
  content: string;

  /**
   * 本地时间戳（用于排序）
   */
  localTimestamp: number;

  /**
   * 是否已确认
   */
  isConfirmed: boolean;
};

/**
 * 乐观渲染状态
 *
 * 用于管理乐观渲染的消息。
 */
export type OptimisticState = {
  /**
   * 待确认的消息列表
   */
  pendingMessages: ReadonlyArray<PendingMessage>;
};

