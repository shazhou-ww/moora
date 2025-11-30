// ============================================================================
// Reflexor Run Effect - 执行 Effects
// ============================================================================

import type { EffectController } from "@moora/moorex";
import type { ReflexorInput, ReflexorState } from "@moora/reflexor-state-machine";
import type {
  ReflexorEffect,
  BrainHandler,
  ToolkitHandler,
} from "./types";

/**
 * 创建 runEffect 函数的选项
 */
export type CreateRunEffectOptions = {
  brain: BrainHandler;
  toolkit: ToolkitHandler;
};

/**
 * 创建 runEffect 函数
 *
 * @param options - 配置选项，包含 brain 和 toolkit 处理器
 * @returns runEffect 函数
 *
 * @example
 * ```typescript
 * const runEffect = createRunEffect({
 *   brain: myBrainHandler,
 *   toolkit: myToolkitHandler,
 * });
 *
 * const controller = runEffect(effect, state, key);
 * await controller.start(dispatch);
 * ```
 */
export const createRunEffect = (
  options: CreateRunEffectOptions
): ((
  effect: ReflexorEffect,
  state: ReflexorState,
  key: string
) => EffectController<ReflexorInput>) => {
  const { brain, toolkit } = options;

  return (
    effect: ReflexorEffect,
    state: ReflexorState,
    key: string
  ): EffectController<ReflexorInput> => {
    switch (effect.kind) {
      case "ask-brain":
        return brain.ask(state, effect.signalsCutAt);

      case "request-toolkit":
        return toolkit.execute(state, effect.toolCallId);

      default:
        // 确保所有 case 都被处理
        const _exhaustive: never = effect;
        // 返回一个空的 controller
        return {
          start: async () => {},
          cancel: () => {},
        };
    }
  };
};

