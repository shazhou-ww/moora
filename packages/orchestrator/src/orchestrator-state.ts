import { z } from 'zod';

// ============================================================================
// 内嵌类型定义 - Zod Schemas
// ============================================================================

/**
 * 任务状态
 */
export const TaskStatusSchema = z.enum([
  'pending',      // 待处理
  'running',      // 运行中
  'completed',    // 已完成
  'failed',       // 失败
  'cancelled',    // 已取消
]);

/**
 * 用户任务
 */
export const UserTaskSchema = z.object({
  /** 任务唯一标识符 */
  id: z.string(),
  /** 任务内容/描述 */
  content: z.string(),
  /** 任务模板 */
  task: z.string(),
  /** 任务状态 */
  status: TaskStatusSchema,
  /** 任务创建时间戳 */
  createdAt: z.number(),
  /** 任务更新时间戳 */
  updatedAt: z.number(),
  /** 任务结果（如果已完成） */
  result: z.unknown().optional(),
  /** 错误信息（如果失败） */
  error: z.string().optional(),
});

/**
 * 用户消息
 */
export const UserMessageSchema = z.object({
  /** 消息唯一标识符 */
  id: z.string(),
  /** 消息内容 */
  content: z.string(),
  /** 关联的任务 ID（如果有） */
  taskId: z.string().optional(),
  /** 消息时间戳 */
  timestamp: z.number(),
  /** 是否已发送 */
  sent: z.boolean(),
});

/**
 * 任务响应消息
 */
export const TaskResponseSchema = z.object({
  /** 响应唯一标识符 */
  id: z.string(),
  /** 响应内容 */
  content: z.string(),
  /** 关联的任务 ID */
  taskId: z.string(),
  /** 响应时间戳 */
  timestamp: z.number(),
  /** 是否已发送给用户 */
  sent: z.boolean(),
});

// ============================================================================
// 状态类型定义 - Zod Schemas
// ============================================================================

/**
 * Orchestrator 的状态
 *
 * 代表协调多个用户任务并实时交互的完整状态
 */
export const OrchestratorStateSchema = z.object({
  /** 所有用户任务 */
  tasks: z.record(z.string(), UserTaskSchema),
  /** 待发送给用户的消息队列 */
  pendingUserMessages: z.array(UserMessageSchema),
  /** 待发送给用户的任务响应消息队列 */
  pendingTaskResponses: z.array(TaskResponseSchema),
  /** 下一个可用的任务 ID 序号 */
  nextTaskId: z.number(),
});

// ============================================================================
// TypeScript 类型导出（通过 z.infer 从 Zod Schema 推导）
// ============================================================================

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type UserTask = z.infer<typeof UserTaskSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type OrchestratorState = z.infer<typeof OrchestratorStateSchema>;

