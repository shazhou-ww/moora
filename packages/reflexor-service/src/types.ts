// ============================================================================
// Reflexor Service 类型定义
// ============================================================================

import { z } from "zod";
import type { EffectController } from "@moora/moorex";
import type { ReflexorInput, ReflexorState } from "@moora/reflexor-state-machine";

// ============================================================================
// Effect 类型
// ============================================================================

/**
 * 向 Brain 发起请求
 *
 * Effect 结构尽可能简化，因为 runEffect 会收到完整的 State 作为参数。
 * 只需要包含 signalsCutAt 时间戳，表示参考的 user message 和 tool response 的时间截止点。
 *
 * Effect key: ask-brain-${signalsCutAt}
 */
export const askBrainEffectSchema = z
  .object({
    kind: z.literal("ask-brain"),
    signalsCutAt: z.number(),
  })
  .readonly();

export type AskBrainEffect = z.infer<typeof askBrainEffectSchema>;

/**
 * 请求 Toolkit 执行工具
 *
 * Effect 结构尽可能简化，因为 runEffect 会收到完整的 State 作为参数。
 * 只需要包含 toolCallId，其他信息（name、parameters）可以从 state.toolCalls[toolCallId] 获取。
 *
 * Effect key: request-toolkit-${toolCallId}
 */
export const requestToolkitEffectSchema = z
  .object({
    kind: z.literal("request-toolkit"),
    toolCallId: z.string(),
  })
  .readonly();

export type RequestToolkitEffect = z.infer<typeof requestToolkitEffectSchema>;

/**
 * Reflexor Effect 类型（仅后端使用）
 *
 * 分为两大类：发给 Brain、发给 Toolkit
 * 注意：不包含 "发给 User"，前端通过观察 state 变化来更新 UI
 */
export const reflexorEffectSchema = z.discriminatedUnion("kind", [
  askBrainEffectSchema,
  requestToolkitEffectSchema,
]);

export type ReflexorEffect = z.infer<typeof reflexorEffectSchema>;

// ============================================================================
// Brain 处理器类型
// ============================================================================

/**
 * Brain 处理器
 *
 * 负责与 LLM 交互。
 */
export type BrainHandler = {
  /**
   * 发起 LLM 请求
   *
   * @param state - 当前状态
   * @param signalsCutAt - 信号截止时间戳
   * @returns Effect 控制器
   */
  ask: (
    state: ReflexorState,
    signalsCutAt: number
  ) => EffectController<ReflexorInput>;
};

// ============================================================================
// Toolkit 处理器类型
// ============================================================================

/**
 * Toolkit 处理器
 *
 * 负责与外部工具交互。
 */
export type ToolkitHandler = {
  /**
   * 执行工具调用
   *
   * @param state - 当前状态
   * @param toolCallId - 工具调用 ID
   * @returns Effect 控制器
   */
  execute: (
    state: ReflexorState,
    toolCallId: string
  ) => EffectController<ReflexorInput>;
};

// ============================================================================
// 服务配置类型
// ============================================================================

/**
 * Reflexor 服务配置
 */
export type ReflexorServiceConfig = {
  /**
   * Brain 处理器
   */
  brain: BrainHandler;

  /**
   * Toolkit 处理器
   */
  toolkit: ToolkitHandler;
};

