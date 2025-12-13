/**
 * @moora/service-agent-coordinator 全局类型定义
 */

// ============================================================================
// OpenAI 相关类型
// ============================================================================

/**
 * OpenAI Endpoint 配置
 */
export type OpenAIEndpoint = {
  url: string;
  key: string;
};

/**
 * OpenAI 配置
 */
export type OpenAIConfig = {
  endpoint: OpenAIEndpoint;
  model: string;
};

// ============================================================================
// Stream 相关类型（从 @moora/stream-manager 重新导出）
// ============================================================================

export type {
  SSEConnection,
  StreamConnection,
  StreamManager,
} from "@moora/stream-manager";

// ============================================================================
// Service 相关类型
// ============================================================================

/**
 * 创建服务的选项
 */
export type CreateServiceOptions = {
  /**
   * OpenAI 配置
   */
  openai: OpenAIConfig;
  /**
   * System prompt
   */
  prompt: string;
  /**
   * Toolkit 实例（可选，默认使用空 toolkit）
   */
  toolkit?: import("@moora/toolkit").Toolkit;
  /**
   * Tavily API Key（可选，用于启用 Tavily 搜索工具）
   */
  tavilyApiKey?: string;
  /**
   * Workspace 根目录路径（可选，用于启用 WebDAV 接口和 Workspace 工具）
   * 如果未提供，将从环境变量 WORKSPACE_PATH 读取
   */
  workspacePath?: string;
};
