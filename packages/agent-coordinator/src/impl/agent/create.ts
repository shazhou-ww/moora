/**
 * Agent 工厂函数
 */

import type { StatefulTransferer } from "@moora/automata";
import { automata } from "@moora/automata";
import type { AgentReaction, AgentUpdatePack, Worldscape, Actuation } from "@/decl";

import { initialAgent } from "./initial";
import { transitionAgent } from "./transition";

/**
 * 创建 Coordinator Agent
 *
 * @param reaction - Agent 的 reaction 函数
 * @returns Agent 实例
 */
export function createAgent(
  reaction: AgentReaction
): StatefulTransferer<Actuation, AgentUpdatePack, Worldscape> {
  const machine = automata(
    { initial: initialAgent, transition: transitionAgent },
    (update: AgentUpdatePack) => ({ output: update })
  );

  // 内部订阅，自动执行副作用
  machine.subscribe((update) => {
    reaction(update.state)(machine.dispatch);
  });

  return machine;
}
