/**
 * createAgent 工厂函数
 */

import { moore } from "@moora/automata";
import type { Dispatch, StatefulTransferer } from "@moora/automata";
import type { AgentState, AgentInput, OutputFns } from "@/decl/agent";
import { initial } from "@/impl/agent/initial";
import { transition } from "@/impl/agent/transition";
import { createOutput } from "@/impl/agent/output";
import type { Eff } from "@moora/effects";

/**
 * 创建 Agent 实例
 *
 * 接收外部注入的 outputFns，构造一个完整的 Moore 自动机并返回。
 * 这种设计将 output 函数（副作用）从 Agent 建模中解耦出来，
 * 使得 Agent 的核心逻辑（状态和转换）保持纯粹。
 *
 * @param outputFns - 各个 Actor 的 Output 函数映射
 * @returns Agent 自动机实例
 *
 * @example
 * ```typescript
 * import { createAgent } from '@moora/agent';
 *
 * const agent = createAgent({
 *   user: (context) => () => async (dispatch) => {
 *     // User Actor 的副作用逻辑
 *   },
 *   llm: (context) => () => async (dispatch) => {
 *     // Llm Actor 的副作用逻辑
 *   },
 * });
 *
 * agent.dispatch({ type: 'send-user-message', id: 'msg-1', content: 'Hello', timestamp: Date.now() });
 * ```
 */
export function createAgent(
  outputFns: OutputFns
): StatefulTransferer<AgentInput, Eff<Dispatch<AgentInput>>, AgentState> {
  return moore({
    initial: initial,
    transition: transition,
    output: createOutput(outputFns),
  });
}
