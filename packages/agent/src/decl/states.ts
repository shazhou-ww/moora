/**
 * States 类型定义
 *
 * 一个 Actor 的 State 就是所有指向它的 Observation 的并集（所有入边的 Observation）
 */

import { z } from "zod";
import type {
  UserObUser,
  LlmObUser,
  UserObLlm,
  LlmObLlm,
  LlmObToolkit,
  ToolkitObLlm,
  ToolkitObToolkit,
  UserObToolkit,
} from "./observations";
import {
  userObUserSchema,
  llmObUserSchema,
  userObLlmSchema,
  llmObLlmSchema,
  llmObToolkitSchema,
  toolkitObLlmSchema,
  toolkitObToolkitSchema,
  userObToolkitSchema,
} from "./observations";

// ============================================================================
// State Schema 定义
// ============================================================================

/**
 * User 的状态 = 所有指向 User 的 Observation 的并集
 * User 的入边：UserObUser（自环）, LlmObUser
 */
export const stateOfUserSchema = z.object({
  ...userObUserSchema.shape,
  ...llmObUserSchema.shape,
});

export type StateOfUser = UserObUser & LlmObUser;

/**
 * Llm 的状态 = 所有指向 Llm 的 Observation 的并集
 * Llm 的入边：LlmObLlm（自环）, UserObLlm, ToolkitObLlm
 */
export const stateOfLlmSchema = z.object({
  ...llmObLlmSchema.shape,
  ...userObLlmSchema.shape,
  ...toolkitObLlmSchema.shape,
});

export type StateOfLlm = LlmObLlm & UserObLlm & ToolkitObLlm;

/**
 * Toolkit 的状态 = 所有指向 Toolkit 的 Observation 的并集
 * Toolkit 的入边：ToolkitObToolkit（自环）, LlmObToolkit, UserObToolkit
 */
export const stateOfToolkitSchema = z.object({
  ...toolkitObToolkitSchema.shape,
  ...llmObToolkitSchema.shape,
  ...userObToolkitSchema.shape,
});

export type StateOfToolkit = ToolkitObToolkit & LlmObToolkit & UserObToolkit;
