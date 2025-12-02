// ============================================================================
// 步骤 7：精巧模型便在手 - 创建 createTripletAgentMoorex 工厂函数
// ============================================================================

import { createMoorex } from "@moora/moorex";
import type { Moorex, EffectController } from "@moora/moorex";
import type {
  State,
  Signal,
  Effect,
  RunEffectOptions,
} from "./unified";
import {
  initial,
  transition,
  effectsAt,
  runEffect as unifiedRunEffect,
} from "./unified";
import type {
  CallLLMFn,
  GetToolNamesFn,
  GetToolDefinitionsFn,
  UpdateUIFn,
} from "./effects";

// ============================================================================
// 工厂函数选项类型
// ============================================================================

/**
 * createTripletAgentMoorex 函数选项
 * 
 * 包含所有需要注入的依赖和配置。
 */
export type CreateTripletAgentMoorexOptions = {
  /**
   * 更新 UI 的回调函数
   */
  updateUI: UpdateUIFn;
  
  /**
   * LLM 调用函数
   */
  callLLM: CallLLMFn;
  
  /**
   * 系统提示词
   */
  prompt: string;
  
  /**
   * 获取工具名称列表的函数
   */
  getToolNames: GetToolNamesFn;
  
  /**
   * 获取工具定义的函数
   */
  getToolDefinitions: GetToolDefinitionsFn;
  
  /**
   * 可选的初始状态（用于恢复）
   * 
   * 如果提供，将从该状态恢复；否则使用默认初始状态。
   */
  initialState?: State;
};

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建 Triplet Agent Moorex 实例
 * 
 * 封装 Moorex 的创建逻辑，注入所有必要的依赖。
 * 返回配置好的 Moorex 实例，可以：
 * - 序列化状态（用于持久化）
 * - 从序列化状态恢复（用于迁移和恢复）
 * - 处理异步副作用
 * - 协调多个节点的交互
 * 
 * @param options - 配置选项，包含所有需要注入的依赖
 * @returns Moorex 实例，提供 dispatch、current 和 subscribe 方法
 * 
 * @example
 * ```typescript
 * const moorex = createTripletAgentMoorex({
 *   updateUI: (state, dispatch) => {
 *     // 渲染 UI
 *   },
 *   callLLM: async (prompt, tools, messages) => {
 *     // 调用 LLM API
 *   },
 *   prompt: "You are a helpful assistant.",
 *   getToolNames: async () => ["search", "calculate"],
 *   getToolDefinitions: async (names) => {
 *     // 返回工具定义
 *   },
 * });
 * 
 * // 发送用户消息
 * moorex.dispatch({
 *   type: "sendMessage",
 *   messageId: "msg-1",
 *   message: "Hello",
 * });
 * 
 * // 获取当前状态
 * const state = moorex.current();
 * 
 * // 序列化状态
 * const serialized = JSON.stringify(state);
 * 
 * // 从序列化状态恢复
 * const restored = createTripletAgentMoorex({
 *   ...options,
 *   initialState: JSON.parse(serialized),
 * });
 * ```
 */
export function createTripletAgentMoorex(
  options: CreateTripletAgentMoorexOptions
): Moorex<Signal, Effect, State> {
  const {
    updateUI,
    callLLM,
    prompt,
    getToolNames,
    getToolDefinitions,
    initialState,
  } = options;
  
  // 创建带上下文的 runEffect 函数
  const runEffectWithContext = (
    effect: Effect,
    state: State,
    key: string
  ): EffectController<Signal> => {
    // 调用 unifiedRunEffect，传入所有依赖（除了 dispatch，dispatch 在 start 中提供）
    return unifiedRunEffect(effect, state, key, {
      updateUI,
      callLLM,
      prompt,
      getToolNames,
      getToolDefinitions,
    });
  };
  
  return createMoorex({
    initial: initialState ? () => initialState : initial,
    transition,
    effectsAt,
    runEffect: runEffectWithContext,
  });
}

