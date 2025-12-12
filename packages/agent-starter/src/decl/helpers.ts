/**
 * Helper Generic 类型定义
 *
 * 用于类型推导的辅助类型
 */

import type { ActionFromUser, ActionFromLlm } from "./actions";
import type { Actors } from "./actors";
import type { USER, LLM } from "./actors";
import type { Actuation } from "./agent";
import type { AppearanceOfUser, AppearanceOfLlm } from "./appearances";
import type { PerspectiveOfUser, PerspectiveOfLlm } from "./perspectives";
import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";

// ============================================================================
// Helper Generic 类型
// ============================================================================

/**
 * 根据 Actor 类型推导对应的 Appearance
 */
export type AppearanceOf<Actor extends Actors> = Actor extends typeof USER
  ? AppearanceOfUser
  : Actor extends typeof LLM
  ? AppearanceOfLlm
  : never;

/**
 * 根据 Actor 类型推导对应的 Perspective
 */
export type PerspectiveOf<Actor extends Actors> = Actor extends typeof USER
  ? PerspectiveOfUser
  : Actor extends typeof LLM
  ? PerspectiveOfLlm
  : never;

/**
 * 根据 Actor 类型推导对应的 Action
 */
export type ActionFrom<Actor extends Actors> = Actor extends typeof USER
  ? ActionFromUser
  : Actor extends typeof LLM
  ? ActionFromLlm
  : never;

// ============================================================================
// 关键函数的类型定义
// ============================================================================

/**
 * Initial 函数类型
 */
export type InitialFnOf<Actor extends Actors> = () => AppearanceOf<Actor>;

/**
 * Transition 函数类型
 */
export type TransitionFnOf<Actor extends Actors> = (
  action: ActionFrom<Actor>
) => (appearance: AppearanceOf<Actor>) => AppearanceOf<Actor>;

/**
 * Reaction 函数类型
 *
 * 根据 Actor 的 Perspective 决定要触发的副作用。
 *
 * 注意：参数应该是 PerspectiveOf<Actor> 而不是 AppearanceOf<Actor>，
 * 因为 Reaction 函数需要根据 Actor 的 Perspective（发出的 Observation）来决定要触发的副作用。
 *
 * 返回 Eff<{ perspective, dispatch }> 而不是柯里化的形式，
 * 这样可以让各个 Actor 的 Reaction 可以同时访问 perspective 和 dispatch，
 * 并且可以方便地在闭包中创建 stateful reaction。
 */
export type ReactionFnOf<Actor extends Actors> = Eff<{
  perspective: PerspectiveOf<Actor>;
  dispatch: Dispatch<Actuation>;
}>;
