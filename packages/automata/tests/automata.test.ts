import { describe, expect, test } from 'vitest';
import { automata, mealy, moore } from '../src/automata';

const nextTick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/**
 * 状态机的 subscribe 接收一个简单的回调函数 (output) => void：
 * - handler 接收 output 作为参数，同步执行
 * - dispatch 是异步的（使用 queueMicrotask），通过状态机实例访问
 * - 如果需要在 handler 中 dispatch 新输入，使用状态机实例的 dispatch 方法
 */

describe('machine', () => {
  test('creates machine with initial state', () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ output: { value: state.count } })
    );

    expect(sm.current()).toEqual({ count: 0 });
  });

  test('dispatches input and updates state', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ output: { value: state.count } })
    );

    sm.dispatch(5);
    await nextTick();
    expect(sm.current()).toEqual({ count: 5 });

    sm.dispatch(3);
    await nextTick();
    expect(sm.current()).toEqual({ count: 8 });
  });

  test('subscribes to output changes', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ output: { value: state.count } })
    );

    const outputs: Array<{ value: number }> = [];

    const unsubscribe = sm.subscribe((output) => {
      outputs.push(output);
    });

    // 初始状态输出（订阅时同步执行）
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toEqual({ value: 0 });

    sm.dispatch(1);
    // dispatch 在微任务中执行，需要等待
    await nextTick();
    expect(outputs).toHaveLength(2);
    expect(outputs[1]).toEqual({ value: 1 });

    sm.dispatch(2);
    await nextTick();
    expect(outputs).toHaveLength(3);
    expect(outputs[2]).toEqual({ value: 3 });

    unsubscribe();
    sm.dispatch(3);
    await nextTick();
    expect(outputs).toHaveLength(3); // 取消订阅后不应收到更新
  });

  test('handler executes synchronously, eff executes synchronously', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ output: { value: state.count } })
    );

    const effCalls: Array<{ value: number }> = [];

    sm.subscribe((output) => {
      // handler 同步执行，立即处理 output
      effCalls.push(output);
    });

    // 初始状态输出（订阅时立即执行）
    expect(effCalls).toHaveLength(1);
    expect(effCalls[0]).toEqual({ value: 0 });

    sm.dispatch(1);
    // dispatch 是异步的，需要等待
    await nextTick();
    // handler 应该已经执行
    expect(effCalls).toHaveLength(2);
    expect(effCalls[1]).toEqual({ value: 1 });
  });

  test('handler can dispatch new inputs via machine instance', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ output: { value: state.count } })
    );

    const outputs: Array<{ value: number }> = [];
    const dispatchCalls: number[] = [];

    sm.subscribe((output) => {
      outputs.push(output);
      // 使用 sm.dispatch 而不是接收 dispatch 参数
      if (output.value < 5) {
        dispatchCalls.push(output.value);
        sm.dispatch(1);
      }
    });

    // 初始状态输出（订阅时同步执行）
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toEqual({ value: 0 });

    // 等待初始状态触发的 dispatch
    await nextTick();
    // 继续等待新的 dispatch 产生的输出
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    // 应该触发多次更新，直到 value >= 5
    expect(outputs.length).toBeGreaterThan(1);
    expect(dispatchCalls.length).toBeGreaterThan(0);
    const lastOutput = outputs[outputs.length - 1];
    expect(lastOutput).toBeDefined();
    if (lastOutput) {
      expect(lastOutput.value).toBeGreaterThanOrEqual(5);
    }
  });

  test('output function receives full update pack', async () => {
    type Output = { from: number | null; to: number; input: number | null };
    
    const sm = automata<number, Output, number>(
      {
        initial: () => 0,
        transition: (n: number) => (state) => state + n,
      },
      ({ prev, state }) => {
        if (prev === null) {
          return { output: { from: null, to: state, input: null } };
        }
        return {
          output: {
            from: prev.state,
            to: state,
            input: prev.input,
          },
        };
      }
    );

    const outputs: Output[] = [];

    const unsubscribe = sm.subscribe((output) => {
      outputs.push(output);
    });

    // 初始状态输出（订阅时同步执行）
    expect(outputs[0]).toEqual({ from: null, to: 0, input: null });

    sm.dispatch(5);
    await nextTick();
    expect(outputs[1]).toEqual({ from: 0, to: 5, input: 5 });

    sm.dispatch(3);
    await nextTick();
    expect(outputs[2]).toEqual({ from: 5, to: 8, input: 3 });

    unsubscribe();
  });

  test('supports multiple subscribers', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ output: { value: state.count } })
    );

    const outputs1: Array<{ value: number }> = [];
    const outputs2: Array<{ value: number }> = [];

    const unsubscribe1 = sm.subscribe((output) => {
      outputs1.push(output);
    });

    const unsubscribe2 = sm.subscribe((output) => {
      outputs2.push(output);
    });

    // 初始状态输出（订阅时同步执行）
    expect(outputs1).toHaveLength(1);
    expect(outputs1[0]).toEqual({ value: 0 });
    expect(outputs2).toHaveLength(1);
    expect(outputs2[0]).toEqual({ value: 0 });

    sm.dispatch(1);
    await nextTick();

    expect(outputs1).toHaveLength(2);
    expect(outputs1[1]).toEqual({ value: 1 });
    expect(outputs2).toHaveLength(2);
    expect(outputs2[1]).toEqual({ value: 1 });

    unsubscribe1();
    sm.dispatch(2);
    await nextTick();

    expect(outputs1).toHaveLength(2); // 取消订阅后不应收到更新
    expect(outputs2).toHaveLength(3);
    expect(outputs2[2]).toEqual({ value: 3 });

    unsubscribe2();
  });

});

