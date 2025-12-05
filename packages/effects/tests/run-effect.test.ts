import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Effect } from '../src';
import { runEffect } from '../src';

describe('runEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute first phase synchronously', () => {
    const syncSpy = vi.fn();
    const asyncSpy = vi.fn();

    const effect: Effect<string> = () => {
      syncSpy();
      return async () => {
        asyncSpy();
      };
    };

    runEffect(effect, 'test');

    // 第一阶段应立即执行
    expect(syncSpy).toHaveBeenCalledTimes(1);
    // 第二阶段尚未执行
    expect(asyncSpy).not.toHaveBeenCalled();
  });

  it('should execute second phase in microtask', async () => {
    const asyncSpy = vi.fn();

    const effect: Effect<string> = () => async (value) => {
      asyncSpy(value);
    };

    runEffect(effect, 'test-value');

    // 第二阶段尚未执行
    expect(asyncSpy).not.toHaveBeenCalled();

    // 执行微任务
    await vi.runAllTimersAsync();

    // 第二阶段应已执行
    expect(asyncSpy).toHaveBeenCalledTimes(1);
    expect(asyncSpy).toHaveBeenCalledWith('test-value');
  });

  it('should pass value to second phase', async () => {
    const receivedValues: number[] = [];

    const effect: Effect<number> = () => async (value) => {
      receivedValues.push(value);
    };

    runEffect(effect, 42);
    runEffect(effect, 100);

    await vi.runAllTimersAsync();

    expect(receivedValues).toEqual([42, 100]);
  });
});
