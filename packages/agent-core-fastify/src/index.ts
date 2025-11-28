// ============================================================================
// Agent Core Fastify 导出
// ============================================================================

/**
 * Agent Core Fastify
 * 
 * 提供 Agent 的 Fastify 集成，包括：
 * - Agent Moorex: Effects 处理逻辑
 * - Agent Fastify Node: Fastify 节点创建
 */

// ============================================================================
// 导出所有类型
// ============================================================================
export type {
  // Agent Effect 相关
  AgentEffect,
  CallLLMEffect,
  CallToolEffect,
  LLMCallFn,
  Tool,
  AgentMoorexOptions,
  // Agent Fastify Node 相关
  CreateAgentFastifyNodeOptions,
  AgentFastifyNode,
} from "./types";

// ============================================================================
// 导出 Agent Moorex
// ============================================================================
export {
  agentEffectsAt,
  createAgentRunEffect,
  createAgentMoorexDefinition,
} from "./agent-moorex";

// ============================================================================
// 导出 Agent Fastify Node
// ============================================================================
export { createAgentFastifyNode } from "./create-agent-fastify-node";

