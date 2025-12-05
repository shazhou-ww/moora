/**
 * 两阶段副作用函数
 *
 * Effect 是一个两阶段副作用函数：
 * - 第一阶段（同步）：调用 Effect 函数本身，返回一个异步副作用函数
 * - 第二阶段（异步）：异步副作用函数在微任务队列中执行，接收一个值并返回 Promise
 *
 * @template T - 异步阶段接收的值类型
 */
export type Effect<T> = () => (value: T) => Promise<void>;
