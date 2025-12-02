// ============================================================================
// 步骤 4：聚焦通道关注点 - 定义每条 Channel 的 State Schema
// ============================================================================

import { z } from "zod";
import { messageSchema } from "./signal";

// ============================================================================
// 公共 Schema 和类型定义（供 Channel State 和统合 State 复用）
// ============================================================================

/**
 * 用户消息 Schema（公共类型）
 */
export const userMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.number(),
});

export type UserMessage = z.infer<typeof userMessageSchema>;

/**
 * 工具调用 Schema（公共类型）
 */
export const toolCallSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  parameters: z.string(), // JSON string
  timestamp: z.number(),
});

export type ToolCall = z.infer<typeof toolCallSchema>;

/**
 * 工具执行成功结果 Schema
 */
export const toolResultSuccessSchema = z.object({
  isSuccess: z.literal(true),
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.string(),
  timestamp: z.number(),
});

export type ToolResultSuccess = z.infer<typeof toolResultSuccessSchema>;

/**
 * 工具执行失败结果 Schema
 */
export const toolResultFailureSchema = z.object({
  isSuccess: z.literal(false),
  toolCallId: z.string(),
  toolName: z.string(),
  error: z.string(),
  timestamp: z.number(),
});

export type ToolResultFailure = z.infer<typeof toolResultFailureSchema>;

/**
 * 工具执行结果 Schema（成功或失败）
 */
export const toolResultSchema = z.discriminatedUnion("isSuccess", [
  toolResultSuccessSchema,
  toolResultFailureSchema,
]);

export type ToolResult = z.infer<typeof toolResultSchema>;


/**
 * Agent 处理历史项 Schema（公共类型）
 * 
 * 记录 Agent 处理了哪些输入（用户消息、工具结果）以及产生的输出。
 */
export const agentProcessingHistoryItemSchema = z.object({
  type: z.enum(["callTool", "sendChunk", "completeMessage"]),
  toolCallId: z.string().optional(),
  messageId: z.string().optional(),
  // 记录处理了哪些用户消息 ID（用于判断是否有新的未处理消息）
  processedUserMessageIds: z.array(z.string()).optional(),
  // 记录处理了哪些工具结果 ID（用于判断是否有新的未处理结果）
  processedToolResultIds: z.array(z.string()).optional(),
  timestamp: z.number(),
});

export type AgentProcessingHistoryItem = z.infer<
  typeof agentProcessingHistoryItemSchema
>;

/**
 * Toolkit 执行历史项 Schema（公共类型）
 */
export const toolkitExecutionHistoryItemSchema = z.object({
  type: z.enum(["toolResult", "toolError"]),
  toolCallId: z.string(),
  toolName: z.string(),
  timestamp: z.number(),
});

export type ToolkitExecutionHistoryItem = z.infer<
  typeof toolkitExecutionHistoryItemSchema
>;

/**
 * Assistant 消息 Schema（公共类型）
 * 
 * 注意：这是专门用于 Agent -> User Channel 的消息类型，只包含 assistant 角色的消息。
 */
export const assistantMessageSchema = z.object({
  id: z.string(),
  role: z.literal("assistant"),
  content: z.string(),
  timestamp: z.number(),
});

export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

// ============================================================================
// Channel State Schema（使用公共 schema 组合）
// ============================================================================

/**
 * Channel USER -> AGENT 的 State Schema
 * 
 * Agent 对 User 状态的关注点：
 * - 用户发送的消息列表
 * - 被取消流式输出的消息 ID 列表
 */
export const stateUserAgentSchema = z.object({
  userMessages: z.array(userMessageSchema),
  canceledStreamingMessageIds: z.array(z.string()),
});

export type StateUserAgent = z.infer<typeof stateUserAgentSchema>;

/**
 * Channel AGENT -> TOOLKIT 的 State Schema
 * 
 * Toolkit 对 Agent 状态的关注点：
 * - 待执行的工具调用请求列表
 */
export const stateAgentToolkitSchema = z.object({
  pendingToolCalls: z.array(toolCallSchema),
});

export type StateAgentToolkit = z.infer<typeof stateAgentToolkitSchema>;

/**
 * Channel TOOLKIT -> AGENT 的 State Schema
 * 
 * Agent 对 Toolkit 状态的关注点：
 * - 工具执行结果列表（包含成功和失败的结果）
 */
export const stateToolkitAgentSchema = z.object({
  toolResults: z.array(toolResultSchema),
});

export type StateToolkitAgent = z.infer<typeof stateToolkitAgentSchema>;

// ============================================================================
// Channel AGENT -> USER 的 State Schema
// ============================================================================

/**
 * Channel AGENT -> USER 的 State Schema
 * 
 * User 对 Agent 状态的关注点：
 * - 消息列表（用于显示，只包含 assistant 角色的消息）
 * - 正在流式输出的消息对应的 chunks（Record<messageId, chunks[]>）
 *   注意：streamingChunks 的 keys 就是正在流式输出的消息 ID 列表
 */
export const stateAgentUserSchema = z.object({
  messages: z.array(assistantMessageSchema),
  streamingChunks: z.record(z.string(), z.array(z.string())),
});

export type StateAgentUser = z.infer<typeof stateAgentUserSchema>;


// ============================================================================
// Channel AGENT -> AGENT (Loopback) 的 State Schema
// ============================================================================

/**
 * Channel AGENT -> AGENT (Loopback) 的 State Schema
 * 
 * Agent 对自身状态的关注点：
 * - Agent 处理历史（用于状态迭代感知）
 */
export const stateAgentAgentSchema = z.object({
  processingHistory: z.array(agentProcessingHistoryItemSchema),
});

export type StateAgentAgent = z.infer<typeof stateAgentAgentSchema>;

// ============================================================================
// Channel TOOLKIT -> TOOLKIT (Loopback) 的 State Schema
// ============================================================================

/**
 * Channel TOOLKIT -> TOOLKIT (Loopback) 的 State Schema
 * 
 * Toolkit 对自身状态的关注点：
 * - 工具执行历史（用于状态迭代感知）
 */
export const stateToolkitToolkitSchema = z.object({
  executionHistory: z.array(toolkitExecutionHistoryItemSchema),
});

export type StateToolkitToolkit = z.infer<typeof stateToolkitToolkitSchema>;

