// ============================================================================
// Agent Fastify Node - 创建 Agent Fastify 节点
// ============================================================================

import type { AgentInput } from "@moora/agent-core-state-machine";
import type {
  AgentMoorexOptions,
  CreateAgentFastifyNodeOptions,
  AgentFastifyNode,
} from "./types";
import type { HandlePost } from "@moora/moorex-fastify";
import { createMoorex } from "@moora/moorex";
import { createMoorexNode } from "@moora/moorex-fastify";
import { createAgentMoorexDefinition } from "./agent-moorex";

/**
 * 创建 Agent Fastify Node
 * 
 * @param options - 创建选项
 * @returns Agent Fastify Node 实例
 * 
 * @example
 * ```typescript
 * const agentNode = createAgentFastifyNode({
 *   moorexOptions: {
 *     callLLM: async ({ prompt }) => 'Response',
 *     tools: { search: { ... } },
 *   },
 * });
 * 
 * // 注册到 Fastify
 * await fastify.register(agentNode.register, { prefix: '/api/agent' });
 * ```
 */
export const createAgentFastifyNode = (
  options: CreateAgentFastifyNodeOptions
): AgentFastifyNode => {
  const { moorexOptions, handlePost } = options;

  // 创建 Agent Moorex 定义
  const definition = createAgentMoorexDefinition(moorexOptions);

  // 创建 Moorex 实例
  const moorex = createMoorex(definition);

  // 创建默认的 handlePost（如果未提供）
  const defaultHandlePost: HandlePost<AgentInput> = async (input, dispatch) => {
    try {
      const inputs: AgentInput[] = JSON.parse(input);
      dispatch(inputs);
      return {
        code: 200,
        content: JSON.stringify({ success: true }),
      };
    } catch (error) {
      return {
        code: 400,
        content: JSON.stringify({
          error: "Invalid JSON",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      };
    }
  };

  // 创建 Moorex Node
  return createMoorexNode({
    moorex,
    handlePost: handlePost || defaultHandlePost,
  });
};

