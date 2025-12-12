/**
 * Observations 类型定义
 *
 * Observation 是 Actor 相互之间的观察，它是被观察 Actor 状态的切片。
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
 * Coordinator 只需要监控顶层任务的状态，不关心子任务
 */
export const taskMonitorInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["ready", "pending", "processing", "succeeded", "failed"]),
  parentId: z.string(),
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
// Observation Schema 定义
// ============================================================================

/**
 * User 对 Llm 的观察 Schema
 *
 * UserObLlm: User 发给 Llm 的数据（用户消息）
 */
export const userObLlmSchema = z.object({
  userMessages: z.array(userMessageSchema as unknown as z.ZodTypeAny),
});

export type UserObLlm = z.infer<typeof userObLlmSchema>;

/**
 * User 对自身的观察 Schema（自环）
 */
export const userObUserSchema = z.object({
  userMessages: z.array(userMessageSchema as unknown as z.ZodTypeAny),
});

export type UserObUser = z.infer<typeof userObUserSchema>;

/**
 * Llm 对自身的观察 Schema（自环）
 */
export const llmObLlmSchema = z.object({
  assiMessages: z.array(assiMessageSchema as unknown as z.ZodTypeAny),
  /**
   * 截止时间戳，表示截止到这个时间之前（包括这个时间）的 user message 都已经发给 LLM 处理过了
   */
  cutOff: z.number(),
});

export type LlmObLlm = z.infer<typeof llmObLlmSchema>;

/**
 * Llm 对 User 的观察 Schema
 *
 * LlmObUser: Llm 发给 User 的数据（助手消息）
 */
export const llmObUserSchema = z.object({
  assiMessages: z.array(assiMessageSchema as unknown as z.ZodTypeAny),
});

export type LlmObUser = z.infer<typeof llmObUserSchema>;

/**
 * Llm 对 Workforce 的观察 Schema
 *
 * LlmObWorkforce: Llm 发给 Workforce 的请求
 */
export const llmObWorkforceSchema = z.object({
  /** Llm 请求创建的任务列表 */
  taskCreateRequests: z.array(
    z.object({
      requestId: z.string(),
      taskId: z.string(),
      title: z.string(),
      goal: z.string(),
      timestamp: z.number(),
    })
  ),
  /** Llm 请求追加消息的列表 */
  messageAppendRequests: z.array(
    z.object({
      requestId: z.string(),
      messageId: z.string(),
      content: z.string(),
      taskIds: z.array(z.string()),
      timestamp: z.number(),
    })
  ),
  /** Llm 请求取消的任务 ID 列表 */
  taskCancelRequests: z.array(
    z.object({
      requestId: z.string(),
      taskIds: z.array(z.string()),
      timestamp: z.number(),
    })
  ),
});

export type LlmObWorkforce = z.infer<typeof llmObWorkforceSchema>;

/**
 * Workforce 对自身的观察 Schema（自环）
 *
 * Workforce 维护所有任务的完整状态
 */
export const workforceObWorkforceSchema = z.object({
  /** 所有顶层任务 ID 列表 */
  topLevelTaskIds: z.array(z.string()),
  /** 任务详情缓存 */
  taskCache: z.record(z.string(), taskMonitorInfoSchema),
});

export type WorkforceObWorkforce = z.infer<typeof workforceObWorkforceSchema>;

/**
 * Workforce 对 Llm 的观察 Schema
 *
 * WorkforceObLlm: Workforce 发给 Llm 的任务信息
 */
export const workforceObLlmSchema = z.object({
  /** 所有顶层任务的详细信息 Map */
  topLevelTasks: z.record(z.string(), taskMonitorInfoSchema),
});

export type WorkforceObLlm = z.infer<typeof workforceObLlmSchema>;

/**
 * Workforce 对 User 的观察 Schema
 *
 * WorkforceObUser: Workforce 发给 User 的任务信息
 */
export const workforceObUserSchema = z.object({
  /** 所有顶层正在进行的任务（不包括 succeeded/failed 的） */
  ongoingTopLevelTasks: z.array(taskMonitorInfoSchema),
  /** 已通知用户的任务完成事件 ID 集合 */
  notifiedTaskCompletions: z.array(z.string()),
});

export type WorkforceObUser = z.infer<typeof workforceObUserSchema>;

/**
 * Llm 对 Toolkit 的观察 Schema
 *
 * LlmObToolkit: Llm 发给 Toolkit 的工具调用请求
 */
export const llmObToolkitSchema = z.object({
  toolCallRequests: z.array(toolCallRequestSchema),
});

export type LlmObToolkit = z.infer<typeof llmObToolkitSchema>;

/**
 * Toolkit 对 Llm 的观察 Schema
 *
 * ToolkitObLlm: Toolkit 发给 Llm 的工具调用结果
 */
export const toolkitObLlmSchema = z.object({
  toolResults: z.array(toolResultSchema),
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
 * Toolkit 对 User 的观察 Schema
 *
 * ToolkitObUser: Toolkit 发给 User 的工具结果
 */
export const toolkitObUserSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type ToolkitObUser = z.infer<typeof toolkitObUserSchema>;
