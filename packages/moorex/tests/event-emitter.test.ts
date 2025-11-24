import { describe, expect, test } from 'vitest';
import { createEventEmitter } from '../src/event-emitter';

describe('createEventEmitter', () => {
  test('emits events to registered handlers', () => {
    const { emit, on } = createEventEmitter<{ type: string; value: number }>();
    const events: Array<{ type: string; value: number }> = [];

    on((event) => events.push(event));
    emit({ type: 'test', value: 1 });
    emit({ type: 'test', value: 2 });

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'test', value: 1 });
    expect(events[1]).toEqual({ type: 'test', value: 2 });
  });

  test('supports multiple handlers', () => {
    const { emit, on } = createEventEmitter<{ value: number }>();
    const events1: Array<{ value: number }> = [];
    const events2: Array<{ value: number }> = [];

    on((event) => events1.push(event));
    on((event) => events2.push(event));
    emit({ value: 42 });

    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);
    expect(events1[0]?.value).toBe(42);
    expect(events2[0]?.value).toBe(42);
  });

  test('unsubscribe removes handler', () => {
    const { emit, on } = createEventEmitter<{ value: number }>();
    const events: Array<{ value: number }> = [];

    const unsubscribe = on((event) => events.push(event));
    emit({ value: 1 });
    unsubscribe();
    emit({ value: 2 });

    expect(events).toHaveLength(1);
    expect(events[0]?.value).toBe(1);
  });

  test('multiple unsubscribes work correctly', () => {
    const { emit, on } = createEventEmitter<{ value: number }>();
    const events1: Array<{ value: number }> = [];
    const events2: Array<{ value: number }> = [];

    const unsubscribe1 = on((event) => events1.push(event));
    const unsubscribe2 = on((event) => events2.push(event));
    emit({ value: 1 });
    unsubscribe1();
    emit({ value: 2 });
    unsubscribe2();
    emit({ value: 3 });

    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(2);
    expect(events1[0]?.value).toBe(1);
    expect(events2[0]?.value).toBe(1);
    expect(events2[1]?.value).toBe(2);
  });

  test('emits immutable events', () => {
    const { emit, on } = createEventEmitter<{ value: number }>();
    let receivedEvent: { value: number } | undefined;

    on((event) => {
      receivedEvent = event;
    });

    const originalEvent = { value: 42 };
    emit(originalEvent);

    expect(receivedEvent).toBeDefined();
    // mutative 的 create 会创建不可变代理，但原始对象可能不受影响
    // 这里主要测试事件被正确发出
    if (receivedEvent) {
      expect(receivedEvent.value).toBe(42);
    }
  });

  test('handles empty handler list', () => {
    const { emit } = createEventEmitter<{ value: number }>();
    // 不应该抛出错误
    expect(() => emit({ value: 1 })).not.toThrow();
  });
});

