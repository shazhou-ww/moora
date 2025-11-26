import { z } from 'zod';

// ============================================================================
// Signal 类型定义 - Zod Schemas
// ============================================================================

/**
 * 用户输入信号
 *
 * 当用户提交新任务或消息时触发
 */
export const UserInputSignalSchema = z.object({
  type: z.literal('user-input'),
  /** 用户输入内容 */
  content: z.string(),
  /** 关联的任务 ID（如果是针对已有任务的输入） */
  taskId: z.string().optional(),
});

/**
 * 创建任务信号
 *
 * 当需要创建新任务时触发
 */
export const CreateTaskSignalSchema = z.object({
  type: z.literal('create-task'),
  /** 任务内容 */
  content: z.string(),
  /** 任务模板 */
  task: z.string(),
});

/**
 * 任务响应信号
 *
 * 当任务产生响应时触发
 */
export const TaskResponseSignalSchema = z.object({
  type: z.literal('task-response'),
  /** 任务 ID */
  taskId: z.string(),
  /** 响应内容 */
  content: z.string(),
  /** 任务是否完成 */
  completed: z.boolean(),
  /** 错误信息（如果有） */
  error: z.string().optional(),
});

/**
 * 任务完成信号
 *
 * 当任务完成时触发
 */
export const TaskCompletedSignalSchema = z.object({
  type: z.literal('task-completed'),
  /** 任务 ID */
  taskId: z.string(),
  /** 任务结果 */
  result: z.unknown().optional(),
});

/**
 * 任务失败信号
 *
 * 当任务失败时触发
 */
export const TaskFailedSignalSchema = z.object({
  type: z.literal('task-failed'),
  /** 任务 ID */
  taskId: z.string(),
  /** 错误信息 */
  error: z.string(),
});


/**
 * 取消任务信号
 *
 * 当需要取消任务时触发
 */
export const CancelTaskSignalSchema = z.object({
  type: z.literal('cancel-task'),
  /** 任务 ID */
  taskId: z.string(),
});

/**
 * 用户消息已发送信号
 *
 * 当用户消息发送完成后触发，用于更新消息状态
 */
export const UserMessageSentSignalSchema = z.object({
  type: z.literal('user-message-sent'),
  /** 消息 ID */
  messageId: z.string(),
});

/**
 * 任务响应已发送信号
 *
 * 当任务响应消息发送完成后触发，用于更新消息状态
 */
export const TaskResponseSentSignalSchema = z.object({
  type: z.literal('task-response-sent'),
  /** 消息 ID */
  messageId: z.string(),
});

/**
 * Orchestrator 的信号
 *
 * 触发状态转换的输入事件
 */
export const OrchestratorSignalSchema = z.discriminatedUnion('type', [
  UserInputSignalSchema,
  CreateTaskSignalSchema,
  TaskResponseSignalSchema,
  TaskCompletedSignalSchema,
  TaskFailedSignalSchema,
  CancelTaskSignalSchema,
  UserMessageSentSignalSchema,
  TaskResponseSentSignalSchema,
]);

// ============================================================================
// TypeScript 类型导出（通过 z.infer 从 Zod Schema 推导）
// ============================================================================

export type UserInputSignal = z.infer<typeof UserInputSignalSchema>;
export type CreateTaskSignal = z.infer<typeof CreateTaskSignalSchema>;
export type TaskResponseSignal = z.infer<typeof TaskResponseSignalSchema>;
export type TaskCompletedSignal = z.infer<typeof TaskCompletedSignalSchema>;
export type TaskFailedSignal = z.infer<typeof TaskFailedSignalSchema>;
export type CancelTaskSignal = z.infer<typeof CancelTaskSignalSchema>;
export type UserMessageSentSignal = z.infer<typeof UserMessageSentSignalSchema>;
export type TaskResponseSentSignal = z.infer<typeof TaskResponseSentSignalSchema>;
export type OrchestratorSignal = z.infer<typeof OrchestratorSignalSchema>;

