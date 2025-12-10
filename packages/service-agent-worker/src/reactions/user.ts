/**
 * User Reaction 回调工厂
 *
 * 创建用于通知用户状态变化的回调函数
 */

import { createPatch } from "rfc6902";
import type { PerspectiveOfUser } from "@moora/agent-worker";
import { getLogger } from "@/logger";

const logger = getLogger();

/**
 * 创建 notifyUser 回调
 *
 * 当 PerspectiveOfUser 发生变化时，通过 publishPatch 发布 RFC6902 patch
 *
 * @param publishPatch - 发布 patch 的回调函数
 * @returns notifyUser 回调函数
 */
export function createNotifyUserCallback(publishPatch: (patch: string) => void) {
  let previousPerspective: PerspectiveOfUser | null = null;

  return (perspective: PerspectiveOfUser) => {
    if (previousPerspective === null) {
      logger.server.debug("NotifyUser: First perspective, storing for diff");
      previousPerspective = perspective;
      return;
    }

    const patches = createPatch(previousPerspective, perspective);

    if (patches.length > 0) {
      logger.server.debug(`NotifyUser: Publishing ${patches.length} patches`);
      const patchData = JSON.stringify({
        type: "patch",
        patches,
      });
      publishPatch(patchData);
      previousPerspective = perspective;
    }
  };
}
