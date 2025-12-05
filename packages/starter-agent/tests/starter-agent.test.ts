/**
 * Starter Agent 测试
 */

import { describe, test, expect } from "vitest";
import { createAgent } from "../src/index";
import type { OutputFns } from "../src/index";

// 创建一个简单的 mock outputFns
const mockOutputFns: OutputFns = {
  user: () => () => () => {},
  llm: () => () => () => {},
};

describe("Starter Agent", () => {
  test("should create agent instance", () => {
    const agent = createAgent(mockOutputFns);
    expect(agent).toBeDefined();
    expect(agent.dispatch).toBeDefined();
    expect(agent.subscribe).toBeDefined();
    expect(agent.current).toBeDefined();
  });

  test("should have initial state", () => {
    const agent = createAgent(mockOutputFns);
    const state = agent.current();

    expect(state.userMessages).toEqual([]);
    expect(state.assiMessages).toEqual([]);
  });

  test("should dispatch user message and update state", () => {
    const agent = createAgent(mockOutputFns);
    const timestamp = Date.now();

    agent.dispatch({
      type: "send-user-message",
      content: "Hello",
      timestamp,
    });

    const state = agent.current();
    expect(state.userMessages).toHaveLength(1);
    expect(state.userMessages[0]?.content).toBe("Hello");
    expect(state.userMessages[0]?.role).toBe("user");
  });

  test("should dispatch assistant message and update state", () => {
    const agent = createAgent(mockOutputFns);
    const timestamp = Date.now();

    agent.dispatch({
      type: "send-assi-message",
      content: "Hi there!",
      timestamp,
    });

    const state = agent.current();
    expect(state.assiMessages).toHaveLength(1);
    expect(state.assiMessages[0]?.content).toBe("Hi there!");
    expect(state.assiMessages[0]?.role).toBe("assistant");
  });

  test("should subscribe to output changes", async () => {
    const agent = createAgent(mockOutputFns);
    let outputReceived = false;

    agent.subscribe((output) => {
      outputReceived = true;
      return () => async () => {
        // Mock async effect
        await Promise.resolve();
      };
    });

    // Wait for microtask to execute
    await new Promise((resolve) => queueMicrotask(resolve));

    expect(outputReceived).toBe(true);
  });
});
