/**
 * Effect 相关函数
 *
 * - runEffect: 执行 Eff（如果需要异步操作，内部自行使用 queueMicrotask）
 * - noopEffect: 空 Eff，什么都不做
 * - synchronous: 同步执行的 Eff
 * - asynchronous: 异步执行的 Eff（内部使用 queueMicrotask）
 * - stateful: 带状态的 Eff
 * - parallel: 并行执行多个 Eff
 * - sequential: 串行执行多个 Eff
 */

import type { Eff } from "./types";

/**
 * 带状态的 Eff
 *
 * 创建一个带有内部状态的 Eff 函数。
 * 状态在多次调用之间保持，类似于 React 的 useState。
 *
 * 状态更新通过 `setState` 完成。`setState` 只更新状态，不会触发新的 effect。
 * Effect 的触发由外部 context 的变化控制（当 Eff 被调用时）。
 *
 * `setState` 只支持 updater 函数形式：`setState((prevState) => newState)`
 * 这种方式确保状态更新总是基于最新的状态值，即使是在异步副作用中调用也能正确工作。
 *
 * @template Context - 上下文类型
 * @template State - 状态类型
 * @param initial - 初始状态
 * @param fn - Eff 函数，接收包含 context、state 和 setState 的对象
 * @returns 带状态的 Eff
 *
 * @example
 * ```typescript
 * // 跟踪上次的 context，只在 context 改变时更新状态
 * const handler = (dispatch) => stateful(
 *   { lastValue: null },
 *   ({ context, state, setState }) => {
 *     if (context.value !== state.lastValue) {
 *       console.log(`值从 ${state.lastValue} 变为 ${context.value}`);
 *       setState(() => ({ lastValue: context.value }));
 *     }
 *   }
 * );
 *
 * // 累积数据并批量处理
 * const batchHandler = (dispatch) => stateful(
 *   [],
 *   ({ context, state, setState }) => {
 *     const newBuffer = [...state, context];
 *     if (newBuffer.length >= 10) {
 *       queueMicrotask(() => flush(newBuffer));
 *       setState(() => []);
 *     } else {
 *       setState(() => newBuffer);
 *     }
 *   }
 * );
 *
 * // 异步副作用中使用 updater 函数
 * const asyncHandler = (dispatch) => stateful(
 *   { count: 0 },
 *   ({ context, state, setState }) => {
 *     queueMicrotask(() => {
 *       // 使用 updater 函数，确保状态更新总是生效
 *       setState((prev) => ({ count: prev.count + 1 }));
 *     });
 *   }
 * );
 * ```
 */
export function stateful<Context, State>(
  initial: State,
  fn: (params: { context: Context; state: State; setState: (updater: (prevState: State) => State) => void }) => void
): Eff<Context> {
  let state = initial;

  return (context: Context) => {
    const setState = (updater: (prevState: State) => State) => {
      state = updater(state);
    };
    fn({ context, state, setState });
  };
}