describe('mealy', () => {
  test('creates mealy machine with initial state', () => {
    const mealyMachine = mealy({
      initial: () => 'idle',
      transition: (input: string) => (state) =>
        input === 'start' ? 'running' : state,
      output: ({ state, input }) => `${state}:${input}`,
    });

    expect(mealyMachine.current()).toBe('idle');
  });

  test('dispatches input and updates state', async () => {
    const mealyMachine = mealy({
      initial: () => 'idle',
      transition: (input: string) => (state) =>
        input === 'start' ? 'running' : input === 'stop' ? 'idle' : state,
      output: ({ state, input }) => `${state}:${input}`,
    });

    mealyMachine.dispatch('start');
    await nextTick();
    expect(mealyMachine.current()).toBe('running');

    mealyMachine.dispatch('stop');
    await nextTick();
    expect(mealyMachine.current()).toBe('idle');
  });

  test('output depends on both input and state', async () => {
    const mealyMachine = mealy({
      initial: () => 'idle',
      transition: (input: string) => (state) =>
        input === 'start' ? 'running' : input === 'stop' ? 'idle' : state,
      output: ({ state, input }) => `${state}:${input}`,
    });

    const outputs: string[] = [];

    const unsubscribe = mealyMachine.subscribe((output) => {
      outputs.push(output);
    });

    mealyMachine.dispatch('start');
    await nextTick();
    // output 函数接收的是新状态，所以应该是 'running:start'
    expect(outputs[0]).toBe('running:start');

    mealyMachine.dispatch('ping');
    await nextTick();
    expect(outputs[1]).toBe('running:ping');

    mealyMachine.dispatch('stop');
    await nextTick();
    // output 函数接收的是新状态，dispatch('stop') 后状态变为 'idle'
    // 所以应该是 'idle:stop'，不是 'running:stop'
    expect(outputs[2]).toBe('idle:stop');

    unsubscribe();
  });

  test('output receives state and input', async () => {
    const mealyMachine = mealy({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: ({ state, input }) => ({
        to: state,
        input,
      }),
    });

    const outputs: Array<{ to: number; input: number }> = [];

    const unsubscribe = mealyMachine.subscribe((output) => {
      outputs.push(output);
    });

    mealyMachine.dispatch(5);
    await nextTick();
    expect(outputs[0]).toEqual({ to: 5, input: 5 });

    mealyMachine.dispatch(3);
    await nextTick();
    expect(outputs[1]).toEqual({ to: 8, input: 3 });

    unsubscribe();
  });
});

