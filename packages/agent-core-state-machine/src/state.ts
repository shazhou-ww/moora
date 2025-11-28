// ============================================================================
// Agent State 类型定义
// ============================================================================

import { z } from "zod";
import { agentMessageSchema } from "@moora/agent-webui-protocol";

/**
 * 工具定义
 *
 * 外部工具的配置信息，包括描述和参数 schema。
 */
export const toolDefinitionSchema = z
  .object({
    /**
     * 工具描述
     */
    description: z.string(),

    /**
     * 参数 JSON Schema（序列化的 JSON Schema string）
     */
    schema: z.string(),
  })
  .readonly();

export type ToolDefinition = z.infer<typeof toolDefinitionSchema>;

/**
 * Tool Call 成功结果
 */
export const toolCallSuccessSchema = z
  .object({
    /**
     * 是否成功
     */
    isSuccess: z.literal(true),

    /**
     * 结果内容（string）
     */
    content: z.string(),
  })
  .readonly();

export type ToolCallSuccess = z.infer<typeof toolCallSuccessSchema>;

/**
 * Tool Call 失败结果
 */
export const toolCallFailedSchema = z
  .object({
    /**
     * 是否成功
     */
    isSuccess: z.literal(false),

    /**
     * 错误信息
     */
    error: z.string(),
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
 * 记录一次外部工具调用的完整信息。
 */
export const toolCallRecordSchema = z
  .object({
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

    /**
     * 调用结果
     * - 成功：包含结果内容
     * - 失败：包含错误信息
     * - null：尚未完成
     */
    result: toolCallResultSchema.nullable(),
  })
  .readonly();

export type ToolCallRecord = z.infer<typeof toolCallRecordSchema>;

/**
 * ReAct Loop 上下文
 *
 * 当前 ReAct Loop 涉及到的历史消息和 Tool Call。
 */
export const reactContextSchema = z
  .object({
    /**
     * 上下文窗口大小
     *
     * 表示当前 ReAct Loop 应该包含最近多少条消息。
     */
    contextWindowSize: z.number().int().positive(),

    /**
     * 涉及到的 Tool Calls（Tool Call Id 列表）
     */
    toolCallIds: z.array(z.string()).readonly(),
  })
  .readonly();

export type ReactContext = z.infer<typeof reactContextSchema>;

/**
 * Agent 状态
 *
 * Agent 的完整内部状态，包含历史消息、外部工具、历史 Tool Call 记录和当前 ReAct Loop 上下文。
 */
export const agentStateSchema = z
  .object({
    /**
     * 历史消息
     *
     * 按时间顺序排序的数组，包含所有用户和助手消息
     */
    messages: z.array(agentMessageSchema).readonly(),

    /**
     * 外部工具
     *
     * 组织成 Record<string, ToolDefinition> 的形式，key 为 toolName
     * 包含所有已加载的外部工具定义
     */
    tools: z.record(z.string(), toolDefinitionSchema).readonly(),

    /**
     * 历史 Tool Call 记录
     *
     * 组织成 Record<string, ToolCallRecord> 的形式，key 为 toolCallId
     * 包含所有外部工具调用的历史记录
     */
    toolCalls: z.record(z.string(), toolCallRecordSchema).readonly(),

    /**
     * 当前 ReAct Loop 上下文
     *
     * 包含当前 ReAct Loop 涉及到的历史消息和 Tool Call
     */
    reactContext: reactContextSchema,
  })
  .readonly();

export type AgentState = z.infer<typeof agentStateSchema>;

