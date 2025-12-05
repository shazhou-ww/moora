import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Effect } from '../src';
import { stateful, parallel, sequential } from '../src';

describe('composition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow nesting parallel within sequential', async () => {
    const log: string[] = [];

    const innerParallel = parallel<void>([
      () => async () => { log.push('p1'); },
      () => async () => { log.push('p2'); },
    ]);

    const effects: Effect<void>[] = [
      () => async () => { log.push('before'); },
      innerParallel,
      () => async () => { log.push('after'); },
    ];

    const combined = sequential(effects);
    const asyncFn = combined();

    await asyncFn();

    expect(log[0]).toBe('before');
    expect(log[log.length - 1]).toBe('after');
    expect(log.slice(1, 3).sort()).toEqual(['p1', 'p2']);
  });

  it('should allow nesting sequential within parallel', async () => {
    const log: string[] = [];

    const innerSequential = sequential<void>([
      () => async () => { log.push('s1'); },
      () => async () => { log.push('s2'); },
    ]);

    const effects: Effect<void>[] = [
      innerSequential,
      () => async () => { log.push('parallel'); },
    ];

    const combined = parallel(effects);
    const asyncFn = combined();

    await asyncFn();

    // s1 和 s2 应该顺序执行
    const s1Index = log.indexOf('s1');
    const s2Index = log.indexOf('s2');
    expect(s1Index).toBeLessThan(s2Index);
  });

  it('should work with stateful inside parallel', async () => {
    const log: string[] = [];

    const statefulEffect = stateful<string, number>(0, (count) => [
      count + 1,
      async (value) => { log.push(`${count}:${value}`); },
    ]);

    const combined = parallel([statefulEffect, statefulEffect]);

    // 第一次调用
    const asyncFn1 = combined();
    await asyncFn1('first');

    // 第二次调用
    const asyncFn2 = combined();
    await asyncFn2('second');

    // stateful 效果共享状态，所以计数会增加
    expect(log).toContain('0:first');
    expect(log).toContain('1:first');
    expect(log).toContain('2:second');
    expect(log).toContain('3:second');
  });
});
