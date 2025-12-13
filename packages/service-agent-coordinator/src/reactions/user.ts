/**
 * User Reaction
 *
 * Service 层的 User Reaction 实现
 * 负责监听 perspective 变化并发布 JSON Patch 给前端
 */

import { createPatch } from "rfc6902";

import type {
  ReactionFns,
  PerspectiveOfUser,
  AssiMessage,
} from "@moora/agent-coordinator";
import type { USER } from "@moora/agent-coordinator";
import { getLogger } from "@/logger";

const logger = getLogger();

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 创建 User Reaction 的选项
 */
export type CreateServiceUserReactionOptions = {
  /** 发布 User Perspective 变化的回调 */
  publishPatch: (patch: string) => void;
};

// ============================================================================
// 主函数
// ============================================================================

/**
 * 创建 Service 层的 User Reaction
 *
 * 职责：
 * 1. 监听 perspective 变化
 * 2. 计算 JSON Patch
 * 3. 通过 publishPatch 发布给前端
 *
 * @param options - 配置选项
 * @returns User Reaction 函数
 */
export function createServiceUserReaction(
  options: CreateServiceUserReactionOptions
): ReactionFns[typeof USER] {
  const { publishPatch } = options;
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

    // 计算并发布 patch
    publishPatches(previousPerspective, perspective, publishPatch);
    previousPerspective = perspective;
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 计算并发布 JSON Patch
 */
function publishPatches(
  previous: PerspectiveOfUser,
  current: PerspectiveOfUser,
  publishPatch: (patch: string) => void
): void {
  const patches = createPatch(previous, current);

  if (patches.length === 0) {
    return;
  }

  logger.agent.info(`[UserReaction] Publishing ${patches.length} patches`, {
    patches: patches.map((p) => ({
      op: p.op,
      path: p.path,
      value: "value" in p ? p.value : undefined,
    })),
    perspective: {
      userMessagesCount: current.userMessages?.length ?? 0,
      assiMessagesCount: current.assiMessages?.length ?? 0,
      assiMessages: current.assiMessages?.map((m: AssiMessage) => ({
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
}
