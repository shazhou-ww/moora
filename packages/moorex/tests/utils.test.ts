import { describe, expect, test } from 'vitest';
import {
  guardCurrentEffect,
  withEffectErrorHandling,
  attachCompletionHandlers,
} from '../src/utils';
import type { RunningEffect, MoorexEvent } from '../src/types';

const nextTick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('guardCurrentEffect', () => {
  test('allows callback when effect is still current', () => {
    const running = new Map<string, RunningEffect<{ key: string }>>();
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: Promise.resolve(),
      cancel: () => {},
    };
    running.set('test', entry);

    let result = 0;
    const guarded = guardCurrentEffect(running, entry)((value: number) => {
      result = value * 2;
    });
    guarded(5);
    expect(result).toBe(10);
  });

  test('blocks callback when effect is no longer current', () => {
    const running = new Map<string, RunningEffect<{ key: string }>>();
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: Promise.resolve(),
      cancel: () => {},
    };
    running.set('test', entry);

    const guarded = guardCurrentEffect(running, entry)((value: number) => value * 2);

    // 替换 entry
    const newEntry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: Promise.resolve(),
      cancel: () => {},
    };
    running.set('test', newEntry);

    // 现在 guarded 应该不执行
    let called = false;
    const guarded2 = guardCurrentEffect(running, entry)(() => {
      called = true;
    });
    guarded2();
    expect(called).toBe(false);
  });

  test('blocks callback when effect is removed', () => {
    const running = new Map<string, RunningEffect<{ key: string }>>();
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: Promise.resolve(),
      cancel: () => {},
    };
    running.set('test', entry);

    const guarded = guardCurrentEffect(running, entry)(() => {
      throw new Error('should not be called');
    });

    running.delete('test');
    expect(() => guarded()).not.toThrow();
  });

  test('works with multiple arguments', () => {
    const running = new Map<string, RunningEffect<{ key: string }>>();
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: Promise.resolve(),
      cancel: () => {},
    };
    running.set('test', entry);

    let result = '';
    const guarded = guardCurrentEffect(running, entry)(
      (a: number, b: number, c: string) => {
        result = `${a + b}-${c}`;
      },
    );
    guarded(1, 2, 'test');
    expect(result).toBe('3-test');
  });
});

describe('withEffectErrorHandling', () => {
  test('returns result when function succeeds', () => {
    const events: MoorexEvent<unknown, unknown, { key: string }>[] = [];
    const emit = (event: MoorexEvent<unknown, unknown, { key: string }>) => {
      events.push(event);
    };

    const effect = { key: 'test' };
    const result = withEffectErrorHandling(effect, emit, () => 42);

    expect(result).toBe(42);
    expect(events).toHaveLength(0);
  });

  test('emits effect-failed and returns undefined when function throws', () => {
    const events: MoorexEvent<unknown, unknown, { key: string }>[] = [];
    const emit = (event: MoorexEvent<unknown, unknown, { key: string }>) => {
      events.push(event);
    };

    const effect = { key: 'test' };
    const error = new Error('test error');
    const result = withEffectErrorHandling(effect, emit, () => {
      throw error;
    });

    expect(result).toBeUndefined();
    expect(events).toHaveLength(1);
    const failedEvent = events[0];
    expect(failedEvent?.type).toBe('effect-failed');
    if (failedEvent && failedEvent.type === 'effect-failed') {
      expect(failedEvent.effect).toEqual(effect);
      expect(failedEvent.error).toBe(error);
    }
  });

  test('handles non-Error exceptions', () => {
    const events: MoorexEvent<unknown, unknown, { key: string }>[] = [];
    const emit = (event: MoorexEvent<unknown, unknown, { key: string }>) => {
      events.push(event);
    };

    const effect = { key: 'test' };
    const error = 'string error';
    const result = withEffectErrorHandling(effect, emit, () => {
      throw error;
    });

    expect(result).toBeUndefined();
    expect(events).toHaveLength(1);
    const failedEvent = events[0];
    if (failedEvent && failedEvent.type === 'effect-failed') {
      expect(failedEvent.error).toBe(error);
    }
  });
});

describe('attachCompletionHandlers', () => {
  test('emits effect-completed when promise resolves', async () => {
    const events: MoorexEvent<unknown, unknown, { key: string }>[] = [];
    const emit = (event: MoorexEvent<unknown, unknown, { key: string }>) => {
      events.push(event);
    };

    const running = new Map<string, RunningEffect<{ key: string }>>();
    const deferred = Promise.resolve();
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: deferred,
      cancel: () => {},
    };
    running.set('test', entry);

    attachCompletionHandlers(entry, running, emit);
    await deferred;
    await nextTick();

    expect(running.has('test')).toBe(false);
    const completed = events.find((e) => e.type === 'effect-completed');
    expect(completed).toBeDefined();
    if (completed && completed.type === 'effect-completed') {
      expect(completed.effect.key).toBe('test');
    }
  });

  test('emits effect-failed when promise rejects', async () => {
    const events: MoorexEvent<unknown, unknown, { key: string }>[] = [];
    const emit = (event: MoorexEvent<unknown, unknown, { key: string }>) => {
      events.push(event);
    };

    const running = new Map<string, RunningEffect<{ key: string }>>();
    const error = new Error('test error');
    const deferred = Promise.reject(error);
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: deferred,
      cancel: () => {},
    };
    running.set('test', entry);

    attachCompletionHandlers(entry, running, emit);
    try {
      await deferred;
    } catch {
      // ignore
    }
    await nextTick();

    expect(running.has('test')).toBe(false);
    const failed = events.find((e) => e.type === 'effect-failed');
    expect(failed).toBeDefined();
    if (failed && failed.type === 'effect-failed') {
      expect(failed.effect.key).toBe('test');
      expect(failed.error).toBe(error);
    }
  });

  test('ignores completion when effect is no longer current', async () => {
    const events: MoorexEvent<unknown, unknown, { key: string }>[] = [];
    const emit = (event: MoorexEvent<unknown, unknown, { key: string }>) => {
      events.push(event);
    };

    const running = new Map<string, RunningEffect<{ key: string }>>();
    const deferred = Promise.resolve();
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: deferred,
      cancel: () => {},
    };
    running.set('test', entry);

    attachCompletionHandlers(entry, running, emit);

    // 在完成前替换 entry
    const newEntry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: Promise.resolve(),
      cancel: () => {},
    };
    running.set('test', newEntry);

    await deferred;
    await nextTick();

    // 原始 entry 的完成应该被忽略
    const completed = events.filter((e) => e.type === 'effect-completed');
    expect(completed).toHaveLength(0);
  });

  test('ignores failure when effect is no longer current', async () => {
    const events: MoorexEvent<unknown, unknown, { key: string }>[] = [];
    const emit = (event: MoorexEvent<unknown, unknown, { key: string }>) => {
      events.push(event);
    };

    const running = new Map<string, RunningEffect<{ key: string }>>();
    const error = new Error('test error');
    const deferred = Promise.reject(error);
    const entry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: deferred,
      cancel: () => {},
    };
    running.set('test', entry);

    attachCompletionHandlers(entry, running, emit);

    // 在失败前替换 entry
    const newEntry: RunningEffect<{ key: string }> = {
      key: 'test',
      effect: { key: 'test' },
      complete: Promise.resolve(),
      cancel: () => {},
    };
    running.set('test', newEntry);

    try {
      await deferred;
    } catch {
      // ignore
    }
    await nextTick();

    // 原始 entry 的失败应该被忽略
    const failed = events.filter((e) => e.type === 'effect-failed');
    expect(failed).toHaveLength(0);
  });
});

