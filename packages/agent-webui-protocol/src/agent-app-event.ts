// ============================================================================
// Agent App Event 类型定义
// ============================================================================

import { z } from "zod";

/**
 * 用户消息事件
 * 
 * 当用户在 Web UI 中输入消息并发送时触发。
 * 可以带一个或多个 task 作为 hint，提醒 Agent message 和哪些 task 相关。
 * 
 * @example
 * ```typescript
 * const event: UserMessageEvent = {
 *   type: "user-message",
 *   content: "继续处理这个任务",
 *   taskHints: ["task-1", "task-2"],
 * };
 * ```
 */
export const userMessageEventSchema = z.object({
  /**
   * 事件类型标识
   */
  type: z.literal("user-message"),

  /**
   * 用户消息内容
   */
  content: z.string(),

  /**
   * 关联的 Task ID 列表（作为 hint）
   * 提醒 Agent message 和哪些 task 相关
   * 如果没有关联的 task，则为空数组
   */
  taskHints: z.array(z.string()),
});

export type UserMessageEvent = z.infer<typeof userMessageEventSchema>;

/**
 * 取消 Task 事件
 * 
 * 取消指定的 task。
 */
export const cancelTaskEventSchema = z.object({
  /**
   * 事件类型标识
   */
  type: z.literal("cancel-task"),

  /**
   * 要取消的 Task ID
   */
  taskId: z.string(),
});

export type CancelTaskEvent = z.infer<typeof cancelTaskEventSchema>;

/**
 * 更新 Task 简介事件
 * 
 * 用户更新一个 task 的 summary。
 */
export const updateTaskSummaryEventSchema = z.object({
  /**
   * 事件类型标识
   */
  type: z.literal("update-task-summary"),

  /**
   * 要更新的 Task ID
   */
  taskId: z.string(),

  /**
   * 新的 Task 简介（summary）
   */
  summary: z.string(),
});

export type UpdateTaskSummaryEvent = z.infer<
  typeof updateTaskSummaryEventSchema
>;

/**
 * Agent 应用事件 - 用户可以通过 Web UI 触发的事件类型
 * 
 * 这个类型定义了前端 UI 可以发送给 Agent 的所有事件。
 * 使用 Discriminated Union 类型，通过 `type` 字段区分不同的事件类型。
 */
export const agentAppEventSchema = z.discriminatedUnion("type", [
  userMessageEventSchema,
  cancelTaskEventSchema,
  updateTaskSummaryEventSchema,
]);

export type AgentAppEvent = z.infer<typeof agentAppEventSchema>;
