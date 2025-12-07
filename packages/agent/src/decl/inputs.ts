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
   * 这次 llm 请求所处理的最迟的用户消息或工具结果时间戳，用于更新 cutOff
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

/**
 * 请求工具调用 Input Schema
 */
export const requestToolCallSchema = z.object({
  type: z.literal("request-tool-call"),
  toolCallId: z.string(),
  name: z.string(),
  arguments: z.string(),
  timestamp: z.number(),
  /**
   * 这次 llm 请求所处理的最迟的用户消息或工具结果时间戳，用于更新 cutOff
   */
  cutOff: z.number(),
});

export type RequestToolCall = z.infer<typeof requestToolCallSchema>;

/**
 * 接收工具执行结果 Input Schema
 */
export const receiveToolResultSchema = z.object({
  type: z.literal("receive-tool-result"),
  toolCallId: z.string(),
  result: z.string(),
  timestamp: z.number(),
});

export type ReceiveToolResult = z.infer<typeof receiveToolResultSchema>;

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
export type InputFromLlm =
  | StartAssiMessageStream
  | EndAssiMessageStream
  | RequestToolCall;

/**
 * Toolkit Actor 可以 dispatch 的 Input
 */
export type InputFromToolkit = ReceiveToolResult;
