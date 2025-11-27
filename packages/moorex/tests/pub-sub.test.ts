import { describe, expect, test } from 'vitest';
import { createPubSub } from '../src/pub-sub';

const nextTick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('createPubSub', () => {
  test('publishes to subscribers', () => {
    const pubsub = createPubSub<string>();
    const received: string[] = [];

    pubsub.sub((value) => {
      received.push(value);
    });

    pubsub.pub('hello');
    pubsub.pub('world');

    expect(received).toEqual(['hello', 'world']);
  });

  test('supports multiple subscribers', () => {
    const pubsub = createPubSub<number>();
    const received1: number[] = [];
    const received2: number[] = [];

    pubsub.sub((value) => {
      received1.push(value);
    });

    pubsub.sub((value) => {
      received2.push(value);
    });

    pubsub.pub(1);
    pubsub.pub(2);

    expect(received1).toEqual([1, 2]);
    expect(received2).toEqual([1, 2]);
  });

  test('unsubscribes correctly', () => {
    const pubsub = createPubSub<string>();
    const received: string[] = [];

    const unsubscribe = pubsub.sub((value) => {
      received.push(value);
    });

    pubsub.pub('before');
    unsubscribe();
    pubsub.pub('after');

    expect(received).toEqual(['before']);
  });

  test('handles multiple unsubscribes', () => {
    const pubsub = createPubSub<number>();
    const received: number[] = [];

    const unsubscribe1 = pubsub.sub((value) => {
      received.push(value);
    });

    const unsubscribe2 = pubsub.sub((value) => {
      received.push(value * 2);
    });

    pubsub.pub(1);
    unsubscribe1();
    pubsub.pub(2);
    unsubscribe2();
    pubsub.pub(3);

    expect(received).toEqual([1, 2, 4]);
  });

  test('handles unsubscribe during publish', () => {
    const pubsub = createPubSub<string>();
    const received: string[] = [];

    pubsub.sub((value) => {
      received.push(value);
      if (value === 'unsubscribe') {
        // 在发布过程中取消订阅不应该影响当前发布
        pubsub.sub(() => {})(); // 创建一个并立即取消
      }
    });

    pubsub.pub('before');
    pubsub.pub('unsubscribe');
    pubsub.pub('after');

    expect(received).toEqual(['before', 'unsubscribe', 'after']);
  });
});
