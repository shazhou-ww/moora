/**
 * 创建 Coordinator Agent 的所有 Reactions
 *
 * 使用 agent-coordinator 提供的标准 reaction 创建函数
 */

import type { CallLlm } from "@moora/agent-common";
import type { ReactionFns } from "@moora/agent-coordinator";
import {
  USER,
  LLM,
  TOOLKIT,
  WORKFORCE,
  createLlmReaction,
  createToolkitReaction,
} from "@moora/agent-coordinator";
import type { Workforce } from "@moora/workforce";

import { createServiceUserReaction } from "./user";
import { createServiceWorkforceReaction } from "./workforce";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 创建 Reactions 的配置选项
 */
export type CreateReactionsOptions = {
  /** LLM 调用函数 */
  callLlm: CallLlm;
  /** Workforce 实例 */
  workforce: Workforce;
  /** 通知用户的回调函数 */
  notifyUser: (message: string) => void | Promise<void>;
  /** 发布 User Perspective 变化的回调 */
  publishPatch: (patch: string) => void;
  /**
   * 可选的流式开始回调
   *
   * 当 LLM 开始输出时调用，可用于初始化流
   *
   * @param messageId - 消息 ID
   */
  onStreamStart?: (messageId: string) => void;
  /**
   * 可选的流式输出回调
   *
   * 当 LLM 输出 chunk 时调用，可用于实时推送到客户端
   *
   * @param messageId - 消息 ID
   * @param chunk - 输出的 chunk 内容
   */
  onStreamChunk?: (messageId: string, chunk: string) => void;
  /**
   * 可选的流式完成回调
   *
   * 当 LLM 输出完成时调用，可用于关闭流
   *
   * @param messageId - 消息 ID
   * @param content - 完整的输出内容
   */
  onStreamComplete?: (messageId: string, content: string) => void;
};

// ============================================================================
// 主函数
// ============================================================================

/**
 * 创建所有 Actor 的 Reactions
 *
 * 使用 agent-coordinator 提供的标准创建函数
 */
export function createReactions(options: CreateReactionsOptions): ReactionFns {
  const { callLlm, workforce, notifyUser, publishPatch, onStreamStart, onStreamChunk, onStreamComplete } = options;

  // User Reaction - service 层特有实现（发布 patches）
  const userReaction = createServiceUserReaction({ publishPatch });

  // LLM Reaction - 使用 agent-coordinator 提供的标准实现
  const llmReaction = createLlmReaction({
    callLlm,
    onStart: onStreamStart,
    onChunk: onStreamChunk,
    onComplete: onStreamComplete,
  });

  // Toolkit Reaction - 使用 agent-coordinator 提供的标准实现
  const toolkitReaction = createToolkitReaction({ workforce });

  // Workforce Reaction - service 层实现
  const workforceReaction = createServiceWorkforceReaction({ workforce, notifyUser });

  return {
    [USER]: userReaction,
    [LLM]: llmReaction,
    [TOOLKIT]: toolkitReaction,
    [WORKFORCE]: workforceReaction,
  };
}
