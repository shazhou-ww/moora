// ============================================================================
// Agent Input 类型定义
// ============================================================================

import { z } from "zod";
import { toolCallResultSchema } from "./state";

/**
 * 收到用户消息输入
 *
 * 当用户发送消息时触发。
 */
export const userMessageInputSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("user-message"),

  /**
   * 消息 ID
   */
  messageId: z.string(),

  /**
   * 消息内容
   */
  content: z.string(),

  /**
   * 消息时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type UserMessageInput = z.infer<typeof userMessageInputSchema>;

/**
 * LLM 发送给 User 的 Chunk 输入
 *
 * 当 LLM 流式输出时，每个 chunk 触发一次。
 */
export const llmChunkInputSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("llm-chunk"),

  /**
   * 消息 ID
   */
  messageId: z.string(),

  /**
   * Chunk 内容
   */
  chunk: z.string(),
});

export type LlmChunkInput = z.infer<typeof llmChunkInputSchema>;

/**
 * LLM 发送给 User 的消息完成输入
 *
 * 当 LLM 完成一条消息的流式输出时触发。
 */
export const llmMessageCompleteInputSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("llm-message-complete"),

  /**
   * 消息 ID
   */
  messageId: z.string(),
});

export type LlmMessageCompleteInput = z.infer<
  typeof llmMessageCompleteInputSchema
>;

/**
 * 发起 ToolCall（外部）输入
 *
 * 当开始调用外部工具时触发。
 */
export const toolCallStartedInputSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("tool-call-started"),

  /**
   * Tool Call ID
   */
  toolCallId: z.string(),

  /**
   * 工具名称
   */
  name: z.string(),

  /**
   * 参数（序列化为 string）
   */
  parameters: z.string(),

  /**
   * 调用时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type ToolCallStartedInput = z.infer<typeof toolCallStartedInputSchema>;

/**
 * 收到 ToolCall 结果（外部）输入
 *
 * 当外部工具调用完成时触发。
 */
export const toolCallResultInputSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("tool-call-result"),

  /**
   * Tool Call ID
   */
  toolCallId: z.string(),

  /**
   * 调用结果
   * - 成功：包含结果内容
   * - 失败：包含错误信息
   */
  result: toolCallResultSchema,
});

export type ToolCallResultInput = z.infer<typeof toolCallResultInputSchema>;

/**
 * 扩展上下文窗口输入
 *
 * 当需要扩展当前 ReAct Loop 上下文窗口时触发。
 */
export const expandContextWindowInputSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("expand-context-window"),
});

export type ExpandContextWindowInput = z.infer<
  typeof expandContextWindowInputSchema
>;

/**
 * 加载历史 ToolCall 结果到当前 ReAct Loop 输入
 *
 * 当需要将历史 Tool Call 添加到当前 ReAct Loop 上下文时触发。
 */
export const addToolCallsToContextInputSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("add-tool-calls-to-context"),

  /**
   * 要添加的 Tool Call ID 列表
   */
  toolCallIds: z.array(z.string()),
});

export type AddToolCallsToContextInput = z.infer<
  typeof addToolCallsToContextInputSchema
>;

/**
 * Agent 输入信号
 *
 * Agent 状态机可以接收的所有输入类型。
 * 使用 Discriminated Union 类型，通过 `type` 字段区分。
 */
export const agentInputSchema = z.discriminatedUnion("type", [
  userMessageInputSchema,
  llmChunkInputSchema,
  llmMessageCompleteInputSchema,
  toolCallStartedInputSchema,
  toolCallResultInputSchema,
  expandContextWindowInputSchema,
  addToolCallsToContextInputSchema,
]);

export type AgentInput = z.infer<typeof agentInputSchema>;

