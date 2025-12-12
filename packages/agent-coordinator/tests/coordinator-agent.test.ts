/**
 * @moora/agent-coordinator 基础测试
 */

import { describe, it, expect, vi } from "vitest";
import {
  createAgent,
  createReaction,
  createUserReaction,
  createLlmReaction,
  createToolkitReaction,
  createWorkforceReaction,
} from "../src";
import type { Workforce } from "@moora/workforce";

describe("agent-coordinator", () => {
  it("should create agent with all reactions", () => {
    // Mock dependencies
    const notifyUser = vi.fn(async (message: string) => {
      console.log("Notify:", message);
    });

    const callLlm = vi.fn(async (context, callbacks) => {
      callbacks.onStart();
      callbacks.onComplete("Hello, I'm the coordinator agent.");
    });

    const mockWorkforce: Partial<Workforce> = {
      createTasks: vi.fn(),
      appendMessage: vi.fn(),
      cancelTasks: vi.fn(),
      getTask: vi.fn(),
      getTaskStatus: vi.fn(),
      getAllTaskIds: vi.fn(() => []),
      getChildTaskIds: vi.fn(() => []),
      subscribeTaskEvent: vi.fn(() => () => {}),
      subscribeTaskDetailEvent: vi.fn(() => () => {}),
      destroy: vi.fn(),
    };

    // Create reaction
    const reaction = createReaction({
      user: createUserReaction({ notifyUser }),
      llm: createLlmReaction({ callLlm }),
      toolkit: createToolkitReaction({
        workforce: mockWorkforce as Workforce,
      }),
      workforce: createWorkforceReaction({
        workforce: mockWorkforce as Workforce,
        notifyUser,
      }),
    });

    // Create agent
    const agent = createAgent(reaction);

    expect(agent).toBeDefined();
    expect(agent.dispatch).toBeDefined();
    expect(agent.current).toBeDefined();
  });

  it("should handle user message dispatch", async () => {
    const notifyUser = vi.fn(async (message: string) => {});
    const callLlm = vi.fn(async (context, callbacks) => {
      callbacks.onStart();
      callbacks.onComplete("Response from LLM");
    });

    const mockWorkforce: Partial<Workforce> = {
      createTasks: vi.fn(),
      appendMessage: vi.fn(),
      cancelTasks: vi.fn(),
      getTask: vi.fn(),
      getTaskStatus: vi.fn(),
      getAllTaskIds: vi.fn(() => []),
      getChildTaskIds: vi.fn(() => []),
      subscribeTaskEvent: vi.fn(() => () => {}),
      subscribeTaskDetailEvent: vi.fn(() => () => {}),
      destroy: vi.fn(),
    };

    const reaction = createReaction({
      user: createUserReaction({ notifyUser }),
      llm: createLlmReaction({ callLlm }),
      toolkit: createToolkitReaction({
        workforce: mockWorkforce as Workforce,
      }),
      workforce: createWorkforceReaction({
        workforce: mockWorkforce as Workforce,
        notifyUser,
      }),
    });

    const agent = createAgent(reaction);

    // Dispatch a user message
    agent.dispatch({
      type: "send-user-message",
      id: "msg-1",
      content: "Create a task to analyze sales data",
      timestamp: Date.now(),
    });

    // Wait for microtask queue to flush
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Get state
    const state = agent.current();
    expect(state.userMessages).toHaveLength(1);
    expect(state.userMessages[0].content).toBe(
      "Create a task to analyze sales data"
    );
  });

  it("should initialize with empty state", () => {
    const notifyUser = vi.fn();
    const callLlm = vi.fn();

    const mockWorkforce: Partial<Workforce> = {
      createTasks: vi.fn(),
      appendMessage: vi.fn(),
      cancelTasks: vi.fn(),
      getTask: vi.fn(),
      getTaskStatus: vi.fn(),
      getAllTaskIds: vi.fn(() => []),
      getChildTaskIds: vi.fn(() => []),
      subscribeTaskEvent: vi.fn(() => () => {}),
      subscribeTaskDetailEvent: vi.fn(() => () => {}),
      destroy: vi.fn(),
    };

    const reaction = createReaction({
      user: createUserReaction({ notifyUser }),
      llm: createLlmReaction({ callLlm }),
      toolkit: createToolkitReaction({
        workforce: mockWorkforce as Workforce,
      }),
      workforce: createWorkforceReaction({
        workforce: mockWorkforce as Workforce,
        notifyUser,
      }),
    });

    const agent = createAgent(reaction);
    const state = agent.current();

    expect(state.userMessages).toEqual([]);
    expect(state.assiMessages).toEqual([]);
    expect(state.ongoingTopLevelTasks).toEqual([]);
    expect(state.topLevelTaskIds).toEqual([]);
  });
});
