import { z } from 'zod';

// ============================================================================
// Effect 类型定义 - Zod Schemas
// ============================================================================

/**
 * 发送消息给用户 Effect
 *
 * 当需要向用户发送消息时触发
 */
export const SendUserMessageEffectSchema = z.object({
  kind: z.literal('send-user-message'),
  /** 消息 ID */
  messageId: z.string(),
  /** 消息内容 */
  content: z.string(),
  /** 关联的任务 ID（如果有） */
  taskId: z.string().optional(),
});

/**
 * 发送任务响应给用户 Effect
 *
 * 当需要向用户发送任务响应时触发
 */
export const SendTaskResponseEffectSchema = z.object({
  kind: z.literal('send-task-response'),
  /** 消息 ID */
  messageId: z.string(),
  /** 任务 ID */
  taskId: z.string(),
  /** 响应内容 */
  content: z.string(),
});

/**
 * 执行任务 Effect
 *
 * 当需要执行任务时触发
 */
export const ExecuteTaskEffectSchema = z.object({
  kind: z.literal('execute-task'),
  /** 任务 ID */
  taskId: z.string(),
  /** 任务内容 */
  content: z.string(),
  /** 任务模板 */
  task: z.string(),
});

/**
 * Orchestrator 的 Effect
 *
 * 根据状态决定需要执行的副作用
 */
export const OrchestratorEffectSchema = z.discriminatedUnion('kind', [
  SendUserMessageEffectSchema,
  SendTaskResponseEffectSchema,
  ExecuteTaskEffectSchema,
]);

// ============================================================================
// TypeScript 类型导出（通过 z.infer 从 Zod Schema 推导）
// ============================================================================

export type SendUserMessageEffect = z.infer<typeof SendUserMessageEffectSchema>;
export type SendTaskResponseEffect = z.infer<typeof SendTaskResponseEffectSchema>;
export type ExecuteTaskEffect = z.infer<typeof ExecuteTaskEffectSchema>;
export type OrchestratorEffect = z.infer<typeof OrchestratorEffectSchema>;

