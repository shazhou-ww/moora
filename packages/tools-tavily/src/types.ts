/**
 * Tavily Tools Types
 */

/**
 * Tavily 客户端配置
 */
export interface TavilyConfig {
  /** Tavily API Key */
  readonly apiKey: string;
}

/**
 * Tavily Search 参数
 */
export interface TavilySearchParams {
  /** 搜索查询 */
  readonly query: string;
  /** 搜索深度: basic 或 advanced */
  readonly searchDepth?: "basic" | "advanced";
  /** 原始内容格式: markdown, text, 或 false 表示不包含 */
  readonly includeRawContent?: "markdown" | "text" | false;
  /** 最大结果数 */
  readonly maxResults?: number;
  /** 包含的域名 */
  readonly includeDomains?: string[];
  /** 排除的域名 */
  readonly excludeDomains?: string[];
}

/**
 * Tavily Search 结果项
 */
export interface TavilySearchResultItem {
  readonly title: string;
  readonly url: string;
  readonly content: string;
  readonly score: number;
  readonly rawContent?: string;
}

/**
 * Tavily Search 结果
 */
export interface TavilySearchResult {
  readonly query: string;
  readonly results: TavilySearchResultItem[];
}

/**
 * Tavily Extract (Browse) 参数
 */
export interface TavilyExtractParams {
  /** 要提取内容的 URL 列表 */
  readonly urls: string[];
}

/**
 * Tavily Extract 结果项
 */
export interface TavilyExtractResultItem {
  readonly url: string;
  readonly rawContent: string;
}

/**
 * Tavily Extract 结果
 */
export interface TavilyExtractResult {
  readonly results: TavilyExtractResultItem[];
  readonly failedResults: string[];
}
