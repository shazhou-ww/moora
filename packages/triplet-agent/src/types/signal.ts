// ============================================================================
// 步骤 2：理 I/O - 定义每个参与方的 Input/Output Schema
// ============================================================================

import { z } from "zod";
import type { Participants } from "./topology";
import { USER, AGENT, TOOLKIT } from "./topology";

// ============================================================================
// 共享的消息类型定义
// ============================================================================

/**
 * 消息 Schema（User 和 Agent 共用）
 * 
 * 支持三种角色：
 * - user: 用户消息
 * - assistant: 助手消息（包括工具调用请求）
 * - tool: 工具执行结果消息
 */
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string(),
  timestamp: z.number(),
});

export type Message = z.infer<typeof messageSchema>;

// ============================================================================
// User 节点的 I/O Schema
// ============================================================================

/**
 * User 节点的 Input Schema
 * 
 * InputForUser 就是 UI State，表示用户界面需要展示的状态。
 * 包含消息列表和正在流式输出的消息 ID 列表。
 */
export const inputForUserSchema = z.object({
  messages: z.array(messageSchema),
  streamingMessageIds: z.array(z.string()),
});

export type InputForUser = z.infer<typeof inputForUserSchema>;

/**
 * User 节点的 Output Schema
 * 
 * OutputFromUser 就是 User Actions，表示用户的操作。
 * 例如：发送消息、取消流式输出等。
 */
export const outputFromUserSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("sendMessage"),
    messageId: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("cancelStreaming"),
    messageId: z.string(),
  }),
]);

export type OutputFromUser = z.infer<typeof outputFromUserSchema>;

// ============================================================================
// Agent 节点的 I/O Schema
// ============================================================================

/**
 * 工具定义 Schema
 * 
 * 注意：run 函数不能在 Zod Schema 中定义，使用 TypeScript 类型定义
 */
export const toolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  schema: z.string(), // JSON string (parameters schema)
  // run 函数通过 TypeScript 类型定义，不在 Schema 中
});

/**
 * 工具定义类型
 * 
 * 包含 run 函数：parameters: string -> Promise<string>
 */
export type ToolDefinition = z.infer<typeof toolDefinitionSchema> & {
  run: (parameters: string) => Promise<string>;
};

/**
 * Agent 节点的 Input Schema
 * 
 * InputForAgent 表示 Agent 接收到的信息：
 * - 所有消息列表（user & assistant）
 * - 工具执行结果列表
 * - 系统提示词（prompt）
 * - 可用工具定义列表
 */
export const inputForAgentSchema = z.object({
  messages: z.array(messageSchema),
  toolResults: z.array(
    z.object({
      toolCallId: z.string(),
      toolName: z.string(),
      result: z.string(),
      timestamp: z.number(),
    })
  ),
  prompt: z.string(), // system prompt
  tools: z.array(toolDefinitionSchema),
});

export type InputForAgent = z.infer<typeof inputForAgentSchema>;

/**
 * Agent 节点的 Output Schema
 * 
 * OutputFromAgent 表示 Agent 产生的操作：
 * - 调用工具
 * - 发送消息块（流式输出）
 * - 完成消息（流式输出结束）
 */
export const outputFromAgentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("callTool"),
    toolCallId: z.string(),
    toolName: z.string(),
    parameters: z.string(), // JSON string
  }),
  z.object({
    type: z.literal("sendChunk"),
    messageId: z.string(),
    chunk: z.string(),
    // 记录处理了哪些用户消息 ID（用于跟踪处理进度）
    processedUserMessageIds: z.array(z.string()).optional(),
    // 记录处理了哪些工具结果 ID（用于跟踪处理进度）
    processedToolResultIds: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal("completeMessage"),
    messageId: z.string(),
    // 记录处理了哪些用户消息 ID（用于跟踪处理进度）
    processedUserMessageIds: z.array(z.string()).optional(),
    // 记录处理了哪些工具结果 ID（用于跟踪处理进度）
    processedToolResultIds: z.array(z.string()).optional(),
  }),
]);

export type OutputFromAgent = z.infer<typeof outputFromAgentSchema>;

// ============================================================================
// Toolkit 节点的 I/O Schema
// ============================================================================

/**
 * Toolkit 节点的 Input Schema
 * 
 * InputForToolkit 表示 Toolkit 接收到的待执行工具调用请求。
 */
export const inputForToolkitSchema = z.object({
  pendingToolCalls: z.array(
    z.object({
      toolCallId: z.string(),
      toolName: z.string(),
      parameters: z.string(), // JSON string
    })
  ),
});

export type InputForToolkit = z.infer<typeof inputForToolkitSchema>;

/**
 * Toolkit 节点的 Output Schema
 * 
 * OutputFromToolkit 表示 Toolkit 执行工具后返回的结果。
 */
export const outputFromToolkitSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("toolResult"),
    toolCallId: z.string(),
    toolName: z.string(),
    result: z.string(),
  }),
  z.object({
    type: z.literal("toolError"),
    toolCallId: z.string(),
    toolName: z.string(),
    error: z.string(),
  }),
]);

export type OutputFromToolkit = z.infer<typeof outputFromToolkitSchema>;

// ============================================================================
// 工具类型：根据参与者类型推导对应的 Input/Output 类型
// ============================================================================

/**
 * 根据参与者类型推导对应的 Input 类型
 */
export type InputFor<P extends Participants> = 
  P extends typeof USER ? InputForUser :
  P extends typeof AGENT ? InputForAgent :
  P extends typeof TOOLKIT ? InputForToolkit :
  never;

/**
 * 根据参与者类型推导对应的 Output 类型
 */
export type OutputFrom<P extends Participants> = 
  P extends typeof USER ? OutputFromUser :
  P extends typeof AGENT ? OutputFromAgent :
  P extends typeof TOOLKIT ? OutputFromToolkit :
  never;

/**
 * 运行 Effect 的函数类型
 * 
 * 接收 InputFor<P>，返回 Promise<OutputFrom<P>>
 */
export type RunEffectFn<P extends Participants> = (
  input: InputFor<P>
) => Promise<OutputFrom<P>>;

