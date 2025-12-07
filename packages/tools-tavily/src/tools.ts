/**
 * Tavily Tools Implementation
 */

import { tavily } from "@tavily/core";
import type { ToolDefinition } from "@moora/toolkit";
import type {
  TavilyConfig,
  TavilySearchParams,
  TavilySearchResult,
  TavilyExtractParams,
  TavilyExtractResult,
} from "./types.js";

/**
 * 创建 Tavily Search 工具定义
 */
export const createTavilySearchTool = (config: TavilyConfig): ToolDefinition => {
  const client = tavily({ apiKey: config.apiKey });

  return {
    name: "tavily-search",
    description:
      "Search the web using Tavily API. Returns relevant web pages with titles, URLs, and content snippets. Use this for general web searches to find information.",
    parameterSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query string",
        },
        searchDepth: {
          type: "string",
          enum: ["basic", "advanced"],
          description:
            "Search depth: 'basic' for faster results, 'advanced' for more comprehensive results",
          default: "basic",
        },
        includeRawContent: {
          type: "string",
          enum: ["markdown", "text", "false"],
          description: "Format of raw content: 'markdown', 'text', or 'false' to exclude",
          default: "false",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results to return (1-10)",
          default: 5,
        },
        includeDomains: {
          type: "array",
          items: { type: "string" },
          description: "List of domains to include in search",
        },
        excludeDomains: {
          type: "array",
          items: { type: "string" },
          description: "List of domains to exclude from search",
        },
      },
      required: ["query"],
    },
    execute: async (parameters: string): Promise<string> => {
      const params: TavilySearchParams = JSON.parse(parameters);

      const response = await client.search(params.query, {
        searchDepth: params.searchDepth,
        includeRawContent: params.includeRawContent,
        maxResults: params.maxResults,
        includeDomains: params.includeDomains,
        excludeDomains: params.excludeDomains,
      });

      const result: TavilySearchResult = {
        query: params.query,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          rawContent: r.rawContent,
        })),
      };

      return JSON.stringify(result);
    },
  };
};

/**
 * 创建 Tavily Browse (Extract) 工具定义
 */
export const createTavilyBrowseTool = (config: TavilyConfig): ToolDefinition => {
  const client = tavily({ apiKey: config.apiKey });

  return {
    name: "tavily-browse",
    description:
      "Extract and browse content from specific URLs using Tavily API. Use this to get the full content of web pages when you know the exact URLs you want to read.",
    parameterSchema: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          items: { type: "string" },
          description: "List of URLs to extract content from (up to 20 URLs)",
        },
      },
      required: ["urls"],
    },
    execute: async (parameters: string): Promise<string> => {
      const params: TavilyExtractParams = JSON.parse(parameters);

      const response = await client.extract(params.urls);

      const result: TavilyExtractResult = {
        results: response.results.map((r) => ({
          url: r.url,
          rawContent: r.rawContent,
        })),
        failedResults: (response.failedResults || []).map((f) => f.url),
      };

      return JSON.stringify(result);
    },
  };
};

/**
 * 创建所有 Tavily 工具
 */
export const createTavilyTools = (
  config: TavilyConfig
): readonly ToolDefinition[] => {
  return [createTavilySearchTool(config), createTavilyBrowseTool(config)];
};
