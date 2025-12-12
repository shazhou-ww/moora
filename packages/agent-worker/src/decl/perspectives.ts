/**
 * Perspectives 类型定义
 *
 * 一个 Actor 的 Perspective 就是所有它发出的 Observation 的并集（所有出边的 Observation）
 */

import { z } from "zod";

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

// ============================================================================
// Perspective Schema 定义
// ============================================================================

/**
 * User 的 Perspective = 所有 User 发出的 Observation 的并集
 * User 的出边：UserObUser（自环）, UserObLlm, UserObToolkit
 */
export const perspectiveOfUserSchema = z.object({
  ...userObUserSchema.shape,
  ...userObLlmSchema.shape,
  ...userObToolkitSchema.shape,
});

export type PerspectiveOfUser = UserObUser & UserObLlm & UserObToolkit;

/**
 * Llm 的 Perspective = 所有 Llm 发出的 Observation 的并集
 * Llm 的出边：LlmObUser, LlmObLlm（自环）, LlmObToolkit
 */
export const perspectiveOfLlmSchema = z.object({
  ...llmObUserSchema.shape,
  ...llmObLlmSchema.shape,
  ...llmObToolkitSchema.shape,
});

export type PerspectiveOfLlm = LlmObUser & LlmObLlm & LlmObToolkit;

/**
 * Toolkit 的 Perspective = 所有 Toolkit 发出的 Observation 的并集
 * Toolkit 的出边：ToolkitObLlm, ToolkitObToolkit（自环）
 */
export const perspectiveOfToolkitSchema = z.object({
  ...toolkitObLlmSchema.shape,
  ...toolkitObToolkitSchema.shape,
});

export type PerspectiveOfToolkit = ToolkitObLlm & ToolkitObToolkit;
