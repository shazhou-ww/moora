/**
 * Agent 总的 State 和 Input 定义
 */

import type { Effect } from "@moora/automata";
import type { StateOfUser, StateOfLlm } from "./states";
import type { InputFromUser, InputFromLlm } from "./inputs";
import type { Actors } from "./actors";
import type { OutputFnOf } from "./helpers";

// ============================================================================
// Output 类型定义
// ============================================================================

/**
 * Output 类型定义（两阶段副作用）
 *
 * Output 采用两阶段副作用定义：
 * - 第一阶段（同步）：返回一个 Procedure 函数
 * - 第二阶段（异步）：Procedure 函数在微任务队列中执行，可以异步 dispatch 新的 Input
 *
 * **重要：Output 函数本身是纯函数，只返回副作用函数，不执行任何副作用。**
 * 所有副作用（如日志记录、API 调用、dispatch 等）都应该在返回的函数中执行。
 */
export type Output<Input> = Effect<Input>;

// ============================================================================
// Agent 统合类型
// ============================================================================

/**
 * Agent 的总 State = 各个 Actor State 的并集
 */
export type AgentState = StateOfUser & StateOfLlm;

/**
 * Agent 的总 Input = 各个 Actor Input 的并集
 */
export type AgentInput = InputFromUser | InputFromLlm;

// ============================================================================
// OutputFns 类型定义
// ============================================================================

/**
 * 各个 Actor 的 Output 函数映射类型
 *
 * 用于 createAgent 函数的参数类型
 */
export type OutputFns = {
  [A in Actors]: OutputFnOf<A>;
};
