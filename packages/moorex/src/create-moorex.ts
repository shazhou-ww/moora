import { type Immutable } from 'mutative';
import { createSignalQueue } from './signal-queue';
import { createEventEmitter } from './event-emitter';
import { guardCurrentEffect, withEffectErrorHandling, attachCompletionHandlers } from './utils';
import type {
  MoorexDefinition,
  Moorex,
  MoorexEvent,
  RunningEffect,
} from './types';

/**
 * 创建一个 Moorex 机器实例。
 *
 * Moorex 是一个通用的异步 Moore 机器，它：
 * 1. 跟踪状态，通过信号触发状态转换
 * 2. 根据当前状态自动管理 effects
 * 3. 在状态改变时协调 effects（取消不需要的，启动新的）
 * 4. 提供事件订阅机制，监听状态和 effect 的变化
 *
 * 设计用于构建持久化的 AI agents，这些 agents 必须在崩溃、重启或迁移时存活，
 * 同时能够恢复未完成的工作。通过重新加载状态并运行 effect 协调，agent 可以
 * 从上次中断的地方继续。
 *
 * @example
 * ```typescript
 * const definition: MoorexDefinition<State, Signal, Effect> = {
 *   initiate: () => ({ count: 0 }),
 *   transition: (signal) => (state) => ({ ...state, count: state.count + 1 }),
 *   effectsAt: (state) => state.count > 0 ? { 'effect-1': effectData } : {},
 *   runEffect: (effect, state, key) => ({
 *     start: async (dispatch) => { },
 *     cancel: () => { }
 *   })
 * };
 *
 * const moorex = createMoorex(definition);
 * moorex.on((event) => console.log('Event:', event));
 * moorex.dispatch({ type: 'increment' });
 * ```
 *
 * @template State - 机器的状态类型
 * @template Signal - 信号类型，用于触发状态转换
 * @template Effect - Effect 类型
 * @param definition - Moore 机器的定义配置
 * @returns Moorex 机器实例
 */
export const createMoorex = <State, Signal, Effect>(
  definition: MoorexDefinition<State, Signal, Effect>,
): Moorex<State, Signal, Effect> => {
  const running = new Map<string, RunningEffect<Effect>>();
  let state: Immutable<State> = definition.initiate();

  const { emit, on } = createEventEmitter<MoorexEvent<State, Signal, Effect>>();

  let schedule: (signal: Immutable<Signal>) => void;

  const startEffect = (key: string, effect: Immutable<Effect>, state: Immutable<State>) => {
    const initializer = withEffectErrorHandling(effect, emit, () => definition.runEffect(effect, state, key));
    if (!initializer) return;

    const entry: RunningEffect<Effect> = {
      key,
      effect,
      complete: Promise.resolve(), // 临时值，会在下面更新
      cancel: initializer.cancel,
    };
    running.set(key, entry);

    entry.complete = Promise.resolve(
      initializer.start(guardCurrentEffect(running, entry)(schedule))
    );
    emit({ type: 'effect-started', effect });
    attachCompletionHandlers(entry, running, emit);
  };

  const cancelObsoleteEffects = (currentEffects: Record<string, Immutable<Effect>>) => {
    for (const [key, entry] of [...running]) {
      if (!(key in currentEffects)) {
        running.delete(key);
        withEffectErrorHandling(entry.effect, emit, entry.cancel);
        emit({ type: 'effect-canceled', effect: entry.effect });
      }
    }
  };

  const startNewEffects = (currentEffects: Record<string, Immutable<Effect>>) => {
    for (const [key, effect] of Object.entries(currentEffects)) {
      if (running.has(key)) continue;
      startEffect(key, effect, state);
    }
  };

  const reconcileEffects = () => {
    const currentEffects = definition.effectsAt(state);

    cancelObsoleteEffects(currentEffects);
    startNewEffects(currentEffects);
  };

  const { schedule: scheduleSignal } = createSignalQueue<Signal>((signals) => {
    // 使用 reduce 累积状态转换
    state = signals.reduce((currentState, signal) => {
      emit({ type: 'signal-received', signal });
      return definition.transition(signal)(currentState);
    }, state);

    reconcileEffects();
    emit({ type: 'state-updated', state });
  });
  schedule = scheduleSignal;

  reconcileEffects();

  return {
    dispatch: schedule,
    on,
    getState: () => state,
  };
};

