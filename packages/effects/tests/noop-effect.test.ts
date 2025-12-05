import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runEffect, noopEffect } from '../src';

describe('noopEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a function that returns async noop', async () => {
    const effect = noopEffect<string>();

    expect(typeof effect).toBe('function');

    const asyncFn = effect();
    expect(typeof asyncFn).toBe('function');

    // 调用应不报错
    await asyncFn('test');
  });

  it('should do nothing when executed via runEffect', async () => {
    const effect = noopEffect<number>();

    // 应不抛出错误
    runEffect(effect, 123);
    await vi.runAllTimersAsync();
  });

  it('should work with different types', async () => {
    const stringEffect = noopEffect<string>();
    const objectEffect = noopEffect<{ id: number }>();

    runEffect(stringEffect, 'hello');
    runEffect(objectEffect, { id: 1 });

    await vi.runAllTimersAsync();
  });
});