describe('moore', () => {
  test('creates moore machine with initial state', () => {
    const mooreMachine = moore({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: (state) => ({ value: state, doubled: state * 2 }),
    });

    expect(mooreMachine.current()).toBe(0);
  });

  test('dispatches input and updates state', async () => {
    const mooreMachine = moore({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: (state) => ({ value: state, doubled: state * 2 }),
    });

    mooreMachine.dispatch(5);
    await nextTick();
    expect(mooreMachine.current()).toBe(5);

    mooreMachine.dispatch(3);
    await nextTick();
    expect(mooreMachine.current()).toBe(8);
  });

  test('output depends only on state, not input', async () => {
    const mooreMachine = moore({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: (state) => ({ value: state, doubled: state * 2 }),
    });

    const outputs: Array<{ value: number; doubled: number }> = [];

    const unsubscribe = mooreMachine.subscribe((output) => {
      outputs.push(output);
    });

    // 订阅时应该立即收到当前状态的输出（同步执行）
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toEqual({ value: 0, doubled: 0 });

    mooreMachine.dispatch(5);
    await nextTick();
    expect(outputs).toHaveLength(2);
    expect(outputs[1]).toEqual({ value: 5, doubled: 10 });

    mooreMachine.dispatch(3);
    await nextTick();
    expect(outputs).toHaveLength(3);
    expect(outputs[2]).toEqual({ value: 8, doubled: 16 });

    unsubscribe();
  });

  test('subscribes immediately with current state output', async () => {
    const mooreMachine = moore({
      initial: () => ({ count: 10 }),
      transition: (n: number) => (state) => ({ count: state.count + n }),
      output: (state) => state.count,
    });

    const outputs: number[] = [];

    const unsubscribe = mooreMachine.subscribe((output) => {
      outputs.push(output);
    });

    // 订阅时 handler 立即同步执行
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toBe(10);

    mooreMachine.dispatch(5);
    await nextTick();
    expect(outputs).toHaveLength(2);
    expect(outputs[1]).toBe(15);

    unsubscribe();
  });

  test('moore handler executes synchronously on subscribe', () => {
    const mooreMachine = moore({
      initial: () => ({ count: 10 }),
      transition: (n: number) => (state) => ({ count: state.count + n }),
      output: (state) => state.count,
    });

    const effCalls: number[] = [];

    mooreMachine.subscribe((output) => {
      // handler 同步执行，立即处理 output
      effCalls.push(output);
    });

    // handler 应该立即执行（订阅时）
    expect(effCalls).toHaveLength(1);
    expect(effCalls[0]).toBe(10);
  });

  test('supports multiple subscribers with immediate output', async () => {
    const mooreMachine = moore({
      initial: () => 100,
      transition: (n: number) => (state) => state + n,
      output: (state) => state,
    });

    const outputs1: number[] = [];
    const outputs2: number[] = [];

    const unsubscribe1 = mooreMachine.subscribe((output) => {
      outputs1.push(output);
    });

    const unsubscribe2 = mooreMachine.subscribe((output) => {
      outputs2.push(output);
    });

    // 两个订阅者都应该立即收到当前状态的输出（同步执行）
    expect(outputs1).toHaveLength(1);
    expect(outputs1[0]).toBe(100);
    expect(outputs2).toHaveLength(1);
    expect(outputs2[0]).toBe(100);

    mooreMachine.dispatch(1);
    await nextTick();

    expect(outputs1).toHaveLength(2);
    expect(outputs1[1]).toBe(101);
    expect(outputs2).toHaveLength(2);
    expect(outputs2[1]).toBe(101);

    unsubscribe1();
    mooreMachine.dispatch(2);
    await nextTick();

    expect(outputs1).toHaveLength(2); // 取消订阅后不应收到更新
    expect(outputs2).toHaveLength(3);
    expect(outputs2[2]).toBe(103);

    unsubscribe2();
  });

  test('moore handler can dispatch via machine instance', async () => {
    const mooreMachine = moore({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: (state) => state,
    });

    const outputs: number[] = [];
    const dispatchCalls: number[] = [];

    mooreMachine.subscribe((output) => {
      outputs.push(output);
      // 使用 mooreMachine.dispatch 而不是接收 dispatch 参数
      if (output < 5) {
        dispatchCalls.push(output);
        mooreMachine.dispatch(1);
      }
    });

    // 初始状态输出（订阅时同步执行）
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toBe(0);

    // 等待初始状态触发的 dispatch
    await nextTick();
    // 继续等待新的 dispatch 产生的输出
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    // 应该触发多次更新，直到 value >= 5
    expect(outputs.length).toBeGreaterThan(1);
    expect(dispatchCalls.length).toBeGreaterThan(0);
    expect(outputs[outputs.length - 1]).toBeGreaterThanOrEqual(5);
  });

  test('handles complex state transitions', async () => {
    type State = {
      items: string[];
      total: number;
    };

    const mooreMachine = moore<{ type: 'add'; item: string } | { type: 'clear' }, State, State>({
      initial: () => ({ items: [], total: 0 }),
      transition: (input) => (state) => {
        if (input.type === 'add') {
          return {
            items: [...state.items, input.item],
            total: state.items.length + 1,
          };
        }
        if (input.type === 'clear') {
          return { items: [], total: 0 };
        }
        return state;
      },
      output: (state) => state,
    });

    const outputs: State[] = [];

    const unsubscribe = mooreMachine.subscribe((output: State) => {
      outputs.push(output);
    });

    // 订阅时 handler 立即同步执行
    expect(outputs[0]).toEqual({ items: [], total: 0 });

    mooreMachine.dispatch({ type: 'add', item: 'a' });
    await nextTick();
    expect(outputs[1]).toEqual({ items: ['a'], total: 1 });

    mooreMachine.dispatch({ type: 'add', item: 'b' });
    await nextTick();
    expect(outputs[2]).toEqual({ items: ['a', 'b'], total: 2 });

    mooreMachine.dispatch({ type: 'clear' });
    await nextTick();
    expect(outputs[3]).toEqual({ items: [], total: 0 });

    unsubscribe();
  });
});
