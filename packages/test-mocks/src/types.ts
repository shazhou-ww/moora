/**
 * Test Mocks 类型定义
 *
 * 定义 MockGen 和相关的类型
 */

import type { CallLlm, CallLlmContext, CallLlmCallbacks } from "@moora/agent-common";

// ============================================================================
// Range 类型
// ============================================================================

/**
 * 长度范围
 */
export type LengthRange = {
  min: number;
  max: number;
};

/**
 * 数值范围
 */
export type NumberRange = {
  min: number;
  max: number;
};

// ============================================================================
// MockGen 类型
// ============================================================================

/**
 * MockGen 配置
 */
export type MockGenConfig = {
  seed: number;
};

/**
 * 随机数据生成器
 *
 * 提供各种随机数据生成方法，支持可选的范围参数
 */
export type MockGen = {
  /**
   * 生成随机单词
   * @param range - 可选的长度范围（字符数）
   */
  readonly word: (range?: LengthRange) => string;

  /**
   * 生成随机句子
   * @param range - 可选的长度范围（单词数）
   */
  readonly sentence: (range?: LengthRange) => string;

  /**
   * 生成随机段落
   * @param range - 可选的长度范围（句子数）
   */
  readonly paragraph: (range?: LengthRange) => string;

  /**
   * 生成随机 Markdown 文本
   * @param range - 可选的长度范围（段落数）
   */
  readonly markdown: (range?: LengthRange) => string;

  /**
   * 生成随机邮箱地址
   */
  readonly email: () => string;

  /**
   * 生成随机 UUID
   */
  readonly uuid: () => string;

  /**
   * 生成随机浮点数
   * @param range - 可选的数值范围
   */
  readonly number: (range?: NumberRange) => number;

  /**
   * 生成随机整数
   * @param range - 可选的数值范围
   */
  readonly integer: (range?: NumberRange) => number;

  /**
   * 生成随机布尔值
   */
  readonly bool: () => boolean;

  /**
   * 从数组中随机选择一个元素
   * @param array - 要选择的数组
   */
  readonly pick: <T>(array: readonly T[]) => T;

  /**
   * 获取当前 seed
   */
  readonly getSeed: () => number;
};

// ============================================================================
// Mock CallLlm 类型
// ============================================================================

/**
 * Mock CallLlm 调用记录
 */
export type MockCallLlmRecord = {
  context: CallLlmContext;
  response: string;
  timestamp: number;
};

/**
 * Mock CallLlm 回调
 *
 * 用于在每次调用时接收参数和输出
 */
export type MockCallLlmCallback = (record: MockCallLlmRecord) => void;

/**
 * Mock CallLlm 配置
 */
export type MockCallLlmConfig = {
  /** 回调函数，每次调用时触发 */
  onCall: MockCallLlmCallback;
  /** 响应延迟（毫秒） */
  delay: number;
  /** 是否模拟流式输出 */
  streaming: boolean;
  /** 流式输出的 chunk 大小（字符数） */
  chunkSize: number;
};

/**
 * Mock CallLlm 实例
 */
export type MockCallLlm = {
  /** CallLlm 函数 */
  readonly callLlm: CallLlm;
  /** 获取所有调用记录 */
  readonly getRecords: () => readonly MockCallLlmRecord[];
  /** 清空调用记录 */
  readonly clearRecords: () => void;
};
