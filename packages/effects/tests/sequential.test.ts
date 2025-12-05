import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Effect } from '../src';
import {
  runEffect,
  synchronous,
  asynchronous,
  sequential,
} from '../src';

describe('sequential', () => {
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

    const combined = sequential(effects);
    combined();

    syncSpies.forEach((spy) => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('should execute second phases in order', async () => {
    const order: string[] = [];

    const effects: Effect<void>[] = [
      () => async () => {
        order.push('first');
      },
      () => async () => {
        order.push('second');
      },
      () => async () => {
        order.push('third');
      },
    ];

    const combined = sequential(effects);
    const asyncFn = combined();

    await asyncFn();

    expect(order).toEqual(['first', 'second', 'third']);
  });

  it('should wait for each effect before starting next', async () => {
    const log: string[] = [];

    const effects: Effect<void>[] = [
      () => async () => {
        log.push('start-1');
        await new Promise((r) => setTimeout(r, 100));
        log.push('end-1');
      },
      () => async () => {
        log.push('start-2');
        await new Promise((r) => setTimeout(r, 50));
        log.push('end-2');
      },
    ];

    const combined = sequential(effects);
    const asyncFn = combined();

    const promise = asyncFn();

    await vi.runAllTimersAsync();
    await promise;

    // 顺序应该是严格的
    expect(log).toEqual(['start-1', 'end-1', 'start-2', 'end-2']);
  });

  it('should pass the same value to all effects', async () => {
    const receivedValues: string[] = [];

    const effects: Effect<string>[] = [
      () => async (v) => {
        receivedValues.push(`a:${v}`);
      },
      () => async (v) => {
        receivedValues.push(`b:${v}`);
      },
    ];

    const combined = sequential(effects);
    runEffect(combined, 'test');

    await vi.runAllTimersAsync();

    expect(receivedValues).toEqual(['a:test', 'b:test']);
  });

  it('should work with empty array', async () => {
    const combined = sequential<string>([]);

    runEffect(combined, 'test');
    await vi.runAllTimersAsync();

    // 不应抛出错误
  });

  it('should work with mixed effect types', async () => {
    const log: string[] = [];

    const effects: Effect<number>[] = [
      synchronous(() => { log.push('sync-1'); }),
      asynchronous(async (v) => { log.push(`async:${v}`); }),
      synchronous(() => { log.push('sync-2'); }),
    ];

    const combined = sequential(effects);

    // 第一阶段
    const asyncFn = combined();
    expect(log).toEqual(['sync-1', 'sync-2']);

    // 第二阶段
    await asyncFn(42);
    expect(log).toEqual(['sync-1', 'sync-2', 'async:42']);
  });
});
