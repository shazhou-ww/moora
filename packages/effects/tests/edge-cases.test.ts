import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Effect } from '../src';
import { runEffect, asynchronous } from '../src';

describe('edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle errors in sync phase', () => {
    const effect: Effect<void> = () => {
      throw new Error('sync error');
    };

    expect(() => effect()).toThrow('sync error');
  });

  it('should handle errors in async phase', async () => {
    const effect: Effect<void> = () => async () => {
      throw new Error('async error');
    };

    const asyncFn = effect();
    await expect(asyncFn()).rejects.toThrow('async error');
  });

  it('should handle undefined values', async () => {
    const log: (undefined | null)[] = [];

    const effect = asynchronous<undefined>(async (value) => {
      log.push(value);
    });

    runEffect(effect, undefined);
    await vi.runAllTimersAsync();

    expect(log).toEqual([undefined]);
  });

  it('should handle complex object values', async () => {
    interface ComplexValue {
      nested: {
        array: number[];
        fn: () => string;
      };
    }

    const received: ComplexValue[] = [];

    const effect = asynchronous<ComplexValue>(async (value) => {
      received.push(value);
    });

    const testValue: ComplexValue = {
      nested: {
        array: [1, 2, 3],
        fn: () => 'test',
      },
    };

    runEffect(effect, testValue);
    await vi.runAllTimersAsync();

    expect(received[0]).toBe(testValue);
    expect(received[0]!.nested.fn()).toBe('test');
  });
});
