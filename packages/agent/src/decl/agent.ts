/**
 * Agent 总的 State 和 Input 定义
 */

import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";
import type { StateOfUser, StateOfLlm, StateOfToolkit } from "./states";
import type { InputFromUser, InputFromLlm, InputFromToolkit } from "./inputs";
import type { Actors } from "./actors";
import type { EffectFnOf } from "./helpers";

// ============================================================================
// Agent 统合类型
// ============================================================================

/**
 * Agent 的总 State = 各个 Actor State 的并集
 */
export type AgentState = StateOfUser & StateOfLlm & StateOfToolkit;

/**
 * Agent 的总 Input = 各个 Actor Input 的并集
 */
export type AgentInput = InputFromUser | InputFromLlm | InputFromToolkit;

// ============================================================================
// EffectFns 类型定义
// ============================================================================

/**
 * 各个 Actor 的 Effect 函数映射类型
 *
 * 用于 createAgent 函数的参数类型
 */
export type EffectFns = {
  [A in Actors]: EffectFnOf<A>;
};

/**
 * 部分 Effect 函数映射类型
 *
 * 用于 createAgent 函数的参数类型，允许只提供部分 Actor 的 Effect 函数
 */
export type PartialEffectFns = Partial<EffectFns>;
