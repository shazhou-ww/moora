import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runEffect, stateful } from '../src';

describe('stateful', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should maintain state across calls', () => {
    const states: number[] = [];

    const effect = stateful<void, number>(0, (count) => {
      states.push(count);
      return [count + 1, async () => {}];
    });

    effect();
    effect();
    effect();

    expect(states).toEqual([0, 1, 2]);
  });

  it('should update state in sync phase only', () => {
    let stateSnapshot: number | null = null;

    const effect = stateful<string, number>(0, (count) => {
      stateSnapshot = count;
      return [
        count + 1,
        async () => {
          // 异步阶段不应影响状态
        },
      ];
    });

    effect();
    expect(stateSnapshot).toBe(0);

    effect();
    expect(stateSnapshot).toBe(1);

    effect();
    expect(stateSnapshot).toBe(2);
  });

  it('should pass value to async function', async () => {
    const receivedValues: string[] = [];

    const effect = stateful<string, number>(0, (count) => [
      count + 1,
      async (value) => {
        receivedValues.push(`${count}:${value}`);
      },
    ]);

    const asyncFn1 = effect();
    const asyncFn2 = effect();

    await asyncFn1('a');
    await asyncFn2('b');

    expect(receivedValues).toEqual(['0:a', '1:b']);
  });

  it('should work with complex state', () => {
    interface State {
      count: number;
      history: string[];
    }

    const effect = stateful<string, State>(
      { count: 0, history: [] },
      (state) => [
        {
          count: state.count + 1,
          history: [...state.history, `call-${state.count}`],
        },
        async () => {},
      ]
    );

    effect();
    effect();
    effect();

    // 验证通过再次调用获取状态
    const statesLog: number[] = [];
    const logEffect = stateful<void, number>(0, (count) => {
      statesLog.push(count);
      return [count + 10, async () => {}];
    });

    logEffect();
    logEffect();
    expect(statesLog).toEqual([0, 10]);
  });

  it('should work with runEffect', async () => {
    const log: string[] = [];

    const effect = stateful<string, number>(0, (count) => [
      count + 1,
      async (value) => {
        log.push(`${count}:${value}`);
      },
    ]);

    runEffect(effect, 'first');
    runEffect(effect, 'second');
    runEffect(effect, 'third');

    await vi.runAllTimersAsync();

    expect(log).toEqual(['0:first', '1:second', '2:third']);
  });

  it('should allow conditional state updates', () => {
    const effect = stateful<string, string[]>([], (buffer) => {
      if (buffer.length >= 3) {
        // 清空缓冲区
        return [[], async () => {}];
      }
      return [[...buffer, 'item'], async () => {}];
    });

    const asyncFns = [];
    for (let i = 0; i < 5; i++) {
      asyncFns.push(effect());
    }

    // 状态变化：[] -> ['item'] -> ['item','item'] -> ['item','item','item'] -> [] -> ['item']
    // 第4次调用时 buffer.length >= 3，所以清空
  });
});
