// ============================================================================
// Agent App Controller 类型定义
// ============================================================================

/**
 * 创建 Agent Controller 的选项
 */
export type CreateAgentControllerOptions = {
  /**
   * Agent 服务的 endpoint URL
   */
  endpoint: string;

  /**
   * 可选的请求 ID 生成器
   */
  generateRequestId?: () => string;
};

