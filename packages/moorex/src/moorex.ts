import type { Dispatch, Initial, Procedure, Transition } from "./transferers";
import { moore } from "./transferers";
import { createPubSub } from './pub-sub';

type CancelFn = () => void;
type EffectsAt<Effect, State> = (state: State) => Record<string, Effect>;

type EffectController<Input> = {
  start: Procedure<Input>;
  cancel: CancelFn;
};

export type MoorexDefinition<Input, Effect, State> = {
  /** 初始化函数，返回初始状态 */
  initial: Initial<State>;
  /**
   * 状态转换函数。
   * 接收一个 Immutable 信号，返回一个函数，该函数接收 Immutable 状态并返回新的 Immutable 状态。
   * 参数和返回值都是 Immutable 的，不允许修改。
   */
  transition: Transition<Input, State>
  /**
   * 根据当前状态计算应该运行的 effects。
   * 接收 Immutable 状态，返回 Effect Record，key 作为 Effect 的标识用于 reconciliation。
   * 参数和返回值都是 Immutable 的，不允许修改。
   * Record 的 key 用于在 reconciliation 时做一致性判定。
   */
  effectsAt: EffectsAt<Effect, State>;
  /**
   * 运行一个 effect。
   * 接收 Immutable effect、Immutable state 和 effect 的 key，返回一个初始化器，包含 `start` 和 `cancel` 方法。
   * 参数都是 Immutable 的，不允许修改。
   *
   * @param effect - 要运行的 effect（Immutable）
   * @param state - 生成该 effect 时的状态（Immutable）
   * @param key - effect 的 key，用于标识该 effect
   */
  runEffect: (
    effect: Effect,
    state: State,
    key: string,
  ) => EffectController<Input>;
};

export type MoorexEvent<Input, Effect, State> =
  | { type: 'input-received'; input: Input }
  | { type: 'state-updated'; state: State }
  | { type: 'effect-started'; effect: Effect }
  | { type: 'effect-completed'; effect: Effect }
  | { type: 'effect-canceled'; effect: Effect }
  | { type: 'effect-failed'; effect: Effect; error: unknown };

export type Moorex<Input, Effect, State> = {
  dispatch(input: Input): void;
  current(): State;
  subscribe(handler: (event: MoorexEvent<Input, Effect, State>) => void): CancelFn;
};

const filterRecord = <T>(
  rec: Record<string, T>,
  cb: (entry: [string, T]) => boolean
): Record<string, T> => {
  return Object.fromEntries(Object.entries(rec).filter(cb));
};

export function createMoorex<Input, Effect, State>(
  { initial, transition, effectsAt, runEffect }: MoorexDefinition<Input, Effect, State>,
): Moorex<Input, Effect, State> {
  let currentEffects: Record<string, Effect> = {};
  const effectControllers: Record<string, EffectController<Input>> = {};
  const pubsub = createPubSub<MoorexEvent<Input, Effect, State>>();
  const {
    dispatch,
    subscribe,
    current,
  } = moore<Input, Record<string, Effect>, State>({
    initial,
    transition,
    output: effectsAt
  });

  const reconsileEffects = (effects: Record<string, Effect>) => {
    const effectsToCancel = filterRecord(effectControllers, ([key]) => !effects[key]);
    const effectsToStart = filterRecord(effects, ([key]) => !currentEffects[key])
    return { effectsToCancel, effectsToStart };
  };

  subscribe((effects) => {
    const { effectsToCancel, effectsToStart } = reconsileEffects(effects);
    currentEffects = effects;

    return async (dispatch: Dispatch<Input>) => {
      for (const [key, controller] of Object.entries(effectsToCancel)) {
        controller.cancel();
        delete effectControllers[key];
      }
      for (const [key, effect] of Object.entries(effectsToStart)) {
        const controller = runEffect(effect, current(), key);
        effectControllers[key] = controller;
        controller.start(dispatch);
      }
    };
  });

  return {
    dispatch,
    current,
    subscribe: pubsub.sub,
  };
};