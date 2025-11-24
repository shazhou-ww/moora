import { type Immutable } from 'mutative';

/**
 * 取消函数类型
 */
export type CancelFn = () => void;

/**
 * Effect 初始化器
 */
export type EffectInitializer<Signal> = {
  start: (dispatch: (signal: Immutable<Signal>) => void) => Promise<void>;
  cancel: CancelFn;
};

/**
 * 定义 Moore 机器的配置。
 *
 * Moorex 是一个通用的异步 Moore 机器，它跟踪状态，严格从当前状态驱动 effects，
 * 并在状态改变时协调这些 effects。设计初衷是构建持久化的 AI agents，这些 agents
 * 必须在崩溃、重启或迁移时存活，同时能够恢复未完成的工作。
 *
 * 所有函数参数和返回值都是 Immutable 的，确保不可修改。
 *
 * @template State - 机器的状态类型
 * @template Signal - 信号类型，用于触发状态转换
 * @template Effect - Effect 类型
 */
export type MoorexDefinition<State, Signal, Effect> = {
  /** 初始化函数，返回初始状态 */
  initiate: () => Immutable<State>;
  /**
   * 状态转换函数。
   * 接收一个 Immutable 信号，返回一个函数，该函数接收 Immutable 状态并返回新的 Immutable 状态。
   * 参数和返回值都是 Immutable 的，不允许修改。
   */
  transition: (signal: Immutable<Signal>) => (state: Immutable<State>) => Immutable<State>;
  /**
   * 根据当前状态计算应该运行的 effects。
   * 接收 Immutable 状态，返回 Effect Record，key 作为 Effect 的标识用于 reconciliation。
   * 参数和返回值都是 Immutable 的，不允许修改。
   * Record 的 key 用于在 reconciliation 时做一致性判定。
   */
  effectsAt: (state: Immutable<State>) => Record<string, Immutable<Effect>>;
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
    effect: Immutable<Effect>,
    state: Immutable<State>,
    key: string,
  ) => EffectInitializer<Signal>;
};

/**
 * Moorex 机器发出的事件。
 *
 * 事件类型包括：
 * - `signal-received`: 信号被接收并处理
 * - `state-updated`: 状态已更新
 * - `effect-started`: Effect 已启动
 * - `effect-completed`: Effect 成功完成
 * - `effect-canceled`: Effect 被取消
 * - `effect-failed`: Effect 失败（包含错误信息）
 *
 * @template State - 机器的状态类型
 * @template Signal - 信号类型
 * @template Effect - Effect 类型
 */
export type MoorexEvent<State, Signal, Effect> =
  | { type: 'signal-received'; signal: Immutable<Signal> }
  | { type: 'state-updated'; state: Immutable<State> }
  | { type: 'effect-started'; effect: Immutable<Effect> }
  | { type: 'effect-completed'; effect: Immutable<Effect> }
  | { type: 'effect-canceled'; effect: Immutable<Effect> }
  | { type: 'effect-failed'; effect: Immutable<Effect>; error: unknown };

/**
 * Moorex 机器实例。
 *
 * 提供状态管理、信号分发和事件订阅功能。
 *
 * @template State - 机器的状态类型
 * @template Signal - 信号类型
 * @template Effect - Effect 类型
 */
export type Moorex<State, Signal, Effect> = {
  /**
   * 分发一个信号以触发状态转换。
   * 信号会被加入队列，在下一个微任务中批量处理。
   * 参数必须是 Immutable 的，不允许修改。
   */
  dispatch(signal: Immutable<Signal>): void;
  /**
   * 订阅事件。
   * 返回一个取消订阅的函数。
   *
   * @param handler - 事件处理函数
   * @returns 取消订阅的函数
   */
  on(handler: (event: MoorexEvent<State, Signal, Effect>) => void): CancelFn;
  /**
   * 获取当前状态。
   * 返回的状态是 Immutable 的，不允许修改。
   */
  getState(): Immutable<State>;
};

/**
 * 运行中的 Effect（内部使用）
 */
export type RunningEffect<Effect> = {
  key: string;
  effect: Immutable<Effect>;
  complete: Promise<void>;
  cancel: CancelFn;
};

