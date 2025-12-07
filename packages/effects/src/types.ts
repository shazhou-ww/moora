/**
 * 同步副作用函数
 *
 * Eff 是一个同步副作用函数，接收上下文并返回 void。
 * 如果需要异步操作，应该在函数内部自行使用 queueMicrotask 来处理。
 *
 * @template Context - 上下文类型
 */
export type Eff<Context> = (context: Context) => void;
