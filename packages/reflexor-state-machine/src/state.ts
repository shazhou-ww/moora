// ============================================================================
// Reflexor State 类型定义
// ============================================================================

import { z } from "zod";

// ============================================================================
// 消息类型
// ============================================================================

/**
 * 用户消息
 */
export const userMessageSchema = z
  .object({
    kind: z.literal("user"),
    id: z.string(),
    content: z.string(),
    receivedAt: z.number(),
  })
  .readonly();

export type UserMessage = z.infer<typeof userMessageSchema>;

/**
 * 助手消息
 *
 * 包含两个时间戳：
 * - receivedAt: 消息开始接收的时间（streaming 开始）
 * - updatedAt: 消息最后更新的时间（streaming 完成或内容更新）
 */
export const assistantMessageSchema = z
  .object({
    kind: z.literal("assistant"),
    id: z.string(),
    content: z.string(),
    receivedAt: z.number(),
    updatedAt: z.number(),
  })
  .readonly();

export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

/**
 * 消息类型
 */
export const reflexorMessageSchema = z.discriminatedUnion("kind", [
  userMessageSchema,
  assistantMessageSchema,
]);

export type ReflexorMessage = z.infer<typeof reflexorMessageSchema>;

// ============================================================================
// Tool Call 类型
// ============================================================================

/**
 * Tool Call 请求
 */
export const toolCallRequestSchema = z
  .object({
    name: z.string(),
    parameters: z.string(),
    calledAt: z.number(),
  })
  .readonly();

export type ToolCallRequest = z.infer<typeof toolCallRequestSchema>;

/**
 * Tool Call 成功结果
 */
export const toolCallSuccessSchema = z
  .object({
    isSuccess: z.literal(true),
    content: z.string(),
    receivedAt: z.number(),
  })
  .readonly();

export type ToolCallSuccess = z.infer<typeof toolCallSuccessSchema>;

/**
 * Tool Call 失败结果
 */
export const toolCallFailedSchema = z
  .object({
    isSuccess: z.literal(false),
    error: z.string(),
    receivedAt: z.number(),
  })
  .readonly();

export type ToolCallFailed = z.infer<typeof toolCallFailedSchema>;

/**
 * Tool Call 结果
 */
export const toolCallResultSchema = z.discriminatedUnion("isSuccess", [
  toolCallSuccessSchema,
  toolCallFailedSchema,
]);

export type ToolCallResult = z.infer<typeof toolCallResultSchema>;

/**
 * Tool Call 记录
 *
 * 包含 id 字段，用于唯一标识每个 tool call。
 */
export const toolCallRecordSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    parameters: z.string(),
    calledAt: z.number(),
    result: toolCallResultSchema.nullable(),
  })
  .readonly();

export type ToolCallRecord = z.infer<typeof toolCallRecordSchema>;

// ============================================================================
// 上下文优化类型
// ============================================================================

/**
 * 上下文压缩优化
 */
export const contextCompressSchema = z
  .object({
    kind: z.literal("compress"),
    summary: z.string(),
  })
  .readonly();

export type ContextCompress = z.infer<typeof contextCompressSchema>;

/**
 * 加载历史消息优化
 */
export const contextLoadHistorySchema = z
  .object({
    kind: z.literal("load-history"),
    messages: z.array(reflexorMessageSchema).readonly(),
  })
  .readonly();

export type ContextLoadHistory = z.infer<typeof contextLoadHistorySchema>;

/**
 * 加载历史 Tool Result 优化
 */
export const contextLoadToolResultsSchema = z
  .object({
    kind: z.literal("load-tool-results"),
    toolCallIds: z.array(z.string()).readonly(),
  })
  .readonly();

export type ContextLoadToolResults = z.infer<
  typeof contextLoadToolResultsSchema
>;

/**
 * 上下文优化操作
 */
export const contextRefinementSchema = z.discriminatedUnion("kind", [
  contextCompressSchema,
  contextLoadHistorySchema,
  contextLoadToolResultsSchema,
]);

export type ContextRefinement = z.infer<typeof contextRefinementSchema>;

// ============================================================================
// 主状态类型
// ============================================================================

