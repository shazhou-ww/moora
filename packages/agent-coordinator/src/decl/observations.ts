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
// Observation Schema 定义
// ============================================================================

/**
 * User 对 Llm 的观察 Schema
 */
export const userObLlmSchema = z.object({
  assiMessages: z.array(assiMessageSchema as unknown as z.ZodTypeAny),
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
 * User 对 Workforce 的观察 Schema
 *
 * User 看到的是正在进行的顶层任务列表
 */
export const userObWorkforceSchema = z.object({
  /** 所有顶层正在进行的任务（不包括 succeeded/failed 的） */
  ongoingTopLevelTasks: z.array(taskMonitorInfoSchema),
});

export type UserObWorkforce = z.infer<typeof userObWorkforceSchema>;

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
 */
export const llmObUserSchema = z.object({
  userMessages: z.array(userMessageSchema as unknown as z.ZodTypeAny),
});

export type LlmObUser = z.infer<typeof llmObUserSchema>;

/**
 * Llm 对 Workforce 的观察 Schema
 *
 * Llm 看到所有任务的详细信息（用于查询和决策）
 */
export const llmObWorkforceSchema = z.object({
  /** 所有顶层任务的详细信息 Map */
  topLevelTasks: z.record(z.string(), taskMonitorInfoSchema),
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
 * Workforce 需要知道 Llm 何时请求创建、追加消息、取消任务
 */
export const workforceObLlmSchema = z.object({
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

export type WorkforceObLlm = z.infer<typeof workforceObLlmSchema>;

/**
 * Workforce 对 User 的观察 Schema
 *
 * Workforce 需要知道哪些任务完成需要通知用户
 */
export const workforceObUserSchema = z.object({
  /** 已通知用户的任务完成事件 ID 集合 */
  notifiedTaskCompletions: z.array(z.string()),
});

export type WorkforceObUser = z.infer<typeof workforceObUserSchema>;
