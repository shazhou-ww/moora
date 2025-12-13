/**
 * 创建 Coordinator Agent 的所有 Reactions
 *
 * 使用 agent-coordinator 提供的标准 reaction 创建函数
 */

import { createPatch } from "rfc6902";

import type { CallLlm } from "@moora/agent-common";
import type {
  ReactionFns,
  PerspectiveOfUser,
  AssiMessage,
} from "@moora/agent-coordinator";
import {
  USER,
  LLM,
  TOOLKIT,
  WORKFORCE,
  createLlmReaction,
  createToolkitReaction,
  createWorkforceReaction,
} from "@moora/agent-coordinator";
import type { Workforce } from "@moora/workforce";
import { getLogger } from "@/logger";

const logger = getLogger();

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
};

// ============================================================================
// User Reaction（Service 层特有，负责发布 patches）
// ============================================================================

/**
 * 创建 User Reaction
 *
 * 这是 service 层特有的实现，负责：
 * 1. 监听 perspective 变化
 * 2. 计算 JSON Patch
 * 3. 通过 publishPatch 发布给前端
 */
function createServiceUserReaction(
  publishPatch: (patch: string) => void
): ReactionFns[typeof USER] {
  let previousPerspective: PerspectiveOfUser | null = null;

  return ({ perspective }) => {
    logger.agent.debug("[UserReaction] Called", {
      userMessagesCount: perspective.userMessages?.length ?? 0,
      assiMessagesCount: perspective.assiMessages?.length ?? 0,
    });

    // 首次调用，只存储 perspective
    if (previousPerspective === null) {
      logger.agent.debug("[UserReaction] First perspective, storing");
      previousPerspective = perspective;
      return;
    }

    // 检查是否有变化
    if (JSON.stringify(previousPerspective) === JSON.stringify(perspective)) {
      logger.agent.debug("[UserReaction] No perspective change");
      return;
    }

    // 计算 patch
    const patches = createPatch(previousPerspective, perspective);

    if (patches.length > 0) {
      logger.agent.info(`[UserReaction] Publishing ${patches.length} patches`, {
        patches: patches.map((p) => ({
          op: p.op,
          path: p.path,
          value: "value" in p ? p.value : undefined,
        })),
        perspective: {
          userMessagesCount: perspective.userMessages?.length ?? 0,
          assiMessagesCount: perspective.assiMessages?.length ?? 0,
          assiMessages: perspective.assiMessages?.map((m: AssiMessage) => ({
            id: m.id,
            streaming: m.streaming,
            contentLength: !m.streaming ? m.content?.length ?? 0 : 0,
          })),
        },
      });

      publishPatch(
        JSON.stringify({
          type: "patch",
          patches,
        })
      );
      previousPerspective = perspective;
    }
  };
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 创建所有 Actor 的 Reactions
 *
 * 使用 agent-coordinator 提供的标准创建函数
 */
export function createReactions(options: CreateReactionsOptions): ReactionFns {
  const { callLlm, workforce, notifyUser, publishPatch } = options;

  // User Reaction - service 层特有实现（发布 patches）
  const userReaction = createServiceUserReaction(publishPatch);

  // LLM Reaction - 使用 agent-coordinator 提供的标准实现
  const llmReaction = createLlmReaction({ callLlm });

  // Toolkit Reaction - 使用 agent-coordinator 提供的标准实现
  const toolkitReaction = createToolkitReaction({ workforce });

  // Workforce Reaction - 使用 agent-coordinator 提供的标准实现
  const workforceReaction = createWorkforceReaction({ workforce, notifyUser });

  return {
    [USER]: userReaction,
    [LLM]: llmReaction,
    [TOOLKIT]: toolkitReaction,
    [WORKFORCE]: workforceReaction,
  };
}