/**
 * Reflexor 状态
 *
 * Agent 的完整内部状态，包含历史消息和 Tool Call 记录。
 *
 * 数据组织方式：
 * - userMessages, assistantMessages, toolCallRecords: 按生成时间顺序排序的数组
 * - assistantMessageIndex, toolCallIndex: id 到数组序号的索引，方便快速定位修改
 */
export const reflexorStateSchema = z
  .object({
    /**
     * 状态最后更新时间戳（Unix 时间戳，毫秒）
     *
     * 用于时间不可逆检查。
     */
    updatedAt: z.number(),

    /**
     * 用户消息列表
     *
     * 按 receivedAt 时间顺序排序的数组。
     */
    userMessages: z.array(userMessageSchema).readonly(),

    /**
     * 助手消息列表
     *
     * 按 receivedAt 时间顺序排序的数组。
     */
    assistantMessages: z.array(assistantMessageSchema).readonly(),

    /**
     * 助手消息索引
     *
     * 从 assistantMessage.id 到 assistantMessages 数组序号的映射，
     * 方便快速定位和修改。
     */
    assistantMessageIndex: z.record(z.string(), z.number()).readonly(),

    /**
     * Tool Call 记录列表
     *
     * 按 calledAt 时间顺序排序的数组。
     */
    toolCallRecords: z.array(toolCallRecordSchema).readonly(),

    /**
     * Tool Call 索引
     *
     * 从 toolCallRecord.id 到 toolCallRecords 数组序号的映射，
     * 方便快速定位和修改。
     */
    toolCallIndex: z.record(z.string(), z.number()).readonly(),

    /**
     * 最近一次调用 LLM 的时间戳
     *
     * 用于判断是否需要再次调用 LLM。
     */
    calledBrainAt: z.number(),

    /**
     * 当前是否正在等待 Brain 响应
     */
    isWaitingBrain: z.boolean(),

    /**
     * 待处理的 Tool Call IDs
     *
     * 当 Brain 请求调用工具时，这些 ID 会被添加到此列表。
     * 当工具返回结果时，对应的 ID 会被移除。
     */
    pendingToolCallIds: z.array(z.string()).readonly(),
  })
  .readonly();

export type ReflexorState = z.infer<typeof reflexorStateSchema>;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 合并用户消息和助手消息，按 receivedAt 时间排序
 *
 * @param state - Reflexor 状态
 * @returns 按时间顺序排序的消息数组
 */
export function getMergedMessages(state: ReflexorState): ReflexorMessage[] {
  const allMessages: ReflexorMessage[] = [
    ...state.userMessages,
    ...state.assistantMessages,
  ];

  return allMessages.sort((a, b) => a.receivedAt - b.receivedAt);
}

/**
 * 获取所有消息的 ID 集合
 *
 * @param state - Reflexor 状态
 * @returns 所有消息 ID 的集合
 */
export function getAllMessageIds(state: ReflexorState): Set<string> {
  const ids = new Set<string>();

  for (const msg of state.userMessages) {
    ids.add(msg.id);
  }

  for (const msg of state.assistantMessages) {
    ids.add(msg.id);
  }

  return ids;
}

/**
 * 获取最后一个用户消息的接收时间
 *
 * @param state - Reflexor 状态
 * @returns 最后一个用户消息的 receivedAt，如果没有用户消息则返回 0
 */
export function getLastUserMessageReceivedAt(state: ReflexorState): number {
  const lastMessage = state.userMessages[state.userMessages.length - 1];
  return lastMessage?.receivedAt ?? 0;
}

/**
 * 获取最后一个 Tool Call 结果的接收时间
 *
 * @param state - Reflexor 状态
 * @returns 最后一个有结果的 tool call 的 result.receivedAt，如果没有则返回 0
 */
export function getLastToolCallResultReceivedAt(state: ReflexorState): number {
  let lastReceivedAt = 0;

  for (const toolCall of state.toolCallRecords) {
    if (toolCall.result !== null) {
      lastReceivedAt = Math.max(lastReceivedAt, toolCall.result.receivedAt);
    }
  }

  return lastReceivedAt;
}
