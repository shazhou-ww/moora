/**
 * Observations 类型定义
 *
 * Observation 是 Actor 对其他 Actor 的观察。
 * FooObBar = Foo 对 Bar 的观察 = Foo 能看到 Bar 的什么数据
 *
 * 设计原则：
 * - FooObFoo（自环）只包含 Foo 主动控制的信息
 * - FooObBar 只包含 Bar 主动提供/控制的信息
 */

import { z } from "zod";

import {
  userMessageSchema,
  assiMessageSchema,
} from "@moora/agent-common";

// Re-export for internal use
export type {
  BaseMessage,
  UserMessage,
  AssiMessage,
  AssiMessageStreaming,
  AssiMessageCompleted,
  UserMessages,
  AssiMessages,
} from "@moora/agent-common";

// ============================================================================
// Task 相关类型（简化版，用于 Observation）
// ============================================================================

/**
 * Task 监控信息 Schema
 *
 * Workforce 提供的任务状态信息
 */
export const taskMonitorInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["ready", "pending", "processing", "succeeded", "failed"]),
  /** 任务结果（仅在 succeeded 或 failed 时存在） */
  result: z
    .union([
      z.object({ success: z.literal(true), conclusion: z.string() }),
      z.object({ success: z.literal(false), error: z.string() }),
    ])
    .optional(),
});

export type TaskMonitorInfo = z.infer<typeof taskMonitorInfoSchema>;

// ============================================================================
// Tool 相关类型
// ============================================================================

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
// Message Append Request 类型（Llm 发起，多个 observer 共享）
// ============================================================================

/**
 * 消息追加请求 Schema
 *
 * Llm 发起的向任务追加消息的请求
 */
export const messageAppendRequestSchema = z.object({
  messageId: z.string(),
  content: z.string(),
  taskIds: z.array(z.string()),
  timestamp: z.number(),
});

export type MessageAppendRequest = z.infer<typeof messageAppendRequestSchema>;

// ============================================================================
// Valid Task 类型（Llm 发起但未取消的任务）
// ============================================================================

/**
 * 有效任务 Schema
 *
 * Llm 发起但未取消的任务，包含创建任务的必要信息
 */
export const validTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  goal: z.string(),
  timestamp: z.number(),
});

export type ValidTask = z.infer<typeof validTaskSchema>;

// ============================================================================
// User 相关 Observation
// ============================================================================

/**
 * User 对自身的观察 Schema（自环）
 *
 * User 只能看到自己主动控制的信息：用户消息列表
 */
export const userObUserSchema = z.object({
  userMessages: z.array(userMessageSchema),
});

export type UserObUser = z.infer<typeof userObUserSchema>;

/**
 * User 对 Llm 的观察 Schema
 *
 * UserObLlm: User 能看到 Llm 主动发起的信息
 * - 助手消息
 * - 工具调用请求
 * - 有效任务列表（发起但未取消的）
 * - 消息追加请求
 */
export const userObLlmSchema = z.object({
  assiMessages: z.array(assiMessageSchema),
  toolCallRequests: z.array(toolCallRequestSchema),
  /** 有效任务列表（Llm 发起但未取消的任务） */
  validTasks: z.array(validTaskSchema),
  messageAppendRequests: z.array(messageAppendRequestSchema),
});

export type UserObLlm = z.infer<typeof userObLlmSchema>;

/**
 * User 对 Toolkit 的观察 Schema
 *
 * UserObToolkit: User 能看到 Toolkit 主动提供的信息 = 工具执行结果
 */
export const userObToolkitSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type UserObToolkit = z.infer<typeof userObToolkitSchema>;

/**
 * User 对 Workforce 的观察 Schema
 *
 * UserObWorkforce: User 能看到 Workforce 主动提供的信息 = 顶层任务状态和结果
 */
export const userObWorkforceSchema = z.object({
  /** 所有顶层任务的状态信息 */
  topLevelTasks: z.array(taskMonitorInfoSchema),
});

