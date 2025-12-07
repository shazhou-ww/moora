/**
 * Starter Agent 测试
 */

import { describe, test, expect } from "vitest";
import { createAgent } from "../src/index";
import type { EffectFns } from "../src/index";

// 创建一个简单的 mock effectFns
const mockEffectFns: EffectFns = {
  user: () => {},
  llm: () => {},
};

describe("Starter Agent", () => {
  test("should create agent instance", () => {
    const agent = createAgent(mockEffectFns);
    expect(agent).toBeDefined();
    expect(agent.dispatch).toBeDefined();
    expect(agent.subscribe).toBeDefined();
    expect(agent.current).toBeDefined();
  });

  test("should have initial state", () => {
    const agent = createAgent(mockEffectFns);
    const state = agent.current();

    expect(state.userMessages).toEqual([]);
    expect(state.assiMessages).toEqual([]);
  });

  test("should dispatch user message and update state", async () => {
    const agent = createAgent(mockEffectFns);
    const timestamp = Date.now();

    agent.dispatch({
      type: "send-user-message",
      id: "test-id-1",
      content: "Hello",
      timestamp,
    });

    // dispatch 是异步的，需要等�?
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const state = agent.current();
    expect(state.userMessages).toHaveLength(1);
    expect(state.userMessages[0]?.content).toBe("Hello");
    expect(state.userMessages[0]?.role).toBe("user");
  });

  test("should dispatch assistant message and update state", async () => {
    const agent = createAgent(mockEffectFns);
    const timestamp = Date.now();

    agent.dispatch({
      type: "send-assi-message",
      id: "test-id-2",
      content: "Hi there!",
      timestamp,
    });

    // dispatch 是异步的，需要等�?
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const state = agent.current();
    expect(state.assiMessages).toHaveLength(1);
    expect(state.assiMessages[0]?.content).toBe("Hi there!");
    expect(state.assiMessages[0]?.role).toBe("assistant");
  });

  test("should subscribe to output changes", async () => {
    const agent = createAgent(mockEffectFns);
    let outputReceived = false;

    agent.subscribe((output) => {
      outputReceived = true;
      // Mock effect
    });

    // subscribe 时同步执行，应该立即收到初始状态输�?
    expect(outputReceived).toBe(true);
  });
});
