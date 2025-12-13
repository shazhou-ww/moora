/**
 * @moora/test-mocks
 *
 * Mock 工具集，用于测试时生成随机数据和 Mock LLM 调用
 */

// ============================================================================
// 导出类型
// ============================================================================

export type {
  LengthRange,
  NumberRange,
  MockGenConfig,
  MockGen,
  MockCallLlmRecord,
  MockCallLlmCallback,
  MockCallLlmConfig,
  MockCallLlm,
} from "./types";

// ============================================================================
// 导出函数
// ============================================================================

export { createMockGen } from "./mock-gen";
export { createMockCallLlm, createSimpleMockCallLlm } from "./mock-call-llm";
