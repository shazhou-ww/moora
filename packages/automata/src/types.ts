import type { Effect } from '@moora/effects';

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
// 自动机相关类型
// ============================================================================

/**
 * 分发函数，用于发送输入信号
 */
export type Dispatch<Input> = (input: Input) => void;

// 重新导出 Effect 类型
export type { Effect } from '@moora/effects';

/**
 * 输出处理器，接收输出并返回一个 Effect 函数
 *
 * 这是两阶段副作用设计：
 * - 第一阶段（同步）：handler 接收 output，返回一个 Effect 函数
 * - 第二阶段（异步）：Effect 函数执行时返回的异步副作用在微任务队列中执行
 *
 * 这种设计允许：
 * - 同步部分可以立即处理 output（例如记录日志、更新 UI）
 * - 异步副作用在微任务中执行，不会阻塞当前执行栈
 * - 异步副作用可以通过 dispatch 产生新的输入，形成反馈循环
 */
export type OutputHandler<Input, Output> = (output: Output) => Effect<Dispatch<Input>>;

/**
 * 订阅函数
 */
export type Subscribe<Input, Output> = (handler: OutputHandler<Input, Output>) => Unsubscribe;

/**
 * 传输器，用于在输入和输出之间建立连接
 */
export type Transferer<Input, Output> = {
  dispatch: Dispatch<Input>;
  subscribe: Subscribe<Input, Output>;
};

/**
 * 有状态的传输器，包含当前状态访问
 */
export type StatefulTransferer<Input, Output, State> = Transferer<Input, Output> & {
  current: () => State;
};

/**
 * 初始化函数，返回初始状态
 *
 * @template State - 状态类型
 * @returns 初始状态
 */
export type InitialFn<State> = () => State;

/**
 * 状态转换函数，接收输入并返回状态更新函数
 *
 * 这是一个柯里化函数：
 * 1. 第一层接收输入信号，返回状态更新函数
 * 2. 第二层接收当前状态，返回新状态
 *
 * @template Input - 输入信号类型
 * @template State - 状态类型
 * @param input - 输入信号
 * @returns 状态更新函数，接收当前状态并返回新状态
 */
export type TransitionFn<Input, State> = (input: Input) => (state: State) => State;

/**
 * 自动机定义
 */
export type StateMachine<Input, State> = {
  initial: InitialFn<State>;
  transition: TransitionFn<Input, State>;
};

/**
 * Mealy 机输出函数
 *
 * Mealy 机的输出依赖于输入和状态转换信息。
 * 函数接收完整的状态转换信息（前一个状态、输入、新状态），计算并返回输出。
 *
 * @template Input - 输入信号类型
 * @template Output - 输出类型
 * @template State - 状态类型
 * @param update - 状态转换信息包，包含前一个状态、输入和新状态
 * @returns 计算得到的输出
 */
export type MealyOutputFn<Input, Output, State> = (update: UpdatePack<Input, State>) => Output;

/**
 * Mealy 机定义（输出依赖于输入和状态）
 */
export type MealyMachine<Input, Output, State> = StateMachine<Input, State> & {
  output: MealyOutputFn<Input, Output, State>;
};

/**
 * Moore 机输出函数
 *
 * Moore 机的输出仅依赖于当前状态，不依赖于输入。
 * 函数接收当前状态，计算并返回输出。
 *
 * @template State - 状态类型
 * @template Output - 输出类型
 * @param state - 当前状态
 * @returns 计算得到的输出
 */
export type MooreOutputFn<State, Output> = (state: State) => Output;

/**
 * Moore 机定义（输出仅依赖于状态）
 */
export type MooreMachine<Input, Output, State> = StateMachine<Input, State> & {
  output: MooreOutputFn<State, Output>;
};

/**
 * 更新包，包含状态转换前后的状态和输入
 */
export type UpdatePack<Input, State> = {
  statePrev: State;
  state: State;
  input: Input;
};
