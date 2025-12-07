/**
 * Helper Generic 类型定义
 *
 * 用于类型推导的辅助类型
 */

import type { Actors } from "./actors";
import type { StateOfUser, StateOfLlm } from "./states";
import type { ContextOfUser, ContextOfLlm } from "./contexts";
import type { InputFromUser, InputFromLlm } from "./inputs";
import type { USER, LLM } from "./actors";
import type { AgentInput } from "./agent";
import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";

// ============================================================================
// Helper Generic 类型
// ============================================================================

/**
 * 根据 Actor 类型推导对应的 State
 */
export type StateOf<Actor extends Actors> = Actor extends typeof USER
  ? StateOfUser
  : Actor extends typeof LLM
    ? StateOfLlm
    : never;

/**
 * 根据 Actor 类型推导对应的 Context
 */
export type ContextOf<Actor extends Actors> = Actor extends typeof USER
  ? ContextOfUser
  : Actor extends typeof LLM
    ? ContextOfLlm
    : never;

/**
 * 根据 Actor 类型推导对应的 Input
 */
export type InputFrom<Actor extends Actors> = Actor extends typeof USER
  ? InputFromUser
  : Actor extends typeof LLM
    ? InputFromLlm
    : never;

// ============================================================================
// 关键函数的类型定义
// ============================================================================

/**
 * Initial 函数类型
 */
export type InitialFnOf<Actor extends Actors> = () => StateOf<Actor>;

/**
 * Transition 函数类型
 */
export type TransitionFnOf<Actor extends Actors> = (
  input: InputFrom<Actor>
) => (state: StateOf<Actor>) => StateOf<Actor>;

/**
 * Output 函数类型
 *
 * **纯函数**：根据 Actor 的 Context 决定要触发的副作用，返回副作用函数。
 * 函数本身不执行任何副作用，所有副作用都在返回的函数中执行。
 *
 * 注意：参数应该是 ContextOf<Actor> 而不是 StateOf<Actor>，
 * 因为 Output 函数需要根据 Actor 的 Context（发出的 Observation）来决定要触发的副作用。
 *
 * 返回 Eff<{ context, dispatch }> 而不是柯里化的形式，
 * 这样可以让各个 Actor 的 Output 可以同时访问 context 和 dispatch，
 * 并且可以方便地在闭包中创建 stateful effect。
 */
export type OutputFnOf<Actor extends Actors> = Eff<{
  context: ContextOf<Actor>;
  dispatch: Dispatch<AgentInput>;
}>;
