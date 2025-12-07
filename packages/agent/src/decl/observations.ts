/**
 * Observations 类型定义
 *
 * Observation 是 Actor 相互之间的观察，它是被观察 Actor 状态的切片。
 * 例如 UserObLlm 表示 User Actor 对 Llm Actor 的观察。
 */

import { z } from "zod";

// ============================================================================
// 基础数据类型 Schema（供 Observations、States、Contexts 复用）
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

/**
 * 工具调用请求 Schema
 */
export const toolCallRequestSchema = z.object({
  toolCallId: z.string(),
  name: z.string(),
  arguments: z.string(),
  timestamp: z.number(),
});

export type ToolCallRequest = z.infer<typeof toolCallRequestSchema>;

/**
 * 工具执行结果 Schema
 */
export const toolResultSchema = z.object({
  toolCallId: z.string(),
  result: z.string(),
  timestamp: z.number(),
});

export type ToolResult = z.infer<typeof toolResultSchema>;

/**
 * 工具调用请求列表类型
 */
export type ToolCallRequests = ToolCallRequest[];

/**
 * 工具执行结果列表类型
 */
export type ToolResults = ToolResult[];

// ============================================================================
// Observation Schema 定义
// ============================================================================

/**
 * User 对 Llm 的观察 Schema
 */
export const userObLlmSchema = z.object({
  assiMessages: z.array(assiMessageSchema),
  toolCallRequests: z.array(toolCallRequestSchema),
});

export type UserObLlm = z.infer<typeof userObLlmSchema>;

/**
 * User 对自身的观察 Schema（自环）
 */
export const userObUserSchema = z.object({
  userMessages: z.array(userMessageSchema),
});

export type UserObUser = z.infer<typeof userObUserSchema>;

/**
 * Llm 对自身的观察 Schema（自环）
 */
export const llmObLlmSchema = z.object({
  assiMessages: z.array(assiMessageSchema),
  /**
   * 截止时间戳，表示截止到这个时间之前（包括这个时间）的 user message 都已经发给 LLM 处理过了
   */
  cutOff: z.number(),
  /**
   * Llm 发出的工具调用请求
   */
  toolCallRequests: z.array(toolCallRequestSchema),
});

export type LlmObLlm = z.infer<typeof llmObLlmSchema>;

/**
 * Llm 对 User 的观察 Schema
 */
export const llmObUserSchema = z.object({
  userMessages: z.array(userMessageSchema),
});

export type LlmObUser = z.infer<typeof llmObUserSchema>;

/**
 * Llm 对 Toolkit 的观察 Schema
 */
export const llmObToolkitSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type LlmObToolkit = z.infer<typeof llmObToolkitSchema>;

/**
 * Toolkit 对 Llm 的观察 Schema
 */
export const toolkitObLlmSchema = z.object({
  toolCallRequests: z.array(toolCallRequestSchema),
});

export type ToolkitObLlm = z.infer<typeof toolkitObLlmSchema>;

/**
 * Toolkit 对自身的观察 Schema（自环）
 */
export const toolkitObToolkitSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type ToolkitObToolkit = z.infer<typeof toolkitObToolkitSchema>;

/**
 * User 对 Toolkit 的观察 Schema
 */
export const userObToolkitSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type UserObToolkit = z.infer<typeof userObToolkitSchema>;
