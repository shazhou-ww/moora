import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runEffect, asynchronous } from '../src';

describe('asynchronous', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not execute anything in first phase', () => {
    const asyncSpy = vi.fn();

    const effect = asynchronous<string>(async (value) => {
      asyncSpy(value);
    });

    effect();

    expect(asyncSpy).not.toHaveBeenCalled();
  });

  it('should execute async function in second phase', async () => {
    const asyncSpy = vi.fn();

    const effect = asynchronous<string>(async (value) => {
      asyncSpy(value);
    });

    const asyncFn = effect();
    await asyncFn('test-value');

    expect(asyncSpy).toHaveBeenCalledTimes(1);
    expect(asyncSpy).toHaveBeenCalledWith('test-value');
  });

  it('should work with runEffect', async () => {
    const asyncSpy = vi.fn();

    const effect = asynchronous<number>(async (value) => {
      asyncSpy(value);
    });

    runEffect(effect, 123);

    expect(asyncSpy).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(asyncSpy).toHaveBeenCalledTimes(1);
    expect(asyncSpy).toHaveBeenCalledWith(123);
  });

  it('should handle async operations', async () => {
    const results: string[] = [];

    const effect = asynchronous<string>(async (value) => {
      await Promise.resolve();
      results.push(value);
    });

    runEffect(effect, 'first');
    runEffect(effect, 'second');

    await vi.runAllTimersAsync();

    expect(results).toEqual(['first', 'second']);
  });
});
