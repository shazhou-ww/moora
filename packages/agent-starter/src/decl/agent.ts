/**
 * Agent 总的 Worldscape 和 Actuation 定义
 */

import type { ActionFromUser, ActionFromLlm } from "./actions";
import type { Actors } from "./actors";
import type { AppearanceOfUser, AppearanceOfLlm } from "./appearances";
import type { ReactionFnOf } from "./helpers";
import type { Dispatch, UpdatePack, StatefulTransferer } from "@moora/automata";
import type { Eff } from "@moora/effects";

// ============================================================================
// Agent 统合类型
// ============================================================================

/**
 * Agent 的总 Worldscape = 各个 Actor Appearance 的并集
 */
export type Worldscape = AppearanceOfUser & AppearanceOfLlm;

/**
 * Agent 的总 Actuation = 各个 Actor Action 的并集
 */
export type Actuation = ActionFromUser | ActionFromLlm;

// ============================================================================
// ReactionFns 类型定义
// ============================================================================

/**
 * 各个 Actor 的 Reaction 函数映射类型
 *
 * 用于 createAgent 函数的参数类型
 */
export type ReactionFns = {
  [A in Actors]: ReactionFnOf<A>;
};

/**
 * Agent 的统一 Reaction 类型
 *
 * 接收 Worldscape 状态，返回一个接收 Dispatch 的副作用函数。
 * 这是 createReaction 的返回类型，也是 createAgent 的参数类型。
 */
export type AgentReaction = (worldscape: Worldscape) => Eff<Dispatch<Actuation>>;

/**
 * Agent 的更新包类型（状态机的输出）
 *
 * 包含状态转换的完整信息：
 * - prev: 前一个状态和触发转换的输入（初始状态时为 null）
 * - state: 当前状态
 */
export type AgentUpdatePack = UpdatePack<Actuation, Worldscape>;

/**
 * Agent 类型
 *
 * createAgent 的返回类型，是一个有状态的转换器
 */
export type Agent = StatefulTransferer<Actuation, AgentUpdatePack, Worldscape>;
