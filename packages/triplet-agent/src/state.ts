// ============================================================================
// 步骤 4：聚焦通道关注点 - 定义每条 Channel 的 State Schema
// ============================================================================

import { z } from "zod";
import { messageSchema } from "./io";

// ============================================================================
// Channel USER -> AGENT 的 State Schema
// ============================================================================

/**
 * Channel USER -> AGENT 的 State Schema
 * 
 * Agent 对 User 状态的关注点：
 * - 用户发送的消息列表
 * - 被取消流式输出的消息 ID 列表
 */
export const stateUserAgentSchema = z.object({
  userMessages: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      timestamp: z.number(),
    })
  ),
  canceledStreamingMessageIds: z.array(z.string()),
});

export type StateUserAgent = z.infer<typeof stateUserAgentSchema>;

// ============================================================================
// Channel AGENT -> TOOLKIT 的 State Schema
// ============================================================================

/**
 * Channel AGENT -> TOOLKIT 的 State Schema
 * 
 * Toolkit 对 Agent 状态的关注点：
 * - 待执行的工具调用请求列表
 */
export const stateAgentToolkitSchema = z.object({
  pendingToolCalls: z.array(
    z.object({
      toolCallId: z.string(),
      toolName: z.string(),
      parameters: z.string(), // JSON string
      timestamp: z.number(),
    })
  ),
});

export type StateAgentToolkit = z.infer<typeof stateAgentToolkitSchema>;

// ============================================================================
// Channel TOOLKIT -> AGENT 的 State Schema
// ============================================================================

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
 * - 消息列表（用于显示）
 * - 正在流式输出的消息对应的 chunks（Record<messageId, chunks[]>）
 *   注意：streamingChunks 的 keys 就是正在流式输出的消息 ID 列表
 */
export const stateAgentUserSchema = z.object({
  messages: z.array(messageSchema),
  streamingChunks: z.record(z.string(), z.array(z.string())),
});

export type StateAgentUser = z.infer<typeof stateAgentUserSchema>;

// ============================================================================
// Channel USER -> USER (Loopback) 的 State Schema
// ============================================================================

/**
 * Channel USER -> USER (Loopback) 的 State Schema
 * 
 * User 对自身状态的关注点：
 * - 用户操作历史（用于状态迭代感知）
 */
export const stateUserUserSchema = z.object({
  actionHistory: z.array(
    z.object({
      type: z.enum(["sendMessage", "cancelStreaming"]),
      messageId: z.string(),
      timestamp: z.number(),
    })
  ),
});

export type StateUserUser = z.infer<typeof stateUserUserSchema>;

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
  processingHistory: z.array(
    z.object({
      type: z.enum(["callTool", "sendChunk", "completeMessage"]),
      toolCallId: z.string().optional(),
      messageId: z.string().optional(),
      timestamp: z.number(),
    })
  ),
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
  executionHistory: z.array(
    z.object({
      type: z.enum(["toolResult", "toolError"]),
      toolCallId: z.string(),
      toolName: z.string(),
      timestamp: z.number(),
    })
  ),
});

export type StateToolkitToolkit = z.infer<typeof stateToolkitToolkitSchema>;

