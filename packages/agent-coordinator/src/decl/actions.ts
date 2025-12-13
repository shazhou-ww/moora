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
   * LLM 处理截止时间戳，表示这次请求处理的最迟用户消息时间戳
   */
  llmProceedCutOff: z.number(),
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
 *
 * Llm 请求创建新任务，会添加到 validTasks 列表中
 */
export const requestCreateTaskSchema = z.object({
  type: z.literal("request-create-task"),
  taskId: z.string(),
  title: z.string(),
  goal: z.string(),
  timestamp: z.number(),
});

export type RequestCreateTask = z.infer<typeof requestCreateTaskSchema>;

/**
 * 追加消息到任务 Action Schema
 *
 * Llm 请求向任务追加消息，会添加到 messageAppendRequests 列表中
 */
export const requestAppendMessageSchema = z.object({
  type: z.literal("request-append-message"),
  messageId: z.string(),
  content: z.string(),
  taskIds: z.array(z.string()),
  timestamp: z.number(),
});

export type RequestAppendMessage = z.infer<typeof requestAppendMessageSchema>;

/**
 * 取消任务请求 Action Schema
 *
 * Llm 请求取消任务，会从 validTasks 列表中移除对应任务
 */
export const requestCancelTasksSchema = z.object({
  type: z.literal("request-cancel-tasks"),
  taskIds: z.array(z.string()),
  timestamp: z.number(),
});

export type RequestCancelTasks = z.infer<typeof requestCancelTasksSchema>;

/**
 * 任务结果 Schema
 *
 * 与 workforce 中的 TaskResult 类型一致
 */
export const taskResultSchema = z.union([
  z.object({ success: z.literal(true), conclusion: z.string() }),
  z.object({ success: z.literal(false), error: z.string() }),
]);

export type TaskResult = z.infer<typeof taskResultSchema>;

/**
 * 更新任务状态 Action Schema
 *
 * Workforce 更新顶层任务的状态，会更新 topLevelTasks 列表
 * 当 status 为 succeeded/failed 时，result 必须提供
 */
export const updateTaskStatusSchema = z.object({
  type: z.literal("update-task-status"),
  taskId: z.string(),
  status: z.enum(["ready", "pending", "processing", "succeeded", "failed"]),
  result: taskResultSchema.optional(),
  timestamp: z.number(),
});

export type UpdateTaskStatus = z.infer<typeof updateTaskStatusSchema>;

/**
 * 调用工具 Action Schema
 */
export const callToolSchema = z.object({
  type: z.literal("call-tool"),
  toolCallId: z.string(),
  name: z.string(),
  arguments: z.string(),
  timestamp: z.number(),
});

export type CallTool = z.infer<typeof callToolSchema>;

/**
 * 工具返回结果 Action Schema
 */
export const returnToolResultSchema = z.object({
  type: z.literal("return-tool-result"),
  toolCallId: z.string(),
  result: z.string(),
  timestamp: z.number(),
});

export type ReturnToolResult = z.infer<typeof returnToolResultSchema>;

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
  | RequestCancelTasks
  | CallTool;

/**
 * Toolkit Actor 可以 dispatch 的 Action 类型
 */
export type ActionFromToolkit = ReturnToolResult;

/**
 * Workforce Actor 可以 dispatch 的 Action 类型
 */
export type ActionFromWorkforce = UpdateTaskStatus;

// ============================================================================
// 所有 Actions 的联合类型
// ============================================================================

export type Actuation = ActionFromUser | ActionFromLlm | ActionFromToolkit | ActionFromWorkforce;
