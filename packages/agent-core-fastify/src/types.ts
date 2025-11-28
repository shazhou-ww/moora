// ============================================================================
// Agent Core Fastify 类型定义
// ============================================================================

import type { AgentInput, AgentState } from "@moora/agent-core-state-machine";
import type { MoorexNode } from "@moora/moorex-fastify";

// ============================================================================
// Agent Effect 相关类型
// ============================================================================

/**
 * LLM 调用 Effect
 */
export type CallLLMEffect = {
  type: "call-llm";
  /**
   * Effect ID（用于 reconciliation）
   */
  id: string;
  /**
   * 请求 ID
   */
  requestId: string;
  /**
   * LLM 调用 ID
   */
  callId: string;
  /**
   * 提示词
   */
  prompt: string;
  /**
   * 系统提示词（可选）
   */
  systemPrompt?: string;
  /**
   * 消息历史（用于上下文）
   */
  messageHistory?: Array<{ role: "user" | "assistant"; content: string }>;
};

/**
 * Tool 调用 Effect
 */
export type CallToolEffect = {
  type: "call-tool";
  /**
   * Effect ID（用于 reconciliation）
   */
  id: string;
  /**
   * 请求 ID
   */
  requestId: string;
  /**
   * Tool 调用 ID
   */
  callId: string;
  /**
   * Tool 名称
   */
  toolName: string;
  /**
   * Tool 参数（JSON 字符串）
   */
  parameter: string;
};

/**
 * Agent Effect 类型
 * 
 * 描述 Agent 可能触发的副作用行为。
 * 注意：这里的 Effects 不包含向用户发送消息，因为前端是通过同步 AgentState 来获取消息的。
 */
export type AgentEffect = CallLLMEffect | CallToolEffect;

/**
 * LLM 调用函数类型
 */
export type LLMCallFn = (options: {
  prompt: string;
  systemPrompt?: string;
  messageHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}) => Promise<string>;

/**
 * Tool 定义
 */
export type Tool = {
  /**
   * Tool 名称
   */
  name: string;
  /**
   * Tool 描述
   */
  description: string;
  /**
   * Tool 参数 schema（JSON Schema 格式）
   */
  parameters?: Record<string, unknown>;
  /**
   * Tool 执行函数
   */
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Agent Moorex 选项
 */
export type AgentMoorexOptions = {
  /**
   * LLM 调用函数
   */
  callLLM: LLMCallFn;
  /**
   * 可用的 Tools
   */
  tools?: Record<string, Tool>;
  /**
   * 初始上下文窗口大小，默认为 10
   */
  initialContextWindowSize?: number;
  /**
   * 每次扩展上下文窗口的增量，默认为 10
   */
  expandContextWindowSize?: number;
};

// ============================================================================
// Agent Fastify Node 相关类型
// ============================================================================

/**
 * 创建 Agent Fastify Node 的选项
 */
export type CreateAgentFastifyNodeOptions = AgentMoorexOptions;

/**
 * Agent Fastify Node 实例
 */
export type AgentFastifyNode = MoorexNode<AgentInput, AgentEffect, AgentState>;

