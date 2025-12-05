// ============================================================================
// 自动机相关类型（从 @moora/automata 导入并重新导出）
// ============================================================================
import type { Dispatch, InitialFn, TransitionFn } from "@moora/automata";

// ============================================================================
// 基础类型
// ============================================================================

/**
 * 取消函数，用于取消订阅或停止操作
 */
export type CancelFn = () => void;

/**
 * 取消订阅函数，等同于 CancelFn
 */
export type Unsubscribe = CancelFn;

// ============================================================================
// PubSub 相关类型
// ============================================================================

/**
 * 发布订阅组件
 *
 * @template T - 发布的数据类型
 */
export type PubSub<T> = {
  /**
   * 发布数据给所有订阅者
   */
  pub: (value: T) => void;
  /**
   * 订阅数据
   * @param handler - 处理函数
   * @returns 取消订阅的函数
   */
  sub: (handler: (value: T) => void) => CancelFn;
};

// ============================================================================
// Moorex 相关类型
// ============================================================================

/**
 * 根据当前状态计算应该运行的 effects
 */
export type EffectsAt<Effect, State> = (state: State) => Record<string, Effect>;

/**
 * Effect 控制器，用于启动和取消 effect
 */
export type EffectController<Input> = {
  start: (dispatch: Dispatch<Input>) => Promise<void>;
  cancel: CancelFn;
};

/**
 * Moorex 定义，包含初始化、状态转换、effects 计算和 effect 运行逻辑
 */
export type MoorexDefinition<Input, Effect, State> = {
  /** 初始化函数，返回初始状态 */
  initial: InitialFn<State>;
  /**
   * 状态转换函数。
   * 接收一个 Immutable 信号，返回一个函数，该函数接收 Immutable 状态并返回新的 Immutable 状态。
   * 参数和返回值都是 Immutable 的，不允许修改。
   */
  transition: TransitionFn<Input, State>;
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

/**
 * Moorex 事件类型
 */
export type MoorexEvent<Input, Effect, State> =
  | { type: 'input-received'; input: Input }
  | { type: 'state-updated'; state: State }
  | { type: 'effect-started'; effect: Effect }
  | { type: 'effect-completed'; effect: Effect }
  | { type: 'effect-canceled'; effect: Effect }
  | { type: 'effect-failed'; effect: Effect; error: unknown };

/**
 * Moorex 实例，提供状态管理和 effect 协调功能
 */
export type Moorex<Input, Effect, State> = {
  dispatch(input: Input): void;
  current(): State;
  subscribe(handler: (event: MoorexEvent<Input, Effect, State>) => void): CancelFn;
};
