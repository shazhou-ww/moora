// ============================================================================
// Agent Moorex - 服务端 Effects 处理
// ============================================================================

import type { MoorexDefinition, EffectController } from "@moora/moorex";
import type {
  AgentState,
  AgentInput,
} from "@moora/agent-core-state-machine";
import type { AgentEffect, AgentMoorexOptions } from "../types";
import { initialAgentState, agentTransition } from "@moora/agent-core-state-machine";
import {
  createLLMEffectController,
  createToolEffectController,
} from "./helpers";
import { agentEffectsAt } from "./effects-at";

/**
 * 创建 Agent Effect 运行函数
 * 
 * @template Input - 输入信号类型
 * @template Effect - Effect 类型
 * @template State - 状态类型
 * @param options - Agent Moorex 选项
 * @returns Effect 运行函数
 * 
 * @example
 * ```typescript
 * const runEffect = createAgentRunEffect({
 *   callLLM: async ({ prompt }) => 'Response',
 *   tools: { search: { ... } },
 * });
 * 
 * const controller = runEffect(effect, state, 'effect-1');
 * await controller.start(dispatch);
 * ```
 */
export const createAgentRunEffect = (options: AgentMoorexOptions) => (
  effect: AgentEffect,
  state: AgentState,
  key: string,
): EffectController<AgentInput> => {
  const { callLLM, tools = {} } = options;

  switch (effect.type) {
    case "call-llm":
      return createLLMEffectController(effect, callLLM);
    case "call-tool":
      return createToolEffectController(effect, tools[effect.toolName]);
    default:
      // 未知的 Effect 类型
      return {
        start: async () => {
          // 不做任何事
        },
        cancel: () => {
          // 不做任何事
        },
      };
  }
};

/**
 * 创建 Agent Moorex 定义
 * 
 * @template Input - 输入信号类型
 * @template Effect - Effect 类型
 * @template State - 状态类型
 * @param options - Agent Moorex 选项
 * @returns Moorex 定义
 * 
 * @example
 * ```typescript
 * const definition = createAgentMoorexDefinition({
 *   callLLM: async ({ prompt }) => 'Response',
 *   tools: { search: { ... } },
 * });
 * 
 * const moorex = createMoorex(definition);
 * ```
 */
export const createAgentMoorexDefinition = (
  options: AgentMoorexOptions
): MoorexDefinition<AgentInput, AgentEffect, AgentState> => {
  return {
    initial: initialAgentState,
    transition: agentTransition,
    effectsAt: agentEffectsAt,
    runEffect: createAgentRunEffect(options),
  };
};

