import { describe, expect, test } from 'vitest';
import { automata, mealy, moore } from '../src/automata';

const nextTick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/**
 * 状态机�?handler 采用两阶段副作用设计�?
 * 1. 第一阶段（同步）：handler(output) 立即同步执行，返回一�?Procedure 函数
 * 2. 第二阶段（异步）：Procedure 函数通过 queueMicrotask 延迟执行，接�?dispatch 方法
 *
 * 这种设计确保了：
 * - handler 的同步部分可以立即处�?output（例如记录日志、更�?UI�?
 * - 异步副作用在微任务队列中执行，不会阻塞当前执行栈
 * - 异步副作用可以通过 dispatch 产生新的输入，形成反馈循�?
 */

describe('machine', () => {
  test('creates machine with initial state', () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ value: state.count })
    );

    expect(sm.current()).toEqual({ count: 0 });
  });

  test('dispatches input and updates state', () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ value: state.count })
    );

    sm.dispatch(5);
    expect(sm.current()).toEqual({ count: 5 });

    sm.dispatch(3);
    expect(sm.current()).toEqual({ count: 8 });
  });

  test('subscribes to output changes', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ value: state.count })
    );

    const outputs: Array<{ value: number }> = [];

    const unsubscribe = sm.subscribe((output) => () => () => {
      outputs.push(output);
    });

    sm.dispatch(1);
    // Procedure 在微任务中执行，需要等�?
    await nextTick();
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toEqual({ value: 1 });

    sm.dispatch(2);
    await nextTick();
    expect(outputs).toHaveLength(2);
    expect(outputs[1]).toEqual({ value: 3 });

    unsubscribe();
    sm.dispatch(3);
    await nextTick();
    expect(outputs).toHaveLength(2); // 取消订阅后不应收到更�?
  });

  test('handler executes synchronously, procedure executes asynchronously', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ value: state.count })
    );

    const syncCalls: Array<{ value: number }> = [];
    const asyncCalls: Array<{ value: number }> = [];

    sm.subscribe((output) => {
      // handler 阶段：同步执行，立即处理 output
      syncCalls.push(output);
      // 返回 Effect（第一阶段同步执行，第二阶段异步执行）
      return () => () => {
        asyncCalls.push(output);
      };
    });

    sm.dispatch(1);
    // 同步部分应该立即执行
    expect(syncCalls).toHaveLength(1);
    expect(syncCalls[0]).toEqual({ value: 1 });
    // 异步部分还未执行
    expect(asyncCalls).toHaveLength(0);

    // 等待微任务执�?
    await nextTick();
    // 异步部分现在应该执行�?
    expect(asyncCalls).toHaveLength(1);
    expect(asyncCalls[0]).toEqual({ value: 1 });
  });

  test('procedure can dispatch new inputs asynchronously', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ value: state.count })
    );

    const outputs: Array<{ value: number }> = [];
    const dispatchCalls: number[] = [];

    sm.subscribe((output) => () => (dispatch) => {
      outputs.push(output);
      // Effect 的异步阶段在微任务中执行，可以异�?dispatch 新的输入
      if (output.value < 5) {
        dispatchCalls.push(output.value);
        dispatch(1);
      }
    });

    sm.dispatch(1);
    await nextTick();
    // 第一�?dispatch 后，Procedure 执行并触发新�?dispatch
    await nextTick();
    // 继续等待新的 dispatch 产生的输�?
    await nextTick();
    await nextTick();
    await nextTick();

    // 应该触发多次更新，直�?value >= 5
    expect(outputs.length).toBeGreaterThan(1);
    expect(dispatchCalls.length).toBeGreaterThan(0);
    const lastOutput = outputs[outputs.length - 1];
    expect(lastOutput).toBeDefined();
    if (lastOutput) {
      expect(lastOutput.value).toBeGreaterThanOrEqual(5);
    }
  });

  test('output function receives full update pack', async () => {
    const sm = automata(
      {
        initial: () => 0,
        transition: (n: number) => (state) => state + n,
      },
      ({ statePrev, input, state }) => ({
        from: statePrev,
        to: state,
        input,
      })
    );

    const outputs: Array<{ from: number; to: number; input: number }> = [];

    const unsubscribe = sm.subscribe((output) => () => () => {
      outputs.push(output);
    });

    sm.dispatch(5);
    await nextTick();
    expect(outputs[0]).toEqual({ from: 0, to: 5, input: 5 });

    sm.dispatch(3);
    await nextTick();
    expect(outputs[1]).toEqual({ from: 5, to: 8, input: 3 });

    unsubscribe();
  });

  test('supports multiple subscribers', async () => {
    const sm = automata(
      {
        initial: () => ({ count: 0 }),
        transition: (n: number) => (state) => ({ count: state.count + n }),
      },
      ({ state }) => ({ value: state.count })
    );

    const outputs1: Array<{ value: number }> = [];
    const outputs2: Array<{ value: number }> = [];

    const unsubscribe1 = sm.subscribe((output) => () => () => {
      outputs1.push(output);
    });

    const unsubscribe2 = sm.subscribe((output) => () => () => {
      outputs2.push(output);
    });

    sm.dispatch(1);
    await nextTick();

    expect(outputs1).toHaveLength(1);
    expect(outputs1[0]).toEqual({ value: 1 });
    expect(outputs2).toHaveLength(1);
    expect(outputs2[0]).toEqual({ value: 1 });

    unsubscribe1();
    sm.dispatch(2);
    await nextTick();

    expect(outputs1).toHaveLength(1); // 取消订阅后不应收到更�?
    expect(outputs2).toHaveLength(2);
    expect(outputs2[1]).toEqual({ value: 3 });

    unsubscribe2();
  });

});

