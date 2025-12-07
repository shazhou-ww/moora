/**
 * Tavily Toolkit
 *
 * 基于 @moora/toolkit 创建 Tavily 工具集
 */

import { createToolkit } from "@moora/toolkit";
import type { Toolkit } from "@moora/toolkit";
import { createTavilyTools } from "./tools.js";
import type { TavilyConfig } from "./types.js";

/**
 * 创建 Tavily Toolkit
 *
 * 包含 tavily-search 和 tavily-browse 两个工具
 *
 * @param config - Tavily 配置，包含 API Key
 * @returns Toolkit 实例
 *
 * @example
 * ```typescript
 * const toolkit = createTavilyToolkit({ apiKey: "tvly-YOUR_API_KEY" });
 *
 * // 搜索
 * const searchResult = await toolkit.invoke(
 *   "tavily-search",
 *   JSON.stringify({ query: "What is TypeScript?" })
 * );
 *
 * // 浏览页面
 * const browseResult = await toolkit.invoke(
 *   "tavily-browse",
 *   JSON.stringify({ urls: ["https://www.typescriptlang.org/"] })
 * );
 * ```
 */
export const createTavilyToolkit = (config: TavilyConfig): Toolkit => {
  const tools = createTavilyTools(config);
  return createToolkit(tools);
};