export type UserObWorkforce = z.infer<typeof userObWorkforceSchema>;

// ============================================================================
// Llm 相关 Observation
// ============================================================================

/**
 * Llm 对自身的观察 Schema（自环）
 *
 * Llm 能看到自己主动控制的状态
 * - 助手消息
 * - 处理用户消息的截止时间戳
 * - 工具调用请求
 * - 有效任务列表（发起但未取消的）
 */
export const llmObLlmSchema = z.object({
  assiMessages: z.array(assiMessageSchema),
  /**
   * LLM 处理截止时间戳，表示截止到这个时间之前（包括这个时间）的 user message 都已经发给 LLM 处理过了
   */
  llmProceedCutOff: z.number(),
  toolCallRequests: z.array(toolCallRequestSchema),
  /** 有效任务列表（Llm 发起但未取消的任务） */
  validTasks: z.array(validTaskSchema),
});

export type LlmObLlm = z.infer<typeof llmObLlmSchema>;

/**
 * Llm 对 User 的观察 Schema
 *
 * LlmObUser: Llm 能看到 User 主动提供的信息 = 用户消息
 */
export const llmObUserSchema = z.object({
  userMessages: z.array(userMessageSchema),
});

export type LlmObUser = z.infer<typeof llmObUserSchema>;

/**
 * Llm 对 Toolkit 的观察 Schema
 *
 * LlmObToolkit: Llm 能看到 Toolkit 主动提供的信息 = 工具执行结果
 */
export const llmObToolkitSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type LlmObToolkit = z.infer<typeof llmObToolkitSchema>;

/**
 * Llm 对 Workforce 的观察 Schema
 *
 * LlmObWorkforce: Llm 能看到 Workforce 主动提供的信息 = 顶层任务状态和结果
 * （与 UserObWorkforce 一致）
 */
export const llmObWorkforceSchema = z.object({
  /** 所有顶层任务的状态信息 */
  topLevelTasks: z.array(taskMonitorInfoSchema),
});

export type LlmObWorkforce = z.infer<typeof llmObWorkforceSchema>;

// ============================================================================
// Toolkit 相关 Observation
// ============================================================================

/**
 * Toolkit 对自身的观察 Schema（自环）
 *
 * Toolkit 能看到自己主动控制的信息 = 工具结果缓存
 */
export const toolkitObToolkitSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type ToolkitObToolkit = z.infer<typeof toolkitObToolkitSchema>;

/**
 * Toolkit 对 Llm 的观察 Schema
 *
 * ToolkitObLlm: Toolkit 能看到 Llm 主动发起的信息 = 工具调用请求
 */
export const toolkitObLlmSchema = z.object({
  toolCallRequests: z.array(toolCallRequestSchema),
});

export type ToolkitObLlm = z.infer<typeof toolkitObLlmSchema>;

// ============================================================================
// Workforce 相关 Observation
// ============================================================================

/**
 * Workforce 对自身的观察 Schema（自环）
 *
 * Workforce 能看到自己主动控制的信息
 * - 投递 append message 的截止时间戳
 */
export const workforceObWorkforceSchema = z.object({
  /**
   * 投递 append message 的截止时间戳
   * 表示截止到这个时间之前的 append message 都已经投递给 worker 了
   */
  appendMessageCutOff: z.number(),
});

export type WorkforceObWorkforce = z.infer<typeof workforceObWorkforceSchema>;

/**
 * Workforce 对 Llm 的观察 Schema
 *
 * WorkforceObLlm: Workforce 能看到 Llm 主动发起的信息
 * - 有效任务列表（从中推断需要创建的任务）
 * - 消息追加请求
 */
export const workforceObLlmSchema = z.object({
  /** 有效任务列表（Llm 发起但未取消的任务） */
  validTasks: z.array(validTaskSchema),
  messageAppendRequests: z.array(messageAppendRequestSchema),
});

export type WorkforceObLlm = z.infer<typeof workforceObLlmSchema>;
