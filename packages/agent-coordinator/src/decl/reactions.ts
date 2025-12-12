/**
 * Reaction 回调类型定义
 *
 * 定义各个 Actor 需要的外部依赖回调函数类型
 */

import type { CallLlm } from "@moora/agent-common";
import type { Workforce } from "@moora/workforce";

// ============================================================================
// User Reaction 回调类型
// ============================================================================

/**
 * 通知用户的回调函数类型
 */
export type NotifyUser = (message: string) => Promise<void>;

// ============================================================================
// Llm Reaction 回调类型
// ============================================================================

// CallLlm 类型从 @moora/agent-common 导入
export type { CallLlm };

// ============================================================================
// Workforce Reaction 回调类型
// ============================================================================

/**
 * Workforce 实例
 *
 * Coordinator 通过 Workforce 实例与任务系统交互
 */
export type { Workforce };
