/**
 * createAgent 工厂函数
 */

import { moore } from "@moora/automata";
import type { Dispatch, StatefulTransferer } from "@moora/automata";
import type { AgentState, AgentInput, OutputFns, PartialOutputFns } from "@/decl/agent";
import { initial } from "@/impl/agent/initial";
import { transition } from "@/impl/agent/transition";
import { createOutput } from "@/impl/agent/output";
import type { Eff } from "@moora/effects";
import { USER, LLM, TOOLKIT } from "@/decl/actors";
import type { OutputFnOf } from "@/decl/helpers";

/**
 * 创建 noop Output 函数
 *
 * 返回一个空的 effect，不执行任何操作
 */
function createNoopOutput<Actor extends typeof USER | typeof LLM | typeof TOOLKIT>(): OutputFnOf<Actor> {
  return () => {};
}

/**
 * 填充 partial OutputFns 为完整的 OutputFns
 *
 * 对于缺失的 Actor，使用 noop 函数填充
 */
function fillOutputFns(partialOutputFns: PartialOutputFns): OutputFns {
  return {
    [USER]: partialOutputFns[USER] ?? createNoopOutput<typeof USER>(),
    [LLM]: partialOutputFns[LLM] ?? createNoopOutput<typeof LLM>(),
    [TOOLKIT]: partialOutputFns[TOOLKIT] ?? createNoopOutput<typeof TOOLKIT>(),
  };
}

/**
 * 创建 Agent 实例
 *
 * 接收外部注入的 outputFns（可以是 partial），构造一个完整的 Moore 自动机并返回。
 * 这种设计将 output 函数（副作用）从 Agent 建模中解耦出来，
 * 使得 Agent 的核心逻辑（状态和转换）保持纯粹。
 *
 * 对于未提供的 Actor output 函数，会自动填充为 noop（空操作）。
 *
 * @param partialOutputFns - 各个 Actor 的 Output 函数映射（可以是部分提供）
 * @returns Agent 自动机实例
 *
 * @example
 * ```typescript
 * import { createAgent } from '@moora/agent';
 *
 * // 提供部分 output 函数
 * const agent = createAgent({
 *   user: (context) => () => async (dispatch) => {
 *     // User Actor 的副作用逻辑
 *   },
 *   // llm 和 toolkit 会自动填充为 noop
 * });
 *
 * agent.dispatch({ type: 'send-user-message', id: 'msg-1', content: 'Hello', timestamp: Date.now() });
 * ```
 */
export function createAgent(
  partialOutputFns: PartialOutputFns
): StatefulTransferer<AgentInput, Eff<Dispatch<AgentInput>>, AgentState> {
  const outputFns = fillOutputFns(partialOutputFns);
  return moore({
    initial: initial,
    transition: transition,
    output: createOutput(outputFns),
  });
}
