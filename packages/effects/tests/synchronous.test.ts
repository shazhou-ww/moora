import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runEffect, synchronous } from '../src';

describe('synchronous', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute sync function in first phase', () => {
    const syncSpy = vi.fn();

    const effect = synchronous<string>(syncSpy);
    effect();

    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  it('should not execute anything in second phase', async () => {
    const syncSpy = vi.fn();

    const effect = synchronous<string>(syncSpy);
    const asyncFn = effect();

    expect(syncSpy).toHaveBeenCalledTimes(1);

    await asyncFn('test');

    // 同步函数不应被再次调用
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  it('should work with runEffect', async () => {
    const syncSpy = vi.fn();

    const effect = synchronous<number>(syncSpy);
    runEffect(effect, 42);

    // 同步阶段已执行
    expect(syncSpy).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();

    // 不应再次调用
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  it('should allow access to closure variables', () => {
    let counter = 0;

    const effect = synchronous<void>(() => {
      counter++;
    });

    effect();
    effect();
    effect();

    expect(counter).toBe(3);
  });
});
