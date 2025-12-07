/**
 * Contexts 类型定义
 *
 * 一个 Actor 的 Context 就是所有它发出的 Observation 的并集（所有出边的 Observation）
 */

import { z } from "zod";
import type {
  UserObUser,
  UserObLlm,
  LlmObUser,
  LlmObLlm,
  LlmObToolkit,
  ToolkitObLlm,
  ToolkitObToolkit,
  UserObToolkit,
} from "./observations";
import {
  userObUserSchema,
  userObLlmSchema,
  llmObUserSchema,
  llmObLlmSchema,
  llmObToolkitSchema,
  toolkitObLlmSchema,
  toolkitObToolkitSchema,
  userObToolkitSchema,
} from "./observations";

// ============================================================================
// Context Schema 定义
// ============================================================================

/**
 * User 的上下文 = 所有 User 发出的 Observation 的并集
 * User 的出边：UserObUser（自环）, UserObLlm, UserObToolkit
 */
export const contextOfUserSchema = z.object({
  ...userObUserSchema.shape,
  ...userObLlmSchema.shape,
  ...userObToolkitSchema.shape,
});

export type ContextOfUser = UserObUser & UserObLlm & UserObToolkit;

/**
 * Llm 的上下文 = 所有 Llm 发出的 Observation 的并集
 * Llm 的出边：LlmObUser, LlmObLlm（自环）, LlmObToolkit
 */
export const contextOfLlmSchema = z.object({
  ...llmObUserSchema.shape,
  ...llmObLlmSchema.shape,
  ...llmObToolkitSchema.shape,
});

export type ContextOfLlm = LlmObUser & LlmObLlm & LlmObToolkit;

/**
 * Toolkit 的上下文 = 所有 Toolkit 发出的 Observation 的并集
 * Toolkit 的出边：ToolkitObLlm, ToolkitObToolkit（自环）
 */
export const contextOfToolkitSchema = z.object({
  ...toolkitObLlmSchema.shape,
  ...toolkitObToolkitSchema.shape,
});

export type ContextOfToolkit = ToolkitObLlm & ToolkitObToolkit;
