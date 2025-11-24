import { type Immutable } from 'mutative';
import type { RunningEffect, MoorexEvent } from './types';

/**
 * 创建 guard 函数，确保只有当前正在运行的 effect 才能执行回调
 */
export const guardCurrentEffect = <Effect>(
  running: Map<string, RunningEffect<Effect>>,
  entry: RunningEffect<Effect>,
) => <T extends any[]>(callback: (...args: T) => void): (...args: T) => void => {
  return (...args: T) => {
    if (running.get(entry.key) !== entry) return;
    callback(...args);
  };
};

/**
 * 包装 effect 操作，统一处理错误并发出 effect-failed 事件
 */
export const withEffectErrorHandling = <State, Signal, Effect, T>(
  effect: Immutable<Effect>,
  emit: (event: MoorexEvent<State, Signal, Effect>) => void,
  fn: () => T,
): T | undefined => {
  try {
    return fn();
  } catch (error) {
    emit({ type: 'effect-failed', effect, error });
    return undefined;
  }
};

/**
 * 为 effect 附加完成处理器，在 effect 完成或失败时自动清理并发出事件
 */
export const attachCompletionHandlers = <State, Signal, Effect>(
  entry: RunningEffect<Effect>,
  running: Map<string, RunningEffect<Effect>>,
  emit: (event: MoorexEvent<State, Signal, Effect>) => void,
) => {
  entry.complete
    .then(
      guardCurrentEffect(running, entry)(() => {
        running.delete(entry.key);
        emit({ type: 'effect-completed', effect: entry.effect });
      })
    )
    .catch(
      guardCurrentEffect(running, entry)((error) => {
        running.delete(entry.key);
        emit({ type: 'effect-failed', effect: entry.effect, error });
      })
    )
};

