import { z } from 'zod';

// ============================================================================
// 内嵌类型定义 - Zod Schemas
// ============================================================================

/**
 * 任务更新
 */
export const TaskUpdateSchema = z.object({
  /** 任务 ID */
  id: z.string(),
  /** 任务状态 */
  status: z.enum(['waiting', 'completed', 'cancelled']),
});

/**
 * 用户响应内容
 * 
 * 支持两种形式：
 * - 普通文本：{ isStream: false, content: string }
 * - 流式输出：{ isStream: true, streamId: string }
 */
export const OrchestratorResponseSchema = z.discriminatedUnion('isStream', [
  z.object({
    isStream: z.literal(false),
    content: z.string(),
  }),
  z.object({
    isStream: z.literal(true),
    streamId: z.string(),
  }),
]);

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
 * 回复用户信号
 *
 * Orchestrator 向用户发送回复，可以是关于某个任务的，也可能是与任务无关的。
 * 
 * response 支持两种形式：
 * - 普通文本：{ isStream: false, content: string } - 用于较短的内容
 * - 流式输出：{ isStream: true, streamId: string } - 用于较长的内容，通过 streaming 形式输出
 * 
 * taskUpdates 用于更新相关任务的状态：
 * - 'waiting': 等待用户输入（包括遇到错误时，通过 response 告知用户后进入此状态）
 * - 'completed': 任务已完成
 * - 'cancelled': 任务已取消
 */
export const ReplyToUserSignalSchema = z.object({
  type: z.literal('reply-to-user'),
  /** 响应内容（如果遇到错误，通过此字段告知用户） */
  response: OrchestratorResponseSchema,
  /** 任务更新列表（如果没有相关任务需要更新状态，传空数组 []） */
  taskUpdates: z.array(TaskUpdateSchema),
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
 * Orchestrator 的信号
 *
 * 触发状态转换的输入事件
 */
export const OrchestratorSignalSchema = z.discriminatedUnion('type', [
  UserInputSignalSchema,
  CreateTaskSignalSchema,
  ReplyToUserSignalSchema,
  CancelTaskSignalSchema,
]);

// ============================================================================
// TypeScript 类型导出（通过 z.infer 从 Zod Schema 推导）
// ============================================================================

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
export type OrchestratorResponse = z.infer<typeof OrchestratorResponseSchema>;
export type UserInputSignal = z.infer<typeof UserInputSignalSchema>;
export type CreateTaskSignal = z.infer<typeof CreateTaskSignalSchema>;
export type ReplyToUserSignal = z.infer<typeof ReplyToUserSignalSchema>;
export type CancelTaskSignal = z.infer<typeof CancelTaskSignalSchema>;
export type OrchestratorSignal = z.infer<typeof OrchestratorSignalSchema>;

