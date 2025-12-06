/**
 * Server 模块类型定义
 */

/**
 * SSE 连接（用于 /agent 路由）
 */
export type AgentSSEConnection = {
  queue: string[];
  resolve: (() => void) | null;
  closed: boolean;
};

/**
 * 创建服务的选项
 */
export type CreateServiceOptions = {
  /**
   * OpenAI 配置
   */
  openai: {
    endpoint: {
      url: string;
      key: string;
    };
    model: string;
  };

  /**
   * System prompt
   */
  prompt: string;
};
