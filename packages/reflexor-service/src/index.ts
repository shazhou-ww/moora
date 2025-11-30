// ============================================================================
// Reflexor Service 导出
// ============================================================================

/**
 * Reflexor Service
 *
 * 提供基于 reflexor-state-machine 的后端服务，包括：
 * - Effect 类型和计算
 * - Moorex 实例创建
 * - Fastify 集成
 */

// ============================================================================
// 导出所有类型
// ============================================================================

export type {
  AskBrainEffect,
  RequestToolkitEffect,
  ReflexorEffect,
  BrainHandler,
  ToolkitHandler,
  ReflexorServiceConfig,
} from "./types";

export {
  askBrainEffectSchema,
  requestToolkitEffectSchema,
  reflexorEffectSchema,
} from "./types";

export type { CreateRunEffectOptions } from "./run-effect";
export type { CreateReflexorMoorexOptions } from "./create-reflexor-moorex";
export type { CreateReflexorNodeOptions } from "./create-reflexor-node";

// ============================================================================
// 导出函数
// ============================================================================

export { reflexorEffectsAt } from "./effects-at";
export { createRunEffect } from "./run-effect";
export { createReflexorMoorex } from "./create-reflexor-moorex";
export { createReflexorNode } from "./create-reflexor-node";

