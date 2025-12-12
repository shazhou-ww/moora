/**
 * Agent 总类型定义
 *
 * 包含 Worldscape, Actuation, ReactionFns, AgentReaction 等核心类型
 */

import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";

import type { Actuation } from "./actions";
import type { Actors } from "./actors";
import type {
  AppearanceOfUser,
  AppearanceOfLlm,
  AppearanceOfWorkforce,
} from "./appearances";
import type { PerspectiveOf } from "./helpers";

// ============================================================================
// Agent 总类型
// ============================================================================

/**
 * Worldscape - 整个世界的状态
 *
 * 是所有 Actor 的 Appearance 的并集
 */
export type Worldscape = AppearanceOfUser &
  AppearanceOfLlm &
  AppearanceOfWorkforce;

/**
 * Agent UpdatePack 类型
 */
export type AgentUpdatePack = {
  prev: { state: Worldscape; input: Actuation } | null;
  state: Worldscape;
};

/**
 * Reaction 函数类型
 *
 * 注意：ReactionFnOf 非柯里化设计，允许 reaction 在闭包外层创建，使 stateful 等组合器状态可共享
 */
export type ReactionFnOf<Actor extends Actors> = Eff<{
  perspective: PerspectiveOf<Actor>;
  dispatch: Dispatch<Actuation>;
}>;

/**
 * Reaction 函数集合
 */
export type ReactionFns = {
  [A in Actors]: ReactionFnOf<A>;
};

/**
 * Agent Reaction 类型
 *
 * 接收 worldscape，返回一个 effect，该 effect 接收 dispatch 函数
 */
export type AgentReaction = (worldscape: Worldscape) => Eff<Dispatch<Actuation>>;
