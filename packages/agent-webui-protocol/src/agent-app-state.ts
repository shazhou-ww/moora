// ============================================================================
// Agent App State 类型定义
// ============================================================================

import { z } from "zod";

/**
 * Task 状态类型
 * 
 * - `running`: task 正在执行
 * - `pending`: task 在等待用户操作
 * - `cancelled`: task 被取消
 * - `completed`: task 完成
 */
export const agentTaskStatusSchema = z.enum([
  "running",
  "pending",
  "cancelled",
  "completed",
]);

export type AgentTaskStatus = z.infer<typeof agentTaskStatusSchema>;

/**
 * Agent Task
 * 
 * 表示 Agent 执行的一个任务，每个任务包含唯一标识、状态和简介。
 * 
 * @example
 * ```typescript
 * const task: AgentTask = {
 *   id: 'task-123',
 *   status: 'running',
 *   summary: '正在搜索相关信息',
 * };
 * ```
 */
export const agentTaskSchema = z
  .object({
    /**
     * Task 唯一标识符
     */
    id: z.string(),

    /**
     * Task 状态
     */
    status: agentTaskStatusSchema,

    /**
     * Task 简介（一句话简介）
     */
    summary: z.string(),
  })
  .readonly();

export type AgentTask = z.infer<typeof agentTaskSchema>;

/**
 * 基础消息类型
 * 
 * 包含所有消息类型的共同字段。
 * 
 * @internal
 */
const baseMessageSchema = z.object({
  /**
   * 消息唯一标识符
   */
  id: z.string(),

  /**
   * 消息文本内容
   */
  content: z.string(),

  /**
   * 消息时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),

  /**
   * 关联的 Task ID 列表
   * 前端应用可根据 task filter 相关的消息
   * 如果没有关联的 task，则为空数组
   */
  taskIds: z.array(z.string()).readonly(),
});

/**
 * 用户消息
 * 
 * 表示用户发送的消息。
 * 每条消息可以通过 taskIds 关联到 [0..n] 个 task。
 * 
 * @example
 * ```typescript
 * const message: UserMessage = {
 *   id: 'msg-123',
 *   role: 'user',
 *   content: 'Hello, Agent!',
 *   timestamp: Date.now(),
 *   taskIds: ['task-1', 'task-2'],
 * };
 * ```
 */
export const userMessageSchema = baseMessageSchema
  .extend({
    /**
     * 消息角色
     */
    role: z.literal("user"),
  })
  .readonly();

export type UserMessage = z.infer<typeof userMessageSchema>;

/**
 * 助手消息
 * 
 * 表示 Agent 发送的消息。
 * 只有助手消息才有 streaming 的需要。
 * 每条消息可以通过 taskIds 关联到 [0..n] 个 task。
 * 
 * @example
 * ```typescript
 * const message: AssistantMessage = {
 *   id: 'msg-124',
 *   role: 'assistant',
 *   content: 'Hello, User!',
 *   timestamp: Date.now(),
 *   streaming: false,
 *   taskIds: ['task-1'],
 * };
 * ```
 */
export const assistantMessageSchema = baseMessageSchema
  .extend({
    /**
     * 消息角色
     */
    role: z.literal("assistant"),

    /**
     * 是否正在流式输出中
     * 当 Agent 正在流式生成响应时，此字段为 `true`；否则为 `false`
     */
    streaming: z.boolean(),
  })
  .readonly();

export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

/**
 * Agent 消息
 * 
 * 表示对话中的一条消息，可以是用户消息或助手消息。
 * 使用 Discriminated Union 类型，通过 `role` 字段区分。
 * 
 * @example
 * ```typescript
 * const userMsg: AgentMessage = {
 *   id: 'msg-123',
 *   role: 'user',
 *   content: 'Hello, Agent!',
 *   timestamp: Date.now(),
 *   taskIds: [],
 * };
 * 
 * const assistantMsg: AgentMessage = {
 *   id: 'msg-124',
 *   role: 'assistant',
 *   content: 'Hello, User!',
 *   timestamp: Date.now(),
 *   streaming: false,
 *   taskIds: [],
 * };
 * ```
 */
export const agentMessageSchema = z.discriminatedUnion("role", [
  userMessageSchema,
  assistantMessageSchema,
]);

export type AgentMessage = z.infer<typeof agentMessageSchema>;

/**
 * Agent 应用状态 - 用户可见的 Agent 状态
 * 
 * 这个类型定义了前端 UI 可以显示的所有 Agent 状态信息。
 * 它应该是一个只读的、用户友好的状态表示，不包含内部实现细节。
 * 
 * 注意：
 * - Agent 的处理状态可以从 `tasks` 的状态以及 `messages` 中的 `streaming` 字段推断
 * - Agent 的错误信息应该通过 Agent 向用户发送消息的方式告知，而不是通过单独的 error 字段
 * - 如果是网络连接等前端错误，导致无法正常和 Agent 沟通，应该在 AgentAppState 之外用其他的状态标识
 * 
 * @example
 * ```typescript
 * const state: AgentAppState = {
 *   messages: [
 *     { id: '1', role: 'user', content: 'Hello', timestamp: Date.now(), taskIds: [] },
 *   ],
 *   tasks: [
 *     { id: 'task-1', status: 'running', summary: '搜索相关信息' },
 *   ],
 * };
 * ```
 */
export const agentAppStateSchema = z
  .object({
    /**
     * 消息列表
     * 包含用户和 Agent 之间的对话消息，按时间顺序排列
     * 可以通过 messages 中的 streaming 字段判断是否有正在流式输出的消息
     */
    messages: z.array(agentMessageSchema).readonly(),

    /**
     * Task 列表
     * 包含所有 Agent 执行的任务
     * 可以通过 tasks 的状态（running、pending 等）推断 Agent 的处理状态
     */
    tasks: z.array(agentTaskSchema).readonly(),
  })
  .readonly();

export type AgentAppState = z.infer<typeof agentAppStateSchema>;
