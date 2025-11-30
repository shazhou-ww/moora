// ============================================================================
// 创建 Reflexor Moorex 实例
// ============================================================================

import { createMoorex } from "@moora/moorex";
import type { Moorex } from "@moora/moorex";
import {
  initializeReflexorState,
  createReflexorInitial,
  createReflexorTransition,
} from "@moora/reflexor-state-machine";
import type {
  ReflexorInput,
  ReflexorState,
} from "@moora/reflexor-state-machine";
import { reflexorEffectsAt } from "./effects-at";
import { createRunEffect } from "./run-effect";
import type { CreateRunEffectOptions } from "./run-effect";
import type { ReflexorEffect } from "./types";

/**
 * 创建 Reflexor Moorex 实例的选项
 */
export type CreateReflexorMoorexOptions = CreateRunEffectOptions & {
  /**
   * 初始状态（可选）
   * 如果不提供，将使用默认初始状态
   */
  initialState?: ReflexorState;
};

/**
 * 创建 Reflexor Moorex 实例
 *
 * @param options - 配置选项
 * @returns Moorex 实例
 *
 * @example
 * ```typescript
 * const moorex = createReflexorMoorex({
 *   brain: myBrainHandler,
 *   toolkit: myToolkitHandler,
 * });
 *
 * // 订阅事件
 * moorex.subscribe((event) => {
 *   console.log(event);
 * });
 *
 * // 分发输入
 * moorex.dispatch({
 *   type: "user-send-message",
 *   messageId: "msg-1",
 *   content: "Hello",
 *   timestamp: Date.now(),
 * });
 * ```
 */
export const createReflexorMoorex = (
  options: CreateReflexorMoorexOptions
): Moorex<ReflexorInput, ReflexorEffect, ReflexorState> => {
  const { brain, toolkit, initialState } = options;

  const state = initialState ?? initializeReflexorState();
  const initial = createReflexorInitial(state);
  const transition = createReflexorTransition();
  const runEffect = createRunEffect({ brain, toolkit });

  return createMoorex({
    initial,
    transition,
    effectsAt: reflexorEffectsAt,
    runEffect,
  });
};

