import { describe, expect, test } from 'vitest';
import { createMoorex } from '@moora/moorex';
import { createVolition, type VolitionState, type VolitionSignal, type VolitionEffect } from '../src/index';

describe('createVolition', () => {
  test('creates a volition definition with initial state', () => {
    const callLLM = async (prompt: string) => `Response to: ${prompt}`;
    
    const definition = createVolition({
      callLLM,
    });

    const volition = createMoorex(definition);
    const state = volition.getState();

    // 验证初始状态结构
    expect(state).toBeDefined();
    expect(state.channels).toBeDefined();
    expect(state.channels[0]).toBeDefined();
    expect(state.channels[0]?.id).toBe(0);
    expect(state.channels[0]?.connected).toBe(false);
    expect(state.channels[0]?.pendingMessages).toEqual([]);
    expect(state.channels[0]?.waitingForReply).toBe(false);
    
    expect(state.reactLoops).toEqual({});
    expect(state.memory).toBeDefined();
    expect(state.memory.longTerm).toEqual({});
    expect(state.memory.shortTerm).toEqual([]);
    expect(state.nextChannelId).toBe(1);
  });

  test('initializes with custom memory', () => {
    const callLLM = async (prompt: string) => `Response to: ${prompt}`;
    
    const definition = createVolition({
      callLLM,
      initialMemory: {
        longTerm: {
          key1: 'value1',
        },
        shortTerm: [
          {
            timestamp: Date.now(),
            content: 'Initial memory',
          },
        ],
      },
    });

    const volition = createMoorex(definition);
    const state = volition.getState();

    expect(state.memory.longTerm).toEqual({ key1: 'value1' });
    expect(state.memory.shortTerm).toHaveLength(1);
    expect(state.memory.shortTerm[0]?.content).toBe('Initial memory');
  });

  test('transition function returns original state (placeholder)', () => {
    const callLLM = async (prompt: string) => `Response to: ${prompt}`;
    
    const definition = createVolition({
      callLLM,
    });

    const volition = createMoorex(definition);
    const initialState = volition.getState();

    // 发送一个信号
    const signal: VolitionSignal = {
      type: 'channel-message',
      channelId: 0,
      content: 'Test message',
    };

    volition.dispatch(signal);

    // 由于 transition 是占位符，状态应该保持不变
    // 注意：由于是异步处理，我们需要等待一下
    const nextTick = () => new Promise<void>((resolve) => queueMicrotask(resolve));
    
    return nextTick().then(() => {
      const newState = volition.getState();
      // 当前 transition 是占位符，状态应该保持不变
      expect(newState).toEqual(initialState);
    });
  });

  test('effectsAt returns empty object (placeholder)', async () => {
    const callLLM = async (prompt: string) => `Response to: ${prompt}`;
    
    const definition = createVolition({
      callLLM,
    });

    const volition = createMoorex(definition);
    const events: Array<{ type: string; effect?: VolitionEffect; key?: string }> = [];
    
    volition.subscribe((event) => {
      if (event.type === 'effect-started' || event.type === 'effect-canceled') {
        events.push(event);
      }
    });

    // 等待初始 reconciliation
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    // 由于 effectsAt 返回空对象，不应该有 effect-started 事件
    const startedEvents = events.filter((e) => e.type === 'effect-started');
    expect(startedEvents).toHaveLength(0);
  });

  test('accepts tools configuration', () => {
    const callLLM = async (prompt: string) => `Response to: ${prompt}`;
    
    const tool = {
      name: 'test-tool',
      description: 'A test tool',
      execute: async (input: unknown) => {
        return `Result: ${input}`;
      },
    };

    const definition = createVolition({
      callLLM,
      tools: [tool],
    });

    const volition = createMoorex(definition);
    const state = volition.getState();

    // 验证定义创建成功（工具配置被接受）
    expect(state).toBeDefined();
  });
});

describe('VolitionState type', () => {
  test('has correct structure', () => {
    const callLLM = async (prompt: string) => `Response to: ${prompt}`;
    const definition = createVolition({ callLLM });
    const volition = createMoorex(definition);
    const state = volition.getState();

    // 验证 VolitionState 的结构
    expect('channels' in state).toBe(true);
    expect('reactLoops' in state).toBe(true);
    expect('memory' in state).toBe(true);
    expect('nextChannelId' in state).toBe(true);
  });
});

describe('VolitionSignal type', () => {
  test('channel-message signal', () => {
    const signal: VolitionSignal = {
      type: 'channel-message',
      channelId: 0,
      content: 'Test message',
    };

    expect(signal.type).toBe('channel-message');
    expect(signal.channelId).toBe(0);
    expect(signal.content).toBe('Test message');
  });

  test('tool-result signal', () => {
    const signal: VolitionSignal = {
      type: 'tool-result',
      reactLoopId: 'loop-1',
      toolName: 'test-tool',
      result: { success: true },
    };

    expect(signal.type).toBe('tool-result');
    expect(signal.reactLoopId).toBe('loop-1');
    expect(signal.toolName).toBe('test-tool');
    expect(signal.result).toEqual({ success: true });
  });

  test('llm-response signal', () => {
    const signal: VolitionSignal = {
      type: 'llm-response',
      reactLoopId: 'loop-1',
      content: 'LLM response',
    };

    expect(signal.type).toBe('llm-response');
    expect(signal.reactLoopId).toBe('loop-1');
    expect(signal.content).toBe('LLM response');
  });

  test('create-subvolition signal', () => {
    const signal: VolitionSignal = {
      type: 'create-subvolition',
      target: '完成数据分析任务',
    };

    expect(signal.type).toBe('create-subvolition');
    expect(signal.target).toBe('完成数据分析任务');
  });

  test('react-loop-completed signal', () => {
    const signal: VolitionSignal = {
      type: 'react-loop-completed',
      reactLoopId: 'loop-1',
      response: 'Final response',
    };

    expect(signal.type).toBe('react-loop-completed');
    expect(signal.reactLoopId).toBe('loop-1');
    expect(signal.response).toBe('Final response');
  });
});

describe('VolitionEffect type', () => {
  test('send-message effect', () => {
    const effect: VolitionEffect = {
      kind: 'send-message',
      channelId: 0,
      content: 'Message content',
    };

    expect(effect.kind).toBe('send-message');
    expect(effect.channelId).toBe(0);
    expect(effect.content).toBe('Message content');
  });

  test('react-loop effect', () => {
    const effect: VolitionEffect = {
      kind: 'react-loop',
      channelId: 0,
      message: 'Trigger message',
    };

    expect(effect.kind).toBe('react-loop');
    expect(effect.channelId).toBe(0);
    expect(effect.message).toBe('Trigger message');
  });

  test('call-tool effect', () => {
    const effect: VolitionEffect = {
      kind: 'call-tool',
      reactLoopId: 'loop-1',
      toolName: 'test-tool',
      input: { param: 'value' },
    };

    expect(effect.kind).toBe('call-tool');
    expect(effect.reactLoopId).toBe('loop-1');
    expect(effect.toolName).toBe('test-tool');
    expect(effect.input).toEqual({ param: 'value' });
  });

  test('call-llm effect', () => {
    const effect: VolitionEffect = {
      kind: 'call-llm',
      reactLoopId: 'loop-1',
      prompt: 'LLM prompt',
    };

    expect(effect.kind).toBe('call-llm');
    expect(effect.reactLoopId).toBe('loop-1');
    expect(effect.prompt).toBe('LLM prompt');
  });
});


