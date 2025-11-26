import { z } from 'zod';

// ============================================================================
// 内嵌类型定义 - Zod Schemas
// ============================================================================

/**
 * 响应状态
 */
export const ResponseStatusSchema = z.enum([
  'waiting',      // 等待用户输入
  'completed',    // 已完成
  'cancelled',    // 已取消
]);

/**
 * 任务状态
 * 
 * 任务状态可以是 'in-progress'（进行中）或 ResponseStatus（响应状态）
 */
export const TaskStatusSchema = z.union([
  z.literal('in-progress'),
  ResponseStatusSchema,
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
});

/**
 * 任务响应消息
 */
export const TaskResponseSchema = z.object({
  /** 响应唯一标识符 */
  id: z.string(),
  /** 响应内容（支持普通文本或流式输出） */
  response: z.discriminatedUnion('isStream', [
    z.object({
      isStream: z.literal(false),
      content: z.string(),
    }),
    z.object({
      isStream: z.literal(true),
      streamId: z.string(),
    }),
  ]),
  /** 关联的任务 ID（如果有） */
  taskId: z.string().optional(),
  /** 响应时间戳 */
  timestamp: z.number(),
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

export type ResponseStatus = z.infer<typeof ResponseStatusSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type UserTask = z.infer<typeof UserTaskSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type OrchestratorState = z.infer<typeof OrchestratorStateSchema>;

