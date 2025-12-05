/**
 * Effect 相关函数
 *
 * - runEffect: 执行 Effect 的两阶段副作用
 * - noopEffect: 空 Effect，什么都不做
 * - synchronous: 无二阶段的简单 Effect
 * - asynchronous: 无一阶段的简单 Effect
 * - stateful: 带状态的 Effect
 * - parallel: 并行执行多个 Effect
 * - sequential: 串行执行多个 Effect
 */

import type { Effect } from './types';

/**
 * 执行 Effect 的两阶段副作用
 *
 * 1. 第一阶段（同步）：立即执行 effect()，获取异步副作用函数
 * 2. 第二阶段（异步）：通过 queueMicrotask 延迟执行异步副作用函数
 *
 * @param effect - Effect 函数
 * @param value - 传递给异步阶段的值
 */
export function runEffect<T>(effect: Effect<T>, value: T): void {
  // 第一阶段：同步执行 effect，获取异步副作用函数
  const asyncFn = effect();
  // 第二阶段：通过 queueMicrotask 延迟执行异步副作用
  queueMicrotask(() => asyncFn(value));
}

/**
 * 空 Effect，什么都不做
 *
 * 用于需要返回 Effect 但不需要执行任何操作的场景。
 *
 * @template T - 异步阶段接收的值类型
 * @returns 空 Effect
 *
 * @example
 * ```typescript
 * const handler = (output) => {
 *   if (output.skip) return noopEffect();
 *   return synchronous(() => console.log(output));
 * };
 * ```
 */
export function noopEffect<T>(): Effect<T> {
  return () => async () => {};
}

/**
 * 无二阶段的简单 Effect
 *
 * 仅在第一阶段同步执行函数，第二阶段不执行任何操作。
 * 适用于不需要异步操作的场景。
 *
 * @template T - 异步阶段接收的值类型
 * @param fn - 同步执行的函数
 * @returns 仅有第一阶段的 Effect
 *
 * @example
 * ```typescript
 * const handler = (output) => synchronous(() => {
 *   console.log('同步处理:', output);
 * });
 * ```
 */
export function synchronous<T>(fn: () => void): Effect<T> {
  return () => {
    fn();
    return async () => {};
  };
}

/**
 * 无一阶段的简单 Effect
 *
 * 第一阶段不执行任何操作，仅在第二阶段异步执行函数。
 * 适用于需要异步操作的场景。
 *
 * @template T - 异步阶段接收的值类型
 * @param fn - 异步执行的函数，接收传入的值
 * @returns 仅有第二阶段的 Effect
 *
 * @example
 * ```typescript
 * const handler = (output) => asynchronous(async (dispatch) => {
 *   const result = await fetch('/api/data');
 *   dispatch({ type: 'data-loaded', data: result });
 * });
 * ```
 */
export function asynchronous<T>(fn: (value: T) => Promise<void>): Effect<T> {
  return () => fn;
}

/**
 * 带状态的 Effect
 *
 * 创建一个带有内部状态的 Effect 工厂函数。
 * 状态在多次调用之间保持，类似于 React 的 useState。
 *
 * 状态更新发生在第一阶段（同步），fn 返回新状态和异步执行函数的元组。
 * 这样设计避免了异步更新状态时是否需要触发 effect rerun 的复杂问题。
 *
 * @template T - 异步阶段接收的值类型
 * @template S - 状态类型
 * @param initial - 初始状态
 * @param fn - Effect 工厂函数，接收当前状态，返回 [新状态, 异步执行函数] 元组
 * @returns 带状态的 Effect
 *
 * @example
 * ```typescript
 * // 统计调用次数
 * const handler = (output) => stateful(0, (count) => [
 *   count + 1,
 *   async (dispatch) => {
 *     console.log(`第 ${count + 1} 次调用`);
 *     await processOutput(output);
 *   }
 * ]);
 *
 * // 累积数据并批量处理
 * const batchHandler = (output) => stateful([], (buffer) => {
 *   const newBuffer = [...buffer, output];
 *   if (newBuffer.length >= 10) {
 *     return [[], async (dispatch) => {
 *       await flush(newBuffer);
 *     }];
 *   }
 *   return [newBuffer, async () => {}];
 * });
 * ```
 */
export function stateful<T, S>(
  initial: S,
  fn: (state: S) => [S, (value: T) => Promise<void>]
): Effect<T> {
  let state = initial;

  return () => {
    const [newState, asyncFn] = fn(state);
    state = newState;
    return asyncFn;
  };
}

/**
 * 并行执行多个 Effect
 *
 * 将多个 Effect 合并为一个，执行时会并行执行所有 Effect。
 * 第一阶段按顺序同步执行所有 Effect 的第一阶段，
 * 第二阶段并行执行所有 Effect 的第二阶段。
 *
 * @param effects - Effect 函数数组
 * @returns 合并后的 Effect 函数
 *
 * @example
 * ```typescript
 * const handler = (output) => parallel([
 *   synchronous(() => console.log('log1')),
 *   asynchronous(async () => await saveToDb(output)),
 *   asynchronous(async () => await sendNotification(output)),
 * ]);
 * ```
 */
export function parallel<T>(effects: Effect<T>[]): Effect<T> {
  return () => {
    const asyncFns = effects.map((effect) => effect());
    return async (value: T) => {
      await Promise.all(asyncFns.map((fn) => fn(value)));
    };
  };
}

/**
 * 串行执行多个 Effect
 *
 * 将多个 Effect 合并为一个，执行时会按顺序串行执行所有 Effect。
 * 第一阶段按顺序同步执行所有 Effect 的第一阶段，
 * 第二阶段按顺序串行执行所有 Effect 的第二阶段。
 *
 * @param effects - Effect 函数数组
 * @returns 合并后的 Effect 函数
 *
 * @example
 * ```typescript
 * const handler = (output) => sequential([
 *   asynchronous(async () => await step1(output)),
 *   asynchronous(async () => await step2(output)),
 *   asynchronous(async () => await step3(output)),
 * ]);
 * ```
 */
export function sequential<T>(effects: Effect<T>[]): Effect<T> {
  return () => {
    const asyncFns = effects.map((effect) => effect());
    return async (value: T) => {
      for (const fn of asyncFns) {
        await fn(value);
      }
    };
  };
}
