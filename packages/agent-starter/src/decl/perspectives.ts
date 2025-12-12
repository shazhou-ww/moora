/**
 * Perspectives 类型定义
 *
 * 一个 Actor 的 Perspective（感知）就是所有它发出的 Observation 的并集（所有出边的 Observation）
 */

import { z } from "zod";

import { userObUserSchema, userObLlmSchema, llmObUserSchema, llmObLlmSchema } from "./observations";

import type { UserObUser, UserObLlm, LlmObUser, LlmObLlm } from "./observations";

// ============================================================================
// Perspective Schema 定义
// ============================================================================

/**
 * User 的感知 = 所有 User 发出的 Observation 的并集
 * User 的出边：UserObUser（自环）, UserObLlm
 */
export const perspectiveOfUserSchema = z.object({
  ...userObUserSchema.shape,
  ...userObLlmSchema.shape,
});

export type PerspectiveOfUser = UserObUser & UserObLlm;

/**
 * Llm 的感知 = 所有 Llm 发出的 Observation 的并集
 * Llm 的出边：LlmObUser, LlmObLlm（自环）
 */
export const perspectiveOfLlmSchema = z.object({
  ...llmObUserSchema.shape,
  ...llmObLlmSchema.shape,
});

export type PerspectiveOfLlm = LlmObUser & LlmObLlm;
