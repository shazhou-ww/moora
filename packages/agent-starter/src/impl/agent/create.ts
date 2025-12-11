/**
 * createAgent 工厂函数
 */

import { automata } from "@moora/automata";
import type { StatefulTransferer } from "@moora/automata";
import type { Worldscape, Actuation, AgentReaction, AgentUpdatePack } from "@/decl/agent";
import { initial } from "@/impl/agent/initial";
import { transition } from "@/impl/agent/transition";

// ============================================================================
// 主要函数
// ============================================================================

/**
 * 创建 Agent 实例
 *
 * 使用 automata 实现，副作用在 reaction 函数中直接执行，
 * 输出为 UpdatePack，包含完整的状态更新信息用于日志和调试。
 *
 * 这种设计：
 * 1. 副作用在 automata 内部自动执行，subscribe 只需处理日志
 * 2. 暴露完整的状态更新信息（prev state, action, current state）
 *
 * @param reaction - Agent 的统一 Reaction 函数（由 createReaction 创建）
 * @returns Agent 自动机实例
 *
 * @example
 * ```typescript
 * import { createAgent, createReaction } from '@moora/agent-starter';
 *
 * const reaction = createReaction({
 *   user: ({ perspective }) => { ... },
 *   llm: ({ perspective, dispatch }) => { ... },
 * });
 *
 * const agent = createAgent(reaction);
 *
 * // subscribe 只需要处理日志，副作用已自动执行
 * agent.subscribe((update) => {
 *   console.log('State update:', update);
 * });
 *
 * agent.dispatch({ type: 'send-user-message', id: 'msg-1', content: 'Hello', timestamp: Date.now() });
 * ```
 */
export function createAgent(
  reaction: AgentReaction
): StatefulTransferer<Actuation, AgentUpdatePack, Worldscape> {
  const machine = automata(
    { initial, transition },
    (update: AgentUpdatePack) => ({ output: update })
  );

  // 内部订阅，自动执行副作用
  machine.subscribe((update) => {
    reaction(update.state)(machine.dispatch);
  });

  return machine;
}
