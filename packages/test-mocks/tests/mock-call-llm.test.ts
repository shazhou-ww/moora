import { describe, test, expect, vi } from "vitest";
import { createMockGen } from "../src/mock-gen";
import { createMockCallLlm, createSimpleMockCallLlm } from "../src/mock-call-llm";
import type { CallLlmCallbacks, CallLlmContext } from "@moora/agent-common";

describe("createMockCallLlm", () => {
  const createMockContext = (): CallLlmContext => ({
    messages: [],
    scenario: "re-act-loop",
    tools: [],
    toolCalls: [],
  });

  const createMockCallbacks = (): CallLlmCallbacks & {
    getChunks: () => string[];
    getCompleted: () => string;
    isStarted: () => boolean;
  } => {
    const chunks: string[] = [];
    let completed = "";
    let started = false;

    return {
      getChunks: () => chunks,
      getCompleted: () => completed,
      isStarted: () => started,
      onStart: () => {
        started = true;
        return "msg-1";
      },
      onChunk: (chunk: string) => {
        chunks.push(chunk);
      },
      onComplete: (content: string) => {
        completed = content;
      },
      onToolCall: () => {},
    };
  };

  describe("基本功能", () => {
    test("调用 callLlm 并记录调用", async () => {
      const gen = createMockGen({ seed: 12345 });
      const mockLlm = createMockCallLlm(gen, { delay: 0 });

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);

      const records = mockLlm.getRecords();
      expect(records.length).toBe(1);
      expect(records[0]!.context).toBe(context);
      expect(records[0]!.response.length).toBeGreaterThan(0);
    });

    test("onCall 回调被调用", async () => {
      const gen = createMockGen({ seed: 12345 });
      const onCall = vi.fn();
      const mockLlm = createMockCallLlm(gen, { onCall, delay: 0 });

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);

      expect(onCall).toHaveBeenCalledTimes(1);
      expect(onCall).toHaveBeenCalledWith(
        expect.objectContaining({
          context,
          response: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
    });

    test("clearRecords 清空记录", async () => {
      const gen = createMockGen({ seed: 12345 });
      const mockLlm = createMockCallLlm(gen, { delay: 0 });

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);
      expect(mockLlm.getRecords().length).toBe(1);

      mockLlm.clearRecords();
      expect(mockLlm.getRecords().length).toBe(0);
    });
  });

  describe("流式输出", () => {
    test("streaming=true 时分块输出", async () => {
      const gen = createMockGen({ seed: 12345 });
      const mockLlm = createMockCallLlm(gen, {
        delay: 0,
        streaming: true,
        chunkSize: 5,
      });

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);

      // 应该有多个 chunk
      expect(callbacks.getChunks().length).toBeGreaterThan(1);
      // 合并后应该等于完整内容
      const combined = callbacks.getChunks().join("");
      expect(combined).toBe(callbacks.getCompleted());
    });

    test("streaming=false 时一次性输出", async () => {
      const gen = createMockGen({ seed: 12345 });
      const mockLlm = createMockCallLlm(gen, {
        delay: 0,
        streaming: false,
      });

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);

      // 只有一个 chunk
      expect(callbacks.getChunks().length).toBe(1);
      expect(callbacks.getChunks()[0]).toBe(callbacks.getCompleted());
    });
  });

  describe("回调生命周期", () => {
    test("onStart 在 onChunk 之前调用", async () => {
      const gen = createMockGen({ seed: 12345 });
      const mockLlm = createMockCallLlm(gen, { delay: 0 });

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);

      expect(callbacks.isStarted()).toBe(true);
    });

    test("onComplete 包含完整响应", async () => {
      const gen = createMockGen({ seed: 12345 });
      const mockLlm = createMockCallLlm(gen, { delay: 0 });

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);

      expect(callbacks.getCompleted().length).toBeGreaterThan(0);
    });
  });

  describe("createSimpleMockCallLlm", () => {
    test("便捷方法正常工作", async () => {
      const gen = createMockGen({ seed: 12345 });
      const onCall = vi.fn();
      const mockLlm = createSimpleMockCallLlm(gen, onCall);

      const context = createMockContext();
      const callbacks = createMockCallbacks();

      await mockLlm.callLlm(context, callbacks);

      expect(onCall).toHaveBeenCalledTimes(1);
      expect(mockLlm.getRecords().length).toBe(1);
    });
  });
});
