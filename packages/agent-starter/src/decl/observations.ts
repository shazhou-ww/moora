/**
 * Observations 类型定义
 *
 * Observation 是 Actor 相互之间的观察，它是被观察 Actor 状态的切片。
 * 例如 UserObLlm 表示 User Actor 对 Llm Actor 的观察。
 */

import { z } from "zod";

import {
  userMessageSchema,
  assiMessageSchema,
  type UserMessage,
  type AssiMessage,
  type UserMessages,
  type AssiMessages,
} from "@moora/agent-common";

// Re-export for internal use
export type { BaseMessage, UserMessage, AssiMessage, AssiMessageStreaming, AssiMessageCompleted, UserMessages, AssiMessages } from "@moora/agent-common";

// ============================================================================
// Observation Schema 定义
// ============================================================================

/**
 * User 对 Llm 的观察 Schema
 */
export const userObLlmSchema = z.object({
  assiMessages: z.array(assiMessageSchema),
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
});

export type LlmObLlm = z.infer<typeof llmObLlmSchema>;

/**
 * Llm 对 User 的观察 Schema
 */
export const llmObUserSchema = z.object({
  userMessages: z.array(userMessageSchema),
});

export type LlmObUser = z.infer<typeof llmObUserSchema>;