describe('mealy', () => {
  test('creates mealy machine with initial state', () => {
    const mealyMachine = mealy({
      initial: () => 'idle',
      transition: (input: string) => (state) =>
        input === 'start' ? 'running' : state,
      output: ({ input, state }) => `${state}:${input}`,
    });

    expect(mealyMachine.current()).toBe('idle');
  });

  test('dispatches input and updates state', () => {
    const mealyMachine = mealy({
      initial: () => 'idle',
      transition: (input: string) => (state) =>
        input === 'start' ? 'running' : input === 'stop' ? 'idle' : state,
      output: ({ input, state }) => `${state}:${input}`,
    });

    mealyMachine.dispatch('start');
    expect(mealyMachine.current()).toBe('running');

    mealyMachine.dispatch('stop');
    expect(mealyMachine.current()).toBe('idle');
  });

  test('output depends on both input and state', async () => {
    const mealyMachine = mealy({
      initial: () => 'idle',
      transition: (input: string) => (state) =>
        input === 'start' ? 'running' : input === 'stop' ? 'idle' : state,
      output: ({ input, state }) => `${state}:${input}`,
    });

    const outputs: string[] = [];

    const unsubscribe = mealyMachine.subscribe((output) => () => () => {
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
    // output 函数接收的是新状态，dispatch('stop') 后状态变�?'idle'
    // 所以应该是 'idle:stop'，不�?'running:stop'
    expect(outputs[2]).toBe('idle:stop');

    unsubscribe();
  });

  test('output receives full update pack', async () => {
    const mealyMachine = mealy({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: ({ statePrev, input, state }) => ({
        from: statePrev,
        to: state,
        input,
      }),
    });

    const outputs: Array<{ from: number; to: number; input: number }> = [];

    const unsubscribe = mealyMachine.subscribe((output) => () => () => {
      outputs.push(output);
    });

    mealyMachine.dispatch(5);
    await nextTick();
    expect(outputs[0]).toEqual({ from: 0, to: 5, input: 5 });

    mealyMachine.dispatch(3);
    await nextTick();
    expect(outputs[1]).toEqual({ from: 5, to: 8, input: 3 });

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

  test('dispatches input and updates state', () => {
    const mooreMachine = moore({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: (state) => ({ value: state, doubled: state * 2 }),
    });

    mooreMachine.dispatch(5);
    expect(mooreMachine.current()).toBe(5);

    mooreMachine.dispatch(3);
    expect(mooreMachine.current()).toBe(8);
  });

  test('output depends only on state, not input', async () => {
    const mooreMachine = moore({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: (state) => ({ value: state, doubled: state * 2 }),
    });

    const outputs: Array<{ value: number; doubled: number }> = [];

    const unsubscribe = mooreMachine.subscribe((output) => () => () => {
      outputs.push(output);
    });

    // 订阅时应该立即收到当前状态的输出
    await nextTick();
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

    const unsubscribe = mooreMachine.subscribe((output) => () => () => {
      outputs.push(output);
    });

    // 订阅�?handler 立即同步执行，但 Procedure 在微任务中执�?
    // 需要等待微任务才能看到输出
    await nextTick();
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toBe(10);

    mooreMachine.dispatch(5);
    await nextTick();
    expect(outputs).toHaveLength(2);
    expect(outputs[1]).toBe(15);

    unsubscribe();
  });

  test('moore handler executes synchronously on subscribe, procedure executes asynchronously', async () => {
    const mooreMachine = moore({
      initial: () => ({ count: 10 }),
      transition: (n: number) => (state) => ({ count: state.count + n }),
      output: (state) => state.count,
    });

    const syncCalls: number[] = [];
    const asyncCalls: number[] = [];

    mooreMachine.subscribe((output) => {
      // handler 阶段：同步执行，立即处理 output
      syncCalls.push(output);
      // 返回 Effect（第一阶段同步执行，第二阶段异步执行）
      return () => () => {
        asyncCalls.push(output);
      };
    });

    // 同步部分应该立即执行（订阅时�?
    expect(syncCalls).toHaveLength(1);
    expect(syncCalls[0]).toBe(10);
    // 异步部分还未执行
    expect(asyncCalls).toHaveLength(0);

    // 等待微任务执�?
    await nextTick();
    // 异步部分现在应该执行�?
    expect(asyncCalls).toHaveLength(1);
    expect(asyncCalls[0]).toBe(10);
  });

  test('supports multiple subscribers with immediate output', async () => {
    const mooreMachine = moore({
      initial: () => 100,
      transition: (n: number) => (state) => state + n,
      output: (state) => state,
    });

    const outputs1: number[] = [];
    const outputs2: number[] = [];

    const unsubscribe1 = mooreMachine.subscribe((output) => () => () => {
      outputs1.push(output);
    });

    const unsubscribe2 = mooreMachine.subscribe((output) => () => () => {
      outputs2.push(output);
    });

    // 等待初始订阅�?Procedure 执行
    await nextTick();
    // 两个订阅者都应该收到当前状态的输出（通过异步 Procedure�?
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

    expect(outputs1).toHaveLength(2); // 取消订阅后不应收到更�?
    expect(outputs2).toHaveLength(3);
    expect(outputs2[2]).toBe(103);

    unsubscribe2();
  });

  test('moore procedure can dispatch new inputs asynchronously', async () => {
    const mooreMachine = moore({
      initial: () => 0,
      transition: (n: number) => (state) => state + n,
      output: (state) => state,
    });

    const outputs: number[] = [];
    const dispatchCalls: number[] = [];

    mooreMachine.subscribe((output) => () => (dispatch) => {
      outputs.push(output);
      // Effect 的异步阶段在微任务中执行，可以异�?dispatch 新的输入
      if (output < 5) {
        dispatchCalls.push(output);
        dispatch(1);
      }
    });

    // 等待初始订阅�?Procedure 执行
    await nextTick();
    mooreMachine.dispatch(1);
    await nextTick();
    // Procedure 执行并触发新�?dispatch
    await nextTick();
    // 继续等待新的 dispatch 产生的输�?
    await nextTick();
    await nextTick();
    await nextTick();

    // 应该触发多次更新，直�?value >= 5
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

    const unsubscribe = mooreMachine.subscribe((output: State) => () => () => {
      outputs.push(output);
    });

    // 订阅时 handler 立即同步执行，但 Procedure 在微任务中执行
    // 需要等待微任务才能看到输出
    await nextTick();
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
