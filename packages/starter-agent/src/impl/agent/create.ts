/**
 * createAgent 工厂函数
 */

import { automata } from "@moora/automata";
import type { StatefulTransferer, UpdatePack } from "@moora/automata";
import type { AgentState, AgentInput, EffectFns } from "@/decl/agent";
import { initial } from "@/impl/agent/initial";
import { transition } from "@/impl/agent/transition";
import { createEffect } from "@/impl/agent/effect";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Agent 的更新包类型（状态机的输出）
 *
 * 包含状态转换的完整信息：
 * - prev: 前一个状态和触发转换的输入（初始状态时为 null）
 * - state: 当前状态
 */
export type AgentUpdatePack = UpdatePack<AgentInput, AgentState>;

// ============================================================================
// 主要函数
// ============================================================================

/**
 * 创建 Agent 实例
 *
 * 使用 automata 实现，副作用在 subscribe 时自动执行，
 * 输出为 UpdatePack，包含完整的状态更新信息用于日志和调试。
 *
 * 这种设计：
 * 1. 副作用在 subscribe 时自动执行，用户 handler 只需处理日志
 * 2. 暴露完整的状态更新信息（prev state, input, current state）
 *
 * @param effectFns - 各个 Actor 的 Effect 函数映射
 * @returns Agent 自动机实例
 *
 * @example
 * ```typescript
 * import { createAgent } from '@moora/starter-agent';
 *
 * const agent = createAgent({
 *   user: (context) => {
 *     // User Actor 的副作用逻辑，直接执行
 *   },
 *   llm: (context) => {
 *     // Llm Actor 的副作用逻辑
 *   },
 * });
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
  effectFns: EffectFns
): StatefulTransferer<AgentInput, AgentUpdatePack, AgentState> {
  const executeEffect = createEffect(effectFns);

  const machine = automata(
    { initial, transition },
    (update: AgentUpdatePack) => ({ output: update })
  );

  // 内部订阅，自动执行副作用
  machine.subscribe((update) => {
    executeEffect(update.state)(machine.dispatch);
  });

  return machine;
}
