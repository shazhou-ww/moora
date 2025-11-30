// ============================================================================
// Agent Core Fastify 类型定义
// ============================================================================

import type {
  AgentInput,
  AgentState,
  ReActObservation,
} from "@moora/agent-core-state-machine";
import type { MoorexNode } from "@moora/moorex-fastify";

// ============================================================================
// Agent Effect 相关类型
// ============================================================================

/**
 * LLM 调用 Effect
 */
export type CallLlmEffect = {
  type: "call-llm";
  /**
   * ReAct Context 更新时间戳
   * 
   * 从 reActContext.updatedAt 获取，用于标识当前 ReAct Loop 的上下文版本。
   */
  contextUpdatedAt: number;
};

/**
 * Tool 调用 Effect
 */
export type CallToolEffect = {
  type: "call-tool";
  /**
   * Tool 调用 ID
   * 
   * 用于标识需要调用的 Tool Call。
   */
  toolCallId: string;
};

/**
 * Agent Effect 类型
 * 
 * 描述 Agent 可能触发的副作用行为。
 * 注意：这里的 Effects 不包含向用户发送消息，因为前端是通过同步 AgentState 来获取消息的。
 */
export type AgentEffect = CallLlmEffect | CallToolEffect;

type ContinueReActObservation = Extract<
  ReActObservation,
  { type: "continue-re-act" }
>;

type CompleteReActObservation = Extract<
  ReActObservation,
  { type: "complete-re-act" }
>;

export type CallLlmContinueResult = {
  observation: ContinueReActObservation;
};

export type CallLlmCompleteResult = {
  observation: CompleteReActObservation;
  response: string;
};

export type CallLlmResult = CallLlmContinueResult | CallLlmCompleteResult;

/**
 * LLM 调用函数类型
 */
export type CallLlmFn = (options: {
  prompt: string;
  messages: AgentState["messages"];
  toolCalls: AgentState["toolCalls"];
  tools: AgentState["tools"];
}) => Promise<CallLlmResult>;

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
  callLLM: CallLlmFn;
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

