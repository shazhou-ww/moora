/**
 * Helper Generic 类型
 *
 * 提供泛型辅助类型，用于根据 Actor 类型推导相关类型
 */

import type {
  ActionFromUser,
  ActionFromLlm,
  ActionFromToolkit,
  ActionFromWorkforce,
} from "./actions";
import type { Actors, USER, LLM, TOOLKIT, WORKFORCE } from "./actors";
import type {
  AppearanceOfUser,
  AppearanceOfLlm,
  AppearanceOfToolkit,
  AppearanceOfWorkforce,
} from "./appearances";
import type {
  PerspectiveOfUser,
  PerspectiveOfLlm,
  PerspectiveOfToolkit,
  PerspectiveOfWorkforce,
} from "./perspectives";

// ============================================================================
// Helper Generic Types
// ============================================================================

/**
 * 根据 Actor 类型获取其 Appearance 类型
 */
export type AppearanceOf<Actor extends Actors> = Actor extends typeof USER
  ? AppearanceOfUser
  : Actor extends typeof LLM
    ? AppearanceOfLlm
    : Actor extends typeof TOOLKIT
      ? AppearanceOfToolkit
      : Actor extends typeof WORKFORCE
        ? AppearanceOfWorkforce
        : never;

/**
 * 根据 Actor 类型获取其 Perspective 类型
 */
export type PerspectiveOf<Actor extends Actors> = Actor extends typeof USER
  ? PerspectiveOfUser
  : Actor extends typeof LLM
    ? PerspectiveOfLlm
    : Actor extends typeof TOOLKIT
      ? PerspectiveOfToolkit
      : Actor extends typeof WORKFORCE
        ? PerspectiveOfWorkforce
        : never;

/**
 * 根据 Actor 类型获取其 Action 类型
 */
export type ActionFrom<Actor extends Actors> = Actor extends typeof USER
  ? ActionFromUser
  : Actor extends typeof LLM
    ? ActionFromLlm
    : Actor extends typeof TOOLKIT
      ? ActionFromToolkit
      : Actor extends typeof WORKFORCE
        ? ActionFromWorkforce
        : never;

/**
 * 初始化函数类型
 */
export type InitialFnOf<Actor extends Actors> = () => PerspectiveOf<Actor>;

/**
 * 状态转换函数类型
 *
 * Transition 接收当前 Appearance 和 Action，返回要合并到 Worldscape 的部分数据
 * 使用 Partial 类型因为 transition 只需要返回它要更新的字段
 */
export type TransitionFnOf<Actor extends Actors> = (
  appearance: AppearanceOf<Actor>,
  action: ActionFrom<Actor>
) => Partial<PerspectiveOf<Actor>>;
