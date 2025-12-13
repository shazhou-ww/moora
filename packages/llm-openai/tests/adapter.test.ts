import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CallLlmContext, CallLlmCallbacks } from "@moora/agent-worker";

// Mock OpenAI client instance
const mockCreate = vi.fn();

// Mock OpenAI SDK
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// Import after mocking
import { createCallLlmWithOpenAI } from "../src/adapter.js";

describe("createCallLlmWithOpenAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a CallLlm function", () => {
    const callLlm = createCallLlmWithOpenAI({
      apiKey: "test-api-key",
      model: "gpt-4o",
      systemPrompt: "You are a helpful assistant.",
    });

    expect(typeof callLlm).toBe("function");
  });

  it("should call onStart, onChunk, and onComplete for text response", async () => {
    // Create async generator for streaming
    async function* mockStream() {
      yield { choices: [{ delta: { content: "Hello" } }] };
      yield { choices: [{ delta: { content: " " } }] };
      yield { choices: [{ delta: { content: "World" } }] };
    }

    mockCreate.mockReturnValue(mockStream());

    const callLlm = createCallLlmWithOpenAI({
      apiKey: "test-api-key",
      model: "gpt-4o",
      systemPrompt: "You are a helpful assistant.",
    });

    const context: CallLlmContext = {
      messages: [
        { id: "msg-1", role: "user", content: "Hi", timestamp: 1000 },
      ],
      scenario: "re-act-loop",
      tools: [],
      toolCalls: [],
      toolChoice: "auto",
    };

    const callbacks: CallLlmCallbacks = {
      onStart: vi.fn().mockReturnValue("msg-2"),
      onChunk: vi.fn(),
      onComplete: vi.fn(),
      onToolCall: vi.fn(),
    };

    await callLlm(context, callbacks);

    expect(callbacks.onStart).toHaveBeenCalledTimes(1);
    expect(callbacks.onChunk).toHaveBeenCalledTimes(3);
    expect(callbacks.onChunk).toHaveBeenNthCalledWith(1, "Hello");
    expect(callbacks.onChunk).toHaveBeenNthCalledWith(2, " ");
    expect(callbacks.onChunk).toHaveBeenNthCalledWith(3, "World");
    expect(callbacks.onComplete).toHaveBeenCalledWith("Hello World");
    expect(callbacks.onToolCall).not.toHaveBeenCalled();
  });

  it("should accumulate and emit tool calls", async () => {
    // Create async generator for streaming tool calls
    async function* mockStream() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_123",
                  function: { name: "search", arguments: '{"q' },
                },
              ],
            },
          },
        ],
      };
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  function: { arguments: 'uery":"test"}' },
                },
              ],
            },
          },
        ],
      };
    }

    mockCreate.mockReturnValue(mockStream());

    const callLlm = createCallLlmWithOpenAI({
      apiKey: "test-api-key",
      model: "gpt-4o",
      systemPrompt: "You are a helpful assistant.",
    });

    const context: CallLlmContext = {
      messages: [
        { id: "msg-1", role: "user", content: "Search for test", timestamp: 1000 },
      ],
      scenario: "re-act-loop",
      tools: [
        {
          name: "search",
          description: "Search the web",
          parameters: '{"type":"object","properties":{"query":{"type":"string"}}}',
        },
      ],
      toolCalls: [],
      toolChoice: "auto",
    };

    const callbacks: CallLlmCallbacks = {
      onStart: vi.fn().mockReturnValue("msg-2"),
      onChunk: vi.fn(),
      onComplete: vi.fn(),
      onToolCall: vi.fn(),
    };

    await callLlm(context, callbacks);

    expect(callbacks.onStart).not.toHaveBeenCalled(); // No content chunks
    expect(callbacks.onComplete).not.toHaveBeenCalled();
    expect(callbacks.onToolCall).toHaveBeenCalledTimes(1);
    expect(callbacks.onToolCall).toHaveBeenCalledWith({
      name: "search",
      arguments: '{"query":"test"}',
    });
  });

  it("should pass temperature and topP to OpenAI", async () => {
    async function* mockStream() {
      yield { choices: [{ delta: { content: "Hi" } }] };
    }

    mockCreate.mockReturnValue(mockStream());

    const callLlm = createCallLlmWithOpenAI({
      apiKey: "test-api-key",
      model: "gpt-4o",
      systemPrompt: "You are a helpful assistant.",
      temperature: 0.7,
      topP: 0.9,
    });

    const context: CallLlmContext = {
      messages: [],
      scenario: "re-act-loop",
      tools: [],
      toolCalls: [],
      toolChoice: "auto",
    };

    const callbacks: CallLlmCallbacks = {
      onStart: vi.fn().mockReturnValue("msg-1"),
      onChunk: vi.fn(),
      onComplete: vi.fn(),
      onToolCall: vi.fn(),
    };

    await callLlm(context, callbacks);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.7,
        top_p: 0.9,
      })
    );
  });

  it("should include system prompt in messages", async () => {
    async function* mockStream() {
      yield { choices: [{ delta: { content: "Hi" } }] };
    }

    mockCreate.mockReturnValue(mockStream());

    const callLlm = createCallLlmWithOpenAI({
      apiKey: "test-api-key",
      model: "gpt-4o",
      systemPrompt: "You are a helpful assistant.",
    });

    const context: CallLlmContext = {
      messages: [
        { id: "msg-1", role: "user", content: "Hello", timestamp: 1000 },
      ],
      scenario: "re-act-loop",
      tools: [],
      toolCalls: [],
      toolChoice: "auto",
    };

    const callbacks: CallLlmCallbacks = {
      onStart: vi.fn().mockReturnValue("msg-2"),
      onChunk: vi.fn(),
      onComplete: vi.fn(),
      onToolCall: vi.fn(),
    };

    await callLlm(context, callbacks);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello" },
        ],
      })
    );
  });
});
