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
 */
export const assistantMessageSchema = z
  .object({
    kind: z.literal("assistant"),
    id: z.string(),
    content: z.string(),
    receivedAt: z.number(),
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
 */
export const toolCallRecordSchema = z
  .object({
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
     * 历史消息
     *
     * 按时间顺序排序的数组，包含所有用户和助手消息。
     */
    messages: z.array(reflexorMessageSchema).readonly(),

    /**
     * 历史 Tool Call 记录
     *
     * 组织成 Record<string, ToolCallRecord> 的形式，key 为 toolCallId。
     */
    toolCalls: z.record(z.string(), toolCallRecordSchema).readonly(),

    /**
     * 最后一次接收用户消息的时间戳（Unix 时间戳，毫秒）
     *
     * 用于快速判断是否有新的用户消息需要处理。
     */
    lastUserMessageReceivedAt: z.number(),

    /**
     * 最后一次接收工具调用结果的时间戳（Unix 时间戳，毫秒）
     *
     * 用于快速判断是否有新的工具调用结果需要处理。
     */
    lastToolCallResultReceivedAt: z.number(),

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
