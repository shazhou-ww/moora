import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Effect } from '../src';
import {
  runEffect,
  noopEffect,
  synchronous,
  asynchronous,
  parallel,
} from '../src';

describe('parallel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute all first phases synchronously', () => {
    const syncSpies = [vi.fn(), vi.fn(), vi.fn()];

    const effects: Effect<void>[] = syncSpies.map((spy) => () => {
      spy();
      return async () => {};
    });

    const combined = parallel(effects);
    combined();

    syncSpies.forEach((spy) => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('should execute all second phases in parallel', async () => {
    const order: string[] = [];

    const effects: Effect<string>[] = [
      () => async (value) => {
        await Promise.resolve();
        order.push(`a:${value}`);
      },
      () => async (value) => {
        await Promise.resolve();
        order.push(`b:${value}`);
      },
      () => async (value) => {
        await Promise.resolve();
        order.push(`c:${value}`);
      },
    ];

    const combined = parallel(effects);
    const asyncFn = combined();

    await asyncFn('test');

    expect(order).toHaveLength(3);
    expect(order).toContain('a:test');
    expect(order).toContain('b:test');
    expect(order).toContain('c:test');
  });

  it('should pass the same value to all effects', async () => {
    const receivedValues: number[] = [];

    const effects: Effect<number>[] = [
      () => async (v) => {
        receivedValues.push(v);
      },
      () => async (v) => {
        receivedValues.push(v * 2);
      },
      () => async (v) => {
        receivedValues.push(v * 3);
      },
    ];

    const combined = parallel(effects);
    runEffect(combined, 10);

    await vi.runAllTimersAsync();

    expect(receivedValues).toContain(10);
    expect(receivedValues).toContain(20);
    expect(receivedValues).toContain(30);
  });

  it('should work with empty array', async () => {
    const combined = parallel<string>([]);

    runEffect(combined, 'test');
    await vi.runAllTimersAsync();

    // 不应抛出错误
  });

  it('should work with mixed effect types', async () => {
    const log: string[] = [];

    const effects: Effect<string>[] = [
      synchronous(() => { log.push('sync'); }),
      asynchronous(async (v) => { log.push(`async:${v}`); }),
      noopEffect(),
    ];

    const combined = parallel(effects);
    runEffect(combined, 'value');

    // 同步阶段已执行
    expect(log).toContain('sync');

    await vi.runAllTimersAsync();

    expect(log).toContain('async:value');
  });

  it('should wait for all effects to complete', async () => {
    const completionOrder: number[] = [];

    const effects: Effect<void>[] = [
      () => async () => {
        await new Promise((r) => setTimeout(r, 100));
        completionOrder.push(1);
      },
      () => async () => {
        await new Promise((r) => setTimeout(r, 50));
        completionOrder.push(2);
      },
      () => async () => {
        await new Promise((r) => setTimeout(r, 10));
        completionOrder.push(3);
      },
    ];

    const combined = parallel(effects);
    const asyncFn = combined();

    const promise = asyncFn();

    // 并行执行，所以完成顺序取决于延迟时间
    await vi.runAllTimersAsync();
    await promise;

    // 所有都应完成
    expect(completionOrder).toHaveLength(3);
    // 按延迟时间顺序完成：3 (10ms) -> 2 (50ms) -> 1 (100ms)
    expect(completionOrder).toEqual([3, 2, 1]);
  });
});
