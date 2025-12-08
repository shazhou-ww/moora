/**
 * User Output 函数实现
 *
 * 通过 PubSub 发布 PerspectiveOfUser 的变化
 */

import { createPatch } from "rfc6902";
import type { PerspectiveOfUser, Actuation } from "@moora/agent";
import type { Dispatch, PubSub } from "@moora/automata";
import type { Eff } from "@moora/effects";
import { getLogger } from "@/logger";

const logger = getLogger();

/**
 * 创建 User Output 函数的选项
 */
export type CreateUserOutputOptions = {
  /**
   * 发布 patch 的回调函数
   */
  publishPatch: PubSub<string>["pub"];
};

/**
 * 创建 User Output 函数
 *
 * 当 PerspectiveOfUser 发生变化时，通过 publishPatch 发布 RFC6902 patch
 *
 * @param options - 创建选项
 * @returns User Output 函数
 */
export function createUserOutput(
  options: CreateUserOutputOptions
): Eff<{ perspective: PerspectiveOfUser; dispatch: Dispatch<Actuation> }> {
  const { publishPatch } = options;
  let previousPerspective: PerspectiveOfUser | null = null;

  return ({ perspective, dispatch }) => {
    // 如果是第一次，记录 perspective，不发送（全量数据在连接时发送）
    if (previousPerspective === null) {
      logger.server.debug("UserOutput: First perspective, storing for diff");
      previousPerspective = perspective;
      return;
    }

    // 计算 diff
    const patches = createPatch(previousPerspective, perspective);

    // 如果有变化，发布 patch
    if (patches.length > 0) {
      logger.server.debug(`UserOutput: Publishing ${patches.length} patches`);
      const patchData = JSON.stringify({
        type: "patch",
        patches,
      });

      publishPatch(patchData);
      previousPerspective = perspective;
    } else {
      logger.server.debug("UserOutput: No changes detected");
    }
  };
}
