/**
 * Tavily Tools Tests
 */

import { describe, it, expect, vi } from "vitest";
import {
  createTavilySearchTool,
  createTavilyBrowseTool,
  createTavilyTools,
  createTavilyToolkit,
} from "../src/index.js";

// Mock @tavily/core
vi.mock("@tavily/core", () => ({
  tavily: vi.fn(() => ({
    search: vi.fn(async (query: string, options?: Record<string, unknown>) => ({
      results: [
        {
          title: "Test Result",
          url: "https://example.com",
          content: `Search result for: ${query}`,
          score: 0.95,
          rawContent: options?.includeRawContent ? "Raw content here" : undefined,
        },
      ],
    })),
    extract: vi.fn(async (urls: string[]) => ({
      results: urls.map((url) => ({
        url,
        rawContent: `Content from ${url}`,
      })),
      failedResults: [],
    })),
  })),
}));

describe("createTavilySearchTool", () => {
  const config = { apiKey: "test-api-key" };

  it("should create a tool with correct name", () => {
    const tool = createTavilySearchTool(config);
    expect(tool.name).toBe("tavily-search");
  });

  it("should have proper description", () => {
    const tool = createTavilySearchTool(config);
    expect(tool.description).toContain("Search the web");
  });

  it("should have correct parameter schema", () => {
    const tool = createTavilySearchTool(config);
    expect(tool.parameterSchema.type).toBe("object");
    expect(tool.parameterSchema.required).toContain("query");
  });

  it("should execute search and return results", async () => {
    const tool = createTavilySearchTool(config);
    const params = JSON.stringify({ query: "test query" });

    const result = await tool.execute(params);
    const parsed = JSON.parse(result);

    expect(parsed.query).toBe("test query");
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0].title).toBe("Test Result");
    expect(parsed.results[0].url).toBe("https://example.com");
  });

  it("should pass search options correctly", async () => {
    const tool = createTavilySearchTool(config);
    const params = JSON.stringify({
      query: "test query",
      searchDepth: "advanced",
      maxResults: 10,
      includeDomains: ["example.com"],
    });

    const result = await tool.execute(params);
    const parsed = JSON.parse(result);

    expect(parsed.results).toBeDefined();
  });
});

describe("createTavilyBrowseTool", () => {
  const config = { apiKey: "test-api-key" };

  it("should create a tool with correct name", () => {
    const tool = createTavilyBrowseTool(config);
    expect(tool.name).toBe("tavily-browse");
  });

  it("should have proper description", () => {
    const tool = createTavilyBrowseTool(config);
    expect(tool.description).toContain("Extract and browse content");
  });

  it("should have correct parameter schema", () => {
    const tool = createTavilyBrowseTool(config);
    expect(tool.parameterSchema.type).toBe("object");
    expect(tool.parameterSchema.required).toContain("urls");
  });

  it("should execute extract and return results", async () => {
    const tool = createTavilyBrowseTool(config);
    const params = JSON.stringify({
      urls: ["https://example.com", "https://test.com"],
    });

    const result = await tool.execute(params);
    const parsed = JSON.parse(result);

    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].url).toBe("https://example.com");
    expect(parsed.results[0].rawContent).toContain("Content from");
    expect(parsed.failedResults).toEqual([]);
  });
});

describe("createTavilyTools", () => {
  const config = { apiKey: "test-api-key" };

  it("should create both tools", () => {
    const tools = createTavilyTools(config);
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual(["tavily-search", "tavily-browse"]);
  });
});

describe("createTavilyToolkit", () => {
  const config = { apiKey: "test-api-key" };

  it("should create a toolkit with both tools", () => {
    const toolkit = createTavilyToolkit(config);
    const names = toolkit.getToolNames();

    expect(names).toContain("tavily-search");
    expect(names).toContain("tavily-browse");
  });

  it("should allow getting tool info", () => {
    const toolkit = createTavilyToolkit(config);
    const searchInfo = toolkit.getToolInfo("tavily-search");
    const browseInfo = toolkit.getToolInfo("tavily-browse");

    expect(searchInfo?.name).toBe("tavily-search");
    expect(browseInfo?.name).toBe("tavily-browse");
  });

  it("should invoke tavily-search tool", async () => {
    const toolkit = createTavilyToolkit(config);
    const result = await toolkit.invoke(
      "tavily-search",
      JSON.stringify({ query: "test" })
    );
    const parsed = JSON.parse(result);

    expect(parsed.query).toBe("test");
    expect(parsed.results).toBeDefined();
  });

  it("should invoke tavily-browse tool", async () => {
    const toolkit = createTavilyToolkit(config);
    const result = await toolkit.invoke(
      "tavily-browse",
      JSON.stringify({ urls: ["https://example.com"] })
    );
    const parsed = JSON.parse(result);

    expect(parsed.results).toBeDefined();
    expect(parsed.results[0].url).toBe("https://example.com");
  });
});
