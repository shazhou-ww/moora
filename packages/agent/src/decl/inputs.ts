/**
 * Inputs 类型定义
 *
 * 定义各个 Actor 可以 dispatch 的 Input 类型
 */

import { z } from "zod";

// ============================================================================
// Input Schema 定义
// ============================================================================

/**
 * 发送用户消息 Input Schema
 */
export const sendUserMessageSchema = z.object({
  type: z.literal("send-user-message"),
  id: z.string(),
  content: z.string(),
  timestamp: z.number(),
});

export type SendUserMessage = z.infer<typeof sendUserMessageSchema>;

/**
 * 开始流式生成助手消息 Input Schema
 */
export const startAssiMessageStreamSchema = z.object({
  type: z.literal("start-assi-message-stream"),
  id: z.string(),
  timestamp: z.number(),
  /**
   * 这次 llm 请求所处理的最迟的用户消息时间戳，用于更新 cutOff
   */
  cutOff: z.number(),
});

export type StartAssiMessageStream = z.infer<typeof startAssiMessageStreamSchema>;

/**
 * 结束流式生成助手消息 Input Schema
 */
export const endAssiMessageStreamSchema = z.object({
  type: z.literal("end-assi-message-stream"),
  id: z.string(),
  content: z.string(),
  timestamp: z.number(),
});

export type EndAssiMessageStream = z.infer<typeof endAssiMessageStreamSchema>;

// ============================================================================
// Actor Input 类型定义
// ============================================================================

/**
 * User Actor 可以 dispatch 的 Input
 */
export type InputFromUser = SendUserMessage;

/**
 * Llm Actor 可以 dispatch 的 Input
 */
export type InputFromLlm = StartAssiMessageStream | EndAssiMessageStream;
