/**
 * Agent Coordinator 行为测试
 *
 * 使用 @moora/test-mocks 测试 Agent 的行为流程
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { createMockGen, createMockCallLlm } from "@moora/test-mocks";
import type { Workforce } from "@moora/workforce";
import type { MockCallLlmRecord } from "@moora/test-mocks";

import {
  createAgent,
  createReaction,
  createUserReaction,
  createLlmReaction,
  createToolkitReaction,
  createWorkforceReaction,
} from "../src";

// ============================================================================
// 测试工具函数
// ============================================================================

/**
 * 等待微任务队列刷新
 */
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 10));

/**
 * 等待指定时间
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 创建 Mock Workforce
 */
function createMockWorkforce(): Workforce {
  return {
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
}

// ============================================================================
// 行为测试
// ============================================================================

describe("Agent Coordinator 行为测试", () => {
  let mockGen: ReturnType<typeof createMockGen>;
  let mockWorkforce: Workforce;
  let notifyUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGen = createMockGen({ seed: 12345 });
    mockWorkforce = createMockWorkforce();
    notifyUser = vi.fn(async () => {});
  });

  describe("用户消息驱动 LLM 调用", () => {
    test("发送用户消息后应触发 LLM 调用", async () => {
      // 记录 LLM 调用
      const llmCalls: MockCallLlmRecord[] = [];
      const mockLlm = createMockCallLlm(mockGen, {
        onCall: (record) => llmCalls.push(record),
        delay: 0,
        streaming: false,
      });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      // 发送用户消息
      agent.dispatch({
        type: "send-user-message",
        id: "msg-1",
        content: "Hello, please help me analyze data",
        timestamp: Date.now(),
      });

      // 等待 LLM 调用完成
      await sleep(50);

      // 验证 LLM 被调用
      expect(llmCalls.length).toBe(1);
      expect(llmCalls[0]!.context.messages.length).toBeGreaterThan(0);
    });

    test("LLM 响应后应生成助手消息", async () => {
      const mockLlm = createMockCallLlm(mockGen, {
        delay: 0,
        streaming: false,
      });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      // 发送用户消息
      agent.dispatch({
        type: "send-user-message",
        id: "msg-1",
        content: "Hello",
        timestamp: Date.now(),
      });

      // 等待 LLM 调用完成
      await sleep(100);

      // 验证状态
      const state = agent.current();
      expect(state.userMessages.length).toBe(1);
      expect(state.assiMessages.length).toBe(1);
      expect(state.assiMessages[0]!.streaming).toBe(false);
    });

    test("连续发送多条用户消息应依次触发 LLM 调用", async () => {
      const llmCalls: MockCallLlmRecord[] = [];
      const mockLlm = createMockCallLlm(mockGen, {
        onCall: (record) => llmCalls.push(record),
        delay: 0,
        streaming: false,
      });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      // 发送第一条消息
      agent.dispatch({
        type: "send-user-message",
        id: "msg-1",
        content: "First message",
        timestamp: Date.now(),
      });

      // 等待第一次 LLM 调用完成
      await sleep(100);

      // 发送第二条消息
      agent.dispatch({
        type: "send-user-message",
        id: "msg-2",
        content: "Second message",
        timestamp: Date.now(),
      });

      // 等待第二次 LLM 调用完成
      await sleep(100);

      // 验证两次 LLM 调用
      expect(llmCalls.length).toBe(2);

      // 验证状态
      const state = agent.current();
      expect(state.userMessages.length).toBe(2);
      expect(state.assiMessages.length).toBe(2);
    });
  });

  describe("LLM 调用上下文", () => {
    test("LLM 调用应包含用户消息历史", async () => {
      const llmCalls: MockCallLlmRecord[] = [];
      const mockLlm = createMockCallLlm(mockGen, {
        onCall: (record) => llmCalls.push(record),
        delay: 0,
        streaming: false,
      });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      // 发送用户消息
      agent.dispatch({
        type: "send-user-message",
        id: "msg-1",
        content: "Analyze sales data",
        timestamp: Date.now(),
      });

      await sleep(50);

      // 验证 context 包含用户消息
      expect(llmCalls.length).toBe(1);
      const context = llmCalls[0]!.context;

      // 查找用户消息（排除系统消息）
      const userMessages = context.messages.filter(
        (m) => m.role === "user" && m.id !== "system"
      );
      expect(userMessages.length).toBe(1);
      expect(userMessages[0]!.content).toBe("Analyze sales data");
    });

    test("后续 LLM 调用应包含之前的对话历史", async () => {
      const llmCalls: MockCallLlmRecord[] = [];
      const mockLlm = createMockCallLlm(mockGen, {
        onCall: (record) => llmCalls.push(record),
        delay: 0,
        streaming: false,
      });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      // 第一轮对话
      agent.dispatch({
        type: "send-user-message",
        id: "msg-1",
        content: "First question",
        timestamp: Date.now(),
      });
      await sleep(100);

      // 第二轮对话
      agent.dispatch({
        type: "send-user-message",
        id: "msg-2",
        content: "Follow up question",
        timestamp: Date.now(),
      });
      await sleep(100);

      // 验证第二次调用包含完整历史
      expect(llmCalls.length).toBe(2);
      const secondContext = llmCalls[1]!.context;

      // 应包含两条用户消息和一条助手消息
      const userMessages = secondContext.messages.filter(
        (m) => m.role === "user" && m.id !== "system"
      );
      const assistantMessages = secondContext.messages.filter(
        (m) => m.role === "assistant"
      );

      expect(userMessages.length).toBe(2);
      expect(assistantMessages.length).toBe(1);
    });
  });

  describe("cutOff 机制", () => {
    test("已处理的消息不应重复触发 LLM 调用", async () => {
      const llmCalls: MockCallLlmRecord[] = [];
      const mockLlm = createMockCallLlm(mockGen, {
        onCall: (record) => llmCalls.push(record),
        delay: 0,
        streaming: false,
      });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      const timestamp = Date.now();

      // 发送消息
      agent.dispatch({
        type: "send-user-message",
        id: "msg-1",
        content: "Hello",
        timestamp,
      });

      await sleep(100);

      // 验证只有一次调用
      expect(llmCalls.length).toBe(1);

      // 等待更多时间，确保没有重复调用
      await sleep(100);
      expect(llmCalls.length).toBe(1);
    });
  });

  describe("状态一致性", () => {
    test("初始状态应为空", () => {
      const mockLlm = createMockCallLlm(mockGen, { delay: 0 });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);
      const state = agent.current();

      expect(state.userMessages).toEqual([]);
      expect(state.assiMessages).toEqual([]);
      expect(state.topLevelTaskIds).toEqual([]);
      expect(state.cutOff).toBe(0);
    });

    test("消息 ID 应正确保留", async () => {
      const mockLlm = createMockCallLlm(mockGen, { delay: 0, streaming: false });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      agent.dispatch({
        type: "send-user-message",
        id: "unique-msg-id-123",
        content: "Test message",
        timestamp: Date.now(),
      });

      await nextTick();

      const state = agent.current();
      expect(state.userMessages[0]!.id).toBe("unique-msg-id-123");
    });
  });

  describe("订阅机制", () => {
    test("状态变化应触发订阅回调", async () => {
      const mockLlm = createMockCallLlm(mockGen, { delay: 0, streaming: false });

      const reaction = createReaction({
        user: createUserReaction({ notifyUser }),
        llm: createLlmReaction({ callLlm: mockLlm.callLlm }),
        toolkit: createToolkitReaction({ workforce: mockWorkforce }),
        workforce: createWorkforceReaction({ workforce: mockWorkforce, notifyUser }),
      });

      const agent = createAgent(reaction);

      const updates: unknown[] = [];
      agent.subscribe((update) => {
        updates.push(update);
      });

      agent.dispatch({
        type: "send-user-message",
        id: "msg-1",
        content: "Hello",
        timestamp: Date.now(),
      });

      await sleep(100);

      // 应该有多次状态更新：
      // 1. 用户消息被添加
      // 2. LLM 开始流式输出
      // 3. LLM 完成输出
      expect(updates.length).toBeGreaterThanOrEqual(3);
    });
  });
});
