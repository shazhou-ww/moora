/**
 * Mock CallLlm 实现
 *
 * 提供可配置的 Mock LLM 调用函数
 */

import type { CallLlm, CallLlmContext, CallLlmCallbacks } from "@moora/agent-common";
import type {
  MockGen,
  MockCallLlm,
  MockCallLlmConfig,
  MockCallLlmRecord,
  MockCallLlmCallback,
} from "./types";

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 延迟函数
 *
 * @internal
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 将字符串分割成 chunks
 *
 * @internal
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: MockCallLlmConfig = {
  onCall: () => {},
  delay: 10,
  streaming: true,
  chunkSize: 5,
};

// ============================================================================
// createMockCallLlm 工厂函数
// ============================================================================

/**
 * 创建 Mock CallLlm 实例
 *
 * 基于 MockGen 创建一个可配置的 Mock LLM 调用函数。
 *
 * @param mockGen - MockGen 实例，用于生成随机响应
 * @param config - 可选配置
 * @returns MockCallLlm 实例
 *
 * @example
 * ```typescript
 * const gen = createMockGen({ seed: 12345 });
 * const mockLlm = createMockCallLlm(gen, {
 *   onCall: (record) => {
 *     console.log("Called with:", record.context);
 *     console.log("Response:", record.response);
 *   },
 *   delay: 50,
 *   streaming: true,
 * });
 *
 * // 使用 mock LLM
 * await mockLlm.callLlm(context, callbacks);
 *
 * // 查看调用记录
 * const records = mockLlm.getRecords();
 * ```
 */
export function createMockCallLlm(
  mockGen: MockGen,
  config?: Partial<MockCallLlmConfig>
): MockCallLlm {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const records: MockCallLlmRecord[] = [];

  const callLlm: CallLlm = async (
    context: CallLlmContext,
    callbacks: CallLlmCallbacks
  ): Promise<void> => {
    // 生成随机响应内容
    const response = generateResponse(mockGen);

    // 记录调用
    const record: MockCallLlmRecord = {
      context,
      response,
      timestamp: Date.now(),
    };
    records.push(record);

    // 触发回调
    finalConfig.onCall(record);

    // 模拟响应
    if (finalConfig.streaming) {
      await streamResponse(response, callbacks, finalConfig);
    } else {
      await nonStreamResponse(response, callbacks, finalConfig);
    }
  };

  const getRecords = (): readonly MockCallLlmRecord[] => {
    return records;
  };

  const clearRecords = (): void => {
    records.length = 0;
  };

  return {
    callLlm,
    getRecords,
    clearRecords,
  };
}

// ============================================================================
// 响应生成
// ============================================================================

/**
 * 生成随机响应
 *
 * @internal
 */
function generateResponse(mockGen: MockGen): string {
  // 随机选择响应类型
  const responseTypes = ["sentence", "paragraph", "markdown"] as const;
  const type = mockGen.pick(responseTypes);

  switch (type) {
    case "sentence":
      return mockGen.sentence({ min: 5, max: 15 });
    case "paragraph":
      return mockGen.paragraph({ min: 2, max: 4 });
    case "markdown":
      return mockGen.markdown({ min: 1, max: 2 });
  }
}

/**
 * 流式输出响应
 *
 * @internal
 */
async function streamResponse(
  response: string,
  callbacks: CallLlmCallbacks,
  config: MockCallLlmConfig
): Promise<void> {
  const chunks = splitIntoChunks(response, config.chunkSize);

  // 开始流式输出
  callbacks.onStart();

  // 逐个输出 chunk
  for (const chunk of chunks) {
    await sleep(config.delay);
    callbacks.onChunk(chunk);
  }

  // 完成
  callbacks.onComplete(response);
}

/**
 * 非流式输出响应
 *
 * @internal
 */
async function nonStreamResponse(
  response: string,
  callbacks: CallLlmCallbacks,
  config: MockCallLlmConfig
): Promise<void> {
  await sleep(config.delay);

  callbacks.onStart();
  callbacks.onChunk(response);
  callbacks.onComplete(response);
}

// ============================================================================
// 便捷工厂函数
// ============================================================================

/**
 * 创建简单的 Mock CallLlm
 *
 * 便捷方法，只需要传入 onCall 回调。
 *
 * @param mockGen - MockGen 实例
 * @param onCall - 调用回调
 * @returns MockCallLlm 实例
 *
 * @example
 * ```typescript
 * const gen = createMockGen({ seed: 12345 });
 * const mockLlm = createSimpleMockCallLlm(gen, (record) => {
 *   console.log("Called:", record);
 * });
 * ```
 */
export function createSimpleMockCallLlm(
  mockGen: MockGen,
  onCall: MockCallLlmCallback
): MockCallLlm {
  return createMockCallLlm(mockGen, { onCall });
}

