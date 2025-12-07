/**
 * createAgent 工厂函数
 */

import { automata } from "@moora/automata";
import type { StatefulTransferer, UpdatePack } from "@moora/automata";
import type { AgentState, AgentInput, EffectFns, PartialEffectFns } from "@/decl/agent";
import { initial } from "@/impl/agent/initial";
import { transition } from "@/impl/agent/transition";
import { createEffect } from "@/impl/agent/effect";
import { USER, LLM, TOOLKIT } from "@/decl/actors";
import type { EffectFnOf } from "@/decl/helpers";

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
// 辅助函数
// ============================================================================

/**
 * 创建 noop Effect 函数
 *
 * 返回一个空的 effect，不执行任何操作
 */
function createNoopEffect<Actor extends typeof USER | typeof LLM | typeof TOOLKIT>(): EffectFnOf<Actor> {
  return () => {};
}

/**
 * 填充 partial EffectFns 为完整的 EffectFns
 *
 * 对于缺失的 Actor，使用 noop 函数填充
 */
function fillEffectFns(partialEffectFns: PartialEffectFns): EffectFns {
  return {
    [USER]: partialEffectFns[USER] ?? createNoopEffect<typeof USER>(),
    [LLM]: partialEffectFns[LLM] ?? createNoopEffect<typeof LLM>(),
    [TOOLKIT]: partialEffectFns[TOOLKIT] ?? createNoopEffect<typeof TOOLKIT>(),
  };
}

// ============================================================================
// 主要函数
// ============================================================================

/**
 * 创建 Agent 实例
 *
 * 使用 automata 实现，副作用在 effect 函数中直接执行，
 * 输出为 UpdatePack，包含完整的状态更新信息用于日志和调试。
 *
 * 这种设计：
 * 1. 副作用在 automata 内部自动执行，subscribe 只需处理日志
 * 2. 暴露完整的状态更新信息（prev state, input, current state）
 * 3. 对于未提供的 Actor effect 函数，会自动填充为 noop（空操作）
 *
 * @param partialEffectFns - 各个 Actor 的 Effect 函数映射（可以是部分提供）
 * @returns Agent 自动机实例
 *
 * @example
 * ```typescript
 * import { createAgent } from '@moora/agent';
 *
 * const agent = createAgent({
 *   user: (context) => {
 *     // User Actor 的副作用逻辑，直接执行
 *   },
 *   llm: (context) => {
 *     // LLM Actor 的副作用逻辑
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
  partialEffectFns: PartialEffectFns
): StatefulTransferer<AgentInput, AgentUpdatePack, AgentState> {
  const effectFns = fillEffectFns(partialEffectFns);
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
