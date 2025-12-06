/**
 * Agent 测试
 */

import { describe, test, expect } from "vitest";
import { createAgent } from "../src/index";
import type { OutputFns } from "../src/index";

// 创建一个简单的 mock outputFns
const mockOutputFns: OutputFns = {
  user: () => () => async () => {},
  llm: () => () => async () => {},
};

describe("Agent", () => {
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
      id: "test-id-1",
      content: "Hello",
      timestamp,
    });

    const state = agent.current();
    expect(state.userMessages).toHaveLength(1);
    expect(state.userMessages[0]?.content).toBe("Hello");
    expect(state.userMessages[0]?.role).toBe("user");
  });

  test("should dispatch start stream and update state", () => {
    const agent = createAgent(mockOutputFns);
    const timestamp = Date.now();

    agent.dispatch({
      type: "start-assi-message-stream",
      id: "test-id-2",
      timestamp,
    });

    const state = agent.current();
    expect(state.assiMessages).toHaveLength(1);
    expect(state.assiMessages[0]?.id).toBe("test-id-2");
    expect(state.assiMessages[0]?.role).toBe("assistant");
    expect(state.assiMessages[0]?.streaming).toBe(true);
  });

  test("should dispatch end stream and update state", () => {
    const agent = createAgent(mockOutputFns);
    const timestamp = Date.now();
    const messageId = "test-id-3";

    // 先开始流式生成
    agent.dispatch({
      type: "start-assi-message-stream",
      id: messageId,
      timestamp,
    });

    // 然后结束流式生成
    agent.dispatch({
      type: "end-assi-message-stream",
      id: messageId,
      content: "Hi there!",
      timestamp: timestamp + 100,
    });

    const state = agent.current();
    expect(state.assiMessages).toHaveLength(1);
    expect(state.assiMessages[0]?.id).toBe(messageId);
    expect(state.assiMessages[0]?.role).toBe("assistant");
    expect(state.assiMessages[0]?.streaming).toBe(false);
    if (state.assiMessages[0]?.streaming === false) {
      expect(state.assiMessages[0].content).toBe("Hi there!");
    }
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
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(outputReceived).toBe(true);
  });
});
