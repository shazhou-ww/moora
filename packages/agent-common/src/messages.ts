/**
 * 消息类型定义
 *
 * 公共的消息 schema 和类型，供各个 agent 包复用
 */

import { z } from "zod";

// ============================================================================
// 基础消息类型 Schema
// ============================================================================

/**
 * 基础消息 Schema（content 可选，用于流式消息）
 */
export const baseMessageSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
});

export type BaseMessage = z.infer<typeof baseMessageSchema>;

/**
 * 用户消息 Schema
 */
export const userMessageSchema = baseMessageSchema.extend({
  role: z.literal("user"),
  content: z.string(),
});

export type UserMessage = z.infer<typeof userMessageSchema>;

/**
 * 流式进行中的助手消息 Schema
 */
export const assiMessageStreamingSchema = baseMessageSchema.extend({
  role: z.literal("assistant"),
  streaming: z.literal(true),
});

export type AssiMessageStreaming = z.infer<typeof assiMessageStreamingSchema>;

/**
 * 流式完成的助手消息 Schema
 */
export const assiMessageCompletedSchema = baseMessageSchema.extend({
  role: z.literal("assistant"),
  streaming: z.literal(false),
  content: z.string(),
});

export type AssiMessageCompleted = z.infer<typeof assiMessageCompletedSchema>;

/**
 * 助手消息 Schema（Discriminated Union）
 */
export const assiMessageSchema = z.discriminatedUnion("streaming", [
  assiMessageStreamingSchema,
  assiMessageCompletedSchema,
]);

export type AssiMessage = z.infer<typeof assiMessageSchema>;

/**
 * 用户消息列表类型
 */
export type UserMessages = UserMessage[];

/**
 * 助手消息列表类型
 */
export type AssiMessages = AssiMessage[];
