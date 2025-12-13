/**
 * Workforce Reaction
 *
 * Service 层的 Workforce Reaction 实现
 * 直接使用 agent-coordinator 提供的 createWorkforceReaction
 */

import { createWorkforceReaction } from "@moora/agent-coordinator";
import type { Workforce } from "@moora/workforce";
import { getLogger } from "@/logger";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 创建 Workforce Reaction 的选项
 */
export type CreateServiceWorkforceReactionOptions = {
  /** Workforce 实例 */
  workforce: Workforce;
  /** 通知用户的回调函数 */
  notifyUser: (message: string) => void | Promise<void>;
};

// ============================================================================
// 主函数
// ============================================================================

const logger = getLogger();

/**
 * 创建 Service 层的 Workforce Reaction
 *
 * 直接委托给 agent-coordinator 的 createWorkforceReaction，
 * 并注入 logger 用于调试
 *
 * @param options - 配置选项
 * @returns Workforce Reaction 函数
 */
export function createServiceWorkforceReaction(
  options: CreateServiceWorkforceReactionOptions
) {
  const { workforce, notifyUser } = options;

  return createWorkforceReaction({
    workforce,
    notifyUser,
    logger: logger.agent,
  });
}
