// ============================================================================
// Agent Input 类型定义
// ============================================================================

import { z } from "zod";
import {
  toolCallRequestSchema,
  toolCallResultSchema,
} from "./state";

/**
 * 基础 Agent 输入类型
 *
 * 所有 Agent 输入类型都包含时间戳字段。
 */
export const baseAgentInputSchema = z.object({
  /**
   * 时间戳（Unix 时间戳，毫秒）
   */
  timestamp: z.number(),
});

export type BaseAgentInput = z.infer<typeof baseAgentInputSchema>;

/**
 * 收到用户消息
 *
 * 当用户发送消息时触发。
 */
export const userMessageReceivedSchema = baseAgentInputSchema.extend({
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
});

export type UserMessageReceived = z.infer<typeof userMessageReceivedSchema>;

/**
 * LLM 消息开始
 *
 * 当 LLM 开始流式输出一条消息时触发。
 * 此事件会在 state 中创建一个 content 为空字符串的 assistant message，
 * 在 streaming 过程中 content 保持为空，直到 llm-message-completed 事件触发。
 */
export const llmMessageStartedSchema = baseAgentInputSchema.extend({
  /**
   * 输入类型标识
   */
  type: z.literal("llm-message-started"),

  /**
   * 消息 ID
   */
  messageId: z.string(),
});

export type LlmMessageStarted = z.infer<typeof llmMessageStartedSchema>;

/**
 * LLM 消息完成
 *
 * 当 LLM 完成一条消息的流式输出时触发。
 * 注意：在 streaming 过程中，state 中的 assistant message content 保持为空字符串，
 * 只有在此事件触发时才更新为完整的 content。
 */
export const llmMessageCompletedSchema = baseAgentInputSchema.extend({
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
});

export type LlmMessageCompleted = z.infer<typeof llmMessageCompletedSchema>;

/**
 * Tool Call 完成
 *
 * 当外部工具调用完成时触发。
 */
export const toolCallCompletedSchema = baseAgentInputSchema.extend({
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
});

export type ToolCallCompleted = z.infer<typeof toolCallCompletedSchema>;

/**
 * ReAct Loop 观察到的新结果
 *
 * 当 call-llm Effect 完成时触发，用于标记当前 ReAct Loop 的状态。
 */
const reActObservedContinueSchema = z.object({
  /**
   * 观察类型
   */
  type: z.literal("continue-re-act"),

  /**
   * 需要发起的 Tool Call 列表
   */
  toolCalls: z.record(z.string(), toolCallRequestSchema).readonly(),
});

const reActObservedCompleteSchema = z.object({
  /**
   * 观察类型
   */
  type: z.literal("complete-re-act"),
});

export const reActObservationSchema = z.discriminatedUnion("type", [
  reActObservedContinueSchema,
  reActObservedCompleteSchema,
]);

export type ReActObservation = z.infer<typeof reActObservationSchema>;

export const reActObservedSchema = baseAgentInputSchema.extend({
  /**
   * 输入类型标识
   */
  type: z.literal("re-act-observed"),

  /**
   * call-llm 开始时间戳
   *
   * 用于表示这次 ReAct 观察对应的 LLM 调用何时开始。
   */
  calledLlmAt: z.number(),

  /**
   * 当前 ReAct Loop 观察结果
   */
  observation: reActObservationSchema,
});

export type ReActObserved = z.infer<typeof reActObservedSchema>;

/**
 * 上下文窗口已扩展
 *
 * 当需要扩展当前 ReAct Loop 上下文窗口时触发。
 */
export const contextWindowExpandedSchema = baseAgentInputSchema.extend({
  /**
   * 输入类型标识
   */
  type: z.literal("context-window-expanded"),
});

export type ContextWindowExpanded = z.infer<typeof contextWindowExpandedSchema>;

/**
 * 历史 Tool Calls 已添加
 *
 * 当需要将历史 Tool Call 添加到当前 ReAct Loop 上下文时触发。
 */
export const historyToolCallsAddedSchema = baseAgentInputSchema.extend({
  /**
   * 输入类型标识
   */
  type: z.literal("history-tool-calls-added"),

  /**
   * 要添加的 Tool Call ID 列表
   */
  toolCallIds: z.array(z.string()),
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
  toolCallCompletedSchema,
  reActObservedSchema,
  contextWindowExpandedSchema,
  historyToolCallsAddedSchema,
]);

export type AgentInput = z.infer<typeof agentInputSchema>;

