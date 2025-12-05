import type { Dispatch, OutputHandler } from "@moora/automata";
import type {
  EffectController,
  MoorexDefinition,
  MoorexEvent,
  Moorex,
  Unsubscribe,
} from "./types";
import { moore, createPubSub } from "@moora/automata";

/**
 * Effect 条目，包含控制器、key 和 effect 本身
 * @internal
 */
type EffectEntry<Input, Effect> = EffectController<Input> & {
  key: string;
  effect: Effect;
};

/**
 * 过滤条目数组
 * @internal
 * @template T - 条目值的类型
 * @param entries - 要过滤的条目数组
 * @param cb - 过滤回调函数
 * @returns 过滤后的条目数组
 */
const filterRecord = <T>(
  entries: [string, T][],
  cb: (entry: [string, T]) => boolean
): [string, T][] => {
  return entries.filter(cb);
};

/**
 * 创建 Moorex 实例
 *
 * Moorex 是一个异步 Moore 状态机，它能够：
 * - 管理状态转换
 * - 根据状态自动协调 effects（副作用）
 * - 在状态变化时自动启动/取消 effects
 * - 提供事件订阅机制
 *
 * @template Input - 输入信号类型
 * @template Effect - Effect 类型
 * @template State - 状态类型
 * @param definition - Moorex 定义，包含初始化、状态转换、effects 计算和运行逻辑
 * @returns Moorex 实例，提供 dispatch、current 和 subscribe 方法
 *
 * @example
 * ```typescript
 * const moorex = createMoorex({
 *   initial: () => ({ count: 0 }),
 *   transition: (input) => (state) => ({ ...state, count: state.count + 1 }),
 *   effectsAt: (state) => ({ log: { message: `Count is ${state.count}` } }),
 *   runEffect: (effect, state, key) => ({
 *     start: async (dispatch) => { console.log(effect.message); },
 *     cancel: () => {},
 *   }),
 * });
 * ```
 */
export function createMoorex<Input, Effect, State>({
  initial,
  transition,
  effectsAt,
  runEffect,
}: MoorexDefinition<Input, Effect, State>): Moorex<Input, Effect, State> {
  // 当前活跃的 effects
  let currentEffects: Record<string, Effect> = {};
  // Moore 机的订阅取消函数（懒加载）
  let unsubscribe: Unsubscribe | null = null;
  // Effect 控制器映射表
  const effectControllers: Map<string, EffectEntry<Input, Effect>> = new Map();
  // 事件发布订阅系统
  const pubsub = createPubSub<MoorexEvent<Input, Effect, State>>();

  // 使用 Moore 机来管理 effects 的计算
  // 输出是根据当前状态计算出的 effects Record
  const mm = moore<Input, Record<string, Effect>, State>({
    initial,
    transition,
    output: (state) => effectsAt(state),
  });

  /**
   * 删除 effect
   * 从控制器映射表和当前 effects 中移除，如果没有任何 effects 了则取消订阅
   * @internal
   */
  const deleteEffect = (key: string) => {
    effectControllers.delete(key);
    delete currentEffects[key];
    // 如果没有活跃的 effects，取消订阅以节省资源
    if (effectControllers.size === 0 && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  /**
   * 协调 effects
   * 比较新的 effects 和当前 effects，确定需要取消和启动的 effects
   * @internal
   * @param effects - 新的 effects Record
   * @returns 返回一个 Effect 函数，该函数接收 dispatch 并执行实际的取消/启动操作
   */
  const reconcileEffects: OutputHandler<Input, Record<string, Effect>> = (effects) => {
    // 找出需要取消的 effects（在新 effects 中不存在的）
    const effectsToCancel = filterRecord(
      Array.from(effectControllers.entries()),
      ([key]) => !effects[key]
    );
    // 找出需要启动的 effects（在当前 effects 中不存在的）
    const effectsToStart = filterRecord(
      Object.entries(effects),
      ([key]) => !currentEffects[key]
    );
    const state = mm.current();
    currentEffects = effects;
    pubsub.pub({ type: "state-updated", state });

    // 返回 Effect 函数（两阶段副作用）
    return () => (dispatch: Dispatch<Input>) => {
      // 取消不再需要的 effects
      for (const [key, { cancel, effect }] of effectsToCancel) {
        cancel();
        deleteEffect(key);
        pubsub.pub({ type: "effect-canceled", effect });
      }
      // 启动新的 effects
      for (const [key, effect] of effectsToStart) {
        const controller = runEffect(effect, state, key);
        effectControllers.set(key, { ...controller, key, effect });
        // 启动 effect 并处理完成/失败事件
        controller
          .start(dispatch)
          .then(() => {
            pubsub.pub({ type: "effect-completed", effect });
          })
          .catch((error) => {
            pubsub.pub({ type: "effect-failed", effect, error });
          })
          .finally(() => {
            // Effect 完成后（无论成功或失败）从控制器中移除
            deleteEffect(key);
          });
        pubsub.pub({ type: "effect-started", effect });
      }
    };
  };

  /**
   * 分发输入信号
   * 懒加载订阅：只有在第一次 dispatch 时才订阅 effects 机
   * @param input - 输入信号
   */
  const dispatch = (input: Input) => {
    if (!unsubscribe) {
      unsubscribe = mm.subscribe(reconcileEffects);
    }
    pubsub.pub({ type: "input-received", input });
    mm.dispatch(input);
  };

  return {
    /** 分发输入信号到状态机 */
    dispatch,
    /** 获取当前状态 */
    current: mm.current,
    /** 订阅 Moorex 事件 */
    subscribe: pubsub.sub,
  };
}
