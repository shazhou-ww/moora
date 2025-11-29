// ============================================================================
// Agent Input 类型定义
// ============================================================================

import { z } from "zod";
import { toolCallResultSchema } from "./state";

/**
 * 收到用户消息
 *
 * 当用户发送消息时触发。
 */
export const userMessageReceivedSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("user-message-received"),

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

export type UserMessageReceived = z.infer<typeof userMessageReceivedSchema>;

/**
 * LLM 消息开始
 *
 * 当 LLM 开始流式输出一条消息时触发。
 * 此事件会在 state 中创建一个 content 为空字符串的 assistant message，
 * 在 streaming 过程中 content 保持为空，直到 llm-message-completed 事件触发。
 */
export const llmMessageStartedSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("llm-message-started"),

  /**
   * 消息 ID
   */
  messageId: z.string(),

  /**
   * 时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type LlmMessageStarted = z.infer<typeof llmMessageStartedSchema>;

/**
 * LLM 消息完成
 *
 * 当 LLM 完成一条消息的流式输出时触发。
 * 注意：在 streaming 过程中，state 中的 assistant message content 保持为空字符串，
 * 只有在此事件触发时才更新为完整的 content。
 */
export const llmMessageCompletedSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("llm-message-completed"),

  /**
   * 消息 ID
   */
  messageId: z.string(),

  /**
   * 完整的消息内容
   */
  content: z.string(),

  /**
   * 时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type LlmMessageCompleted = z.infer<typeof llmMessageCompletedSchema>;

/**
 * Tool Call 开始
 *
 * 当开始调用外部工具时触发。
 */
export const toolCallStartedSchema = z.object({
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

export type ToolCallStarted = z.infer<typeof toolCallStartedSchema>;

/**
 * Tool Call 完成
 *
 * 当外部工具调用完成时触发。
 */
export const toolCallCompletedSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("tool-call-completed"),

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

  /**
   * 时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type ToolCallCompleted = z.infer<typeof toolCallCompletedSchema>;

/**
 * 上下文窗口已扩展
 *
 * 当需要扩展当前 ReAct Loop 上下文窗口时触发。
 */
export const contextWindowExpandedSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("context-window-expanded"),

  /**
   * 时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type ContextWindowExpanded = z.infer<typeof contextWindowExpandedSchema>;

/**
 * 历史 Tool Calls 已添加
 *
 * 当需要将历史 Tool Call 添加到当前 ReAct Loop 上下文时触发。
 */
export const historyToolCallsAddedSchema = z.object({
  /**
   * 输入类型标识
   */
  type: z.literal("history-tool-calls-added"),

  /**
   * 要添加的 Tool Call ID 列表
   */
  toolCallIds: z.array(z.string()),

  /**
   * 时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type HistoryToolCallsAdded = z.infer<
  typeof historyToolCallsAddedSchema
>;

/**
 * Agent 输入信号
 *
 * Agent 状态机可以接收的所有输入类型。
 * 使用 Discriminated Union 类型，通过 `type` 字段区分。
 */
export const agentInputSchema = z.discriminatedUnion("type", [
  userMessageReceivedSchema,
  llmMessageStartedSchema,
  llmMessageCompletedSchema,
  toolCallStartedSchema,
  toolCallCompletedSchema,
  contextWindowExpandedSchema,
  historyToolCallsAddedSchema,
]);

export type AgentInput = z.infer<typeof agentInputSchema>;

