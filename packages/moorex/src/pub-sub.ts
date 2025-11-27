import type { CancelFn } from './types';

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

/**
 * 创建发布订阅组件
 *
 * @template T - 发布的数据类型
 * @returns PubSub 实例
 */
export const createPubSub = <T>(): PubSub<T> => {
  const subscribers = new Set<(value: T) => void>();

  const pub = (value: T) => {
    for (const handler of subscribers) {
      handler(value);
    }
  };

  const sub = (handler: (value: T) => void): CancelFn => {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  };

  return { pub, sub };
};
