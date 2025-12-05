/**
 * Effect 相关函数
 *
 * - runEffect: 执行 Effect 的两阶段副作用
 * - parallel: 并行执行多个 Effect
 */

import type { Dispatch, Effect } from './types';

/**
 * 执行 Effect 的两阶段副作用
 *
 * 1. 第一阶段（同步）：立即执行 effect()，获取异步副作用函数
 * 2. 第二阶段（异步）：通过 queueMicrotask 延迟执行异步副作用函数
 *
 * @param effect - Effect 函数
 * @param dispatch - 分发函数，用于在异步副作用中产生新的输入
 */
export function runEffect<T>(effect: Effect<T>, dispatch: Dispatch<T>): void {
  // 第一阶段：同步执行 effect，获取异步副作用函数
  const asyncFn = effect();
  // 第二阶段：通过 queueMicrotask 延迟执行异步副作用
  queueMicrotask(() => asyncFn(dispatch));
}

/**
 * 并行执行多个 Effect
 *
 * 将多个 Effect 合并为一个，执行时会并行执行所有 Effect。
 *
 * @param effects - Effect 函数数组
 * @returns 合并后的 Effect 函数
 */
export function parallel<T>(effects: Effect<T>[]): Effect<T> {
  return () => {
    const asyncFns = effects.map((effect) => effect());
    return async (dispatch: Dispatch<T>) => {
      await Promise.all(asyncFns.map((fn) => fn(dispatch)));
    };
  };
}
