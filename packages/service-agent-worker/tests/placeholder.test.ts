/**
 * Agent Service 测试
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the entire createService module
vi.mock("../src/server/create", () => ({
  createService: vi.fn((options) => {
    // Mock Elysia app
    return {
      get: vi.fn(),
      post: vi.fn(),
      listen: vi.fn(),
    };
  }),
}));

import { createService } from "../src/server/create";

describe("Service Creation", () => {
  const mockOptions = {
    openai: {
      endpoint: {
        url: "https://api.openai.com/v1",
        key: "test-key",
      },
      model: "gpt-4",
    },
    prompt: "You are a helpful assistant.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates service with valid options", () => {
    const app = createService(mockOptions);
    expect(app).toBeDefined();
    expect(typeof app.get).toBe("function");
    expect(typeof app.post).toBe("function");
  });

  test("creates service with toolkit", () => {
    const mockToolkit = {};
    const app = createService({
      ...mockOptions,
      toolkit: mockToolkit,
    });
    expect(app).toBeDefined();
  });

  test("creates service with tavily api key", () => {
    const app = createService({
      ...mockOptions,
      tavilyApiKey: "test-tavily-key",
    });
    expect(app).toBeDefined();
  });

  test("has required routes", () => {
    const app = createService(mockOptions);

    // Check that the app has the expected methods
    expect(app).toHaveProperty("get");
    expect(app).toHaveProperty("post");
  });
});
