import { type Immutable } from 'mutative';

/**
 * 信号队列接口
 */
export type SignalQueue<Signal> = {
  schedule(signal: Immutable<Signal>): void;
};

/**
 * 创建信号队列
 *
 * 信号会被加入队列，在下一个微任务中批量处理。
 *
 * @template Signal - 信号类型
 * @param processBatch - 批量处理信号的函数
 * @returns 信号队列实例
 */
export const createSignalQueue = <Signal>(
  processBatch: (signals: Immutable<Signal>[]) => void,
): SignalQueue<Signal> => {
  const queue: Immutable<Signal>[] = [];
  let draining = false;

  const drain = () => {
    if (draining) return;
    draining = true;
    queueMicrotask(() => {
      const batch = queue.splice(0, queue.length);
      batch.length > 0 && processBatch(batch);
      draining = false;
      queue.length > 0 && drain();
    });
  };

  const schedule = (signal: Immutable<Signal>): void => {
    queue.push(signal);
    drain();
  };

  return { schedule };
};

