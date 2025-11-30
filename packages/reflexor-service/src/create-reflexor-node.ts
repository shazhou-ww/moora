// ============================================================================
// 创建 Reflexor Fastify Node
// ============================================================================

import { createMoorexNode } from "@moora/moorex-fastify";
import type { MoorexNode, HandlePost } from "@moora/moorex-fastify";
import type { Moorex } from "@moora/moorex";
import {
  reflexorInputSchema,
} from "@moora/reflexor-state-machine";
import type {
  ReflexorInput,
  ReflexorState,
} from "@moora/reflexor-state-machine";
import type { ReflexorEffect } from "./types";

/**
 * 创建 Reflexor Node 实例的选项
 */
export type CreateReflexorNodeOptions = {
  /**
   * 已配置好的 Moorex 实例
   */
  moorex: Moorex<ReflexorInput, ReflexorEffect, ReflexorState>;
};

/**
 * 创建时间戳生成器
 *
 * 如果在同一毫秒内有多个 Input，自动 +1 避免冲突
 */
const createTimestampGenerator = (): (() => number) => {
  let lastTimestamp = 0;

  return (): number => {
    const now = Date.now();
    if (now <= lastTimestamp) {
      lastTimestamp += 1;
    } else {
      lastTimestamp = now;
    }
    return lastTimestamp;
  };
};

/**
 * 创建 Reflexor Node 实例
 *
 * @param options - 配置选项
 * @returns MoorexNode 实例
 *
 * @example
 * ```typescript
 * const moorex = createReflexorMoorex({ brain, toolkit });
 * const reflexorNode = createReflexorNode({ moorex });
 *
 * // 注册到 Fastify 应用
 * await fastify.register(reflexorNode.register, { prefix: '/api/reflexor' });
 * ```
 */
export const createReflexorNode = (
  options: CreateReflexorNodeOptions
): MoorexNode<ReflexorInput, ReflexorEffect, ReflexorState> => {
  const { moorex } = options;
  const generateTimestamp = createTimestampGenerator();

  const handlePost: HandlePost<ReflexorInput> = async (input, dispatch) => {
    try {
      const parsed = JSON.parse(input) as unknown;

      // 验证输入格式
      const result = reflexorInputSchema.safeParse(parsed);
      if (!result.success) {
        return {
          code: 400,
          content: JSON.stringify({
            error: "Invalid input",
            details: result.error.issues,
          }),
        };
      }

      // 覆盖时间戳，使用服务端时间戳
      const serverTimestamp = generateTimestamp();
      const inputWithServerTimestamp: ReflexorInput = {
        ...result.data,
        timestamp: serverTimestamp,
      };

      // 分发输入
      dispatch([inputWithServerTimestamp]);

      return {
        code: 200,
        content: JSON.stringify({
          success: true,
          timestamp: serverTimestamp,
        }),
      };
    } catch (error) {
      return {
        code: 400,
        content: JSON.stringify({
          error: "Invalid JSON",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      };
    }
  };

  return createMoorexNode({
    moorex,
    handlePost,
  });
};

