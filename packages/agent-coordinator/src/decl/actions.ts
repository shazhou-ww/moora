/**
 * Actions 类型定义
 *
 * 定义各个 Actor 可以 dispatch 的 Action 类型
 */

import { z } from "zod";

// ============================================================================
// Action Schema 定义
// ============================================================================

/**
 * 发送用户消息 Action Schema
 */
export const sendUserMessageSchema = z.object({
  type: z.literal("send-user-message"),
  id: z.string(),
  content: z.string(),
  timestamp: z.number(),
});

export type SendUserMessage = z.infer<typeof sendUserMessageSchema>;

/**
 * 开始流式生成助手消息 Action Schema
 */
export const startAssiMessageStreamSchema = z.object({
  type: z.literal("start-assi-message-stream"),
  id: z.string(),
  timestamp: z.number(),
  /**
   * 这次 llm 请求所处理的最迟的用户消息时间戳，用于更新 cutOff
   */
  cutOff: z.number(),
});

export type StartAssiMessageStream = z.infer<typeof startAssiMessageStreamSchema>;

/**
 * 结束流式生成助手消息 Action Schema
 */
export const endAssiMessageStreamSchema = z.object({
  type: z.literal("end-assi-message-stream"),
  id: z.string(),
  content: z.string(),
  timestamp: z.number(),
});

export type EndAssiMessageStream = z.infer<typeof endAssiMessageStreamSchema>;

/**
 * 创建任务请求 Action Schema
 */
export const requestCreateTaskSchema = z.object({
  type: z.literal("request-create-task"),
  requestId: z.string(),
  taskId: z.string(),
  title: z.string(),
  goal: z.string(),
  timestamp: z.number(),
});

export type RequestCreateTask = z.infer<typeof requestCreateTaskSchema>;

/**
 * 追加消息到任务 Action Schema
 */
export const requestAppendMessageSchema = z.object({
  type: z.literal("request-append-message"),
  requestId: z.string(),
  messageId: z.string(),
  content: z.string(),
  taskIds: z.array(z.string()),
  timestamp: z.number(),
});

export type RequestAppendMessage = z.infer<typeof requestAppendMessageSchema>;

/**
 * 取消任务请求 Action Schema
 */
export const requestCancelTasksSchema = z.object({
  type: z.literal("request-cancel-tasks"),
  requestId: z.string(),
  taskIds: z.array(z.string()),
  timestamp: z.number(),
});

export type RequestCancelTasks = z.infer<typeof requestCancelTasksSchema>;

/**
 * 通知任务完成 Action Schema
 */
export const notifyTaskCompletionSchema = z.object({
  type: z.literal("notify-task-completion"),
  taskId: z.string(),
  title: z.string(),
  success: z.boolean(),
  result: z.string(),
  timestamp: z.number(),
});

export type NotifyTaskCompletion = z.infer<typeof notifyTaskCompletionSchema>;

/**
 * 更新任务监控状态 Action Schema
 *
 * Workforce 内部更新任务状态
 */
export const updateTaskStatusSchema = z.object({
  type: z.literal("update-task-status"),
  taskId: z.string(),
  status: z.enum(["ready", "pending", "processing", "succeeded", "failed"]),
  result: z
    .union([
      z.object({ success: z.literal(true), conclusion: z.string() }),
      z.object({ success: z.literal(false), error: z.string() }),
    ])
    .optional(),
  timestamp: z.number(),
});

export type UpdateTaskStatus = z.infer<typeof updateTaskStatusSchema>;

// ============================================================================
// Actor Actions 聚合类型
// ============================================================================

/**
 * User Actor 可以 dispatch 的 Action 类型
 */
export type ActionFromUser = SendUserMessage;

/**
 * Llm Actor 可以 dispatch 的 Action 类型
 */
export type ActionFromLlm =
  | StartAssiMessageStream
  | EndAssiMessageStream
  | RequestCreateTask
  | RequestAppendMessage
  | RequestCancelTasks;

/**
 * Workforce Actor 可以 dispatch 的 Action 类型
 */
export type ActionFromWorkforce = NotifyTaskCompletion | UpdateTaskStatus;

// ============================================================================
// 所有 Actions 的联合类型
// ============================================================================

export type Actuation = ActionFromUser | ActionFromLlm | ActionFromWorkforce;
