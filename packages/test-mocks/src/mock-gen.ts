/**
 * MockGen 实现
 *
 * 提供可重复的随机数据生成器
 */

import type { MockGen, MockGenConfig, LengthRange, NumberRange } from "./types";

// ============================================================================
// 常量定义
// ============================================================================

/** 常用单词表 */
const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
  "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
  "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
  "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in",
  "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat", "nulla",
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
  "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
  "est", "laborum", "hello", "world", "test", "data", "mock", "random",
  "generate", "create", "build", "make", "code", "function", "type", "value",
];

/** 域名后缀 */
const DOMAINS = ["example.com", "test.org", "mock.io", "demo.net", "sample.dev"];

/** Markdown 标题模板 */
const MARKDOWN_HEADERS = ["# ", "## ", "### "];

/** 默认配置 */
const DEFAULT_WORD_RANGE: LengthRange = { min: 3, max: 10 };
const DEFAULT_SENTENCE_RANGE: LengthRange = { min: 5, max: 15 };
const DEFAULT_PARAGRAPH_RANGE: LengthRange = { min: 3, max: 7 };
const DEFAULT_MARKDOWN_RANGE: LengthRange = { min: 2, max: 5 };
const DEFAULT_NUMBER_RANGE: NumberRange = { min: 0, max: 100 };

// ============================================================================
// PRNG 实现
// ============================================================================

/**
 * 创建 Mulberry32 伪随机数生成器
 *
 * @internal
 * @param seed - 随机种子
 * @returns 返回 0-1 之间的伪随机数的函数
 */
function createPrng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 生成范围内的随机整数
 *
 * @internal
 */
function randomInt(prng: () => number, min: number, max: number): number {
  return Math.floor(prng() * (max - min + 1)) + min;
}

/**
 * 从数组中随机选择元素
 *
 * @internal
 */
function pickRandom<T>(prng: () => number, array: readonly T[]): T {
  const index = Math.floor(prng() * array.length);
  return array[index]!;
}

/**
 * 生成随机字符
 *
 * @internal
 */
function randomChar(prng: () => number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return chars[Math.floor(prng() * chars.length)]!;
}

/**
 * 生成随机 hex 字符
 *
 * @internal
 */
function randomHex(prng: () => number, length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(prng() * chars.length)];
  }
  return result;
}

// ============================================================================
// MockGen 工厂函数
// ============================================================================

/**
 * 创建 MockGen 实例
 *
 * MockGen 是一个可重复的随机数据生成器，通过 seed 控制随机序列。
 *
 * @param config - 可选配置，包含 seed
 * @returns MockGen 实例
 *
 * @example
 * ```typescript
 * // 使用随机 seed
 * const gen = createMockGen();
 *
 * // 使用固定 seed（可重复）
 * const gen = createMockGen({ seed: 12345 });
 *
 * // 生成随机数据
 * const word = gen.word();
 * const email = gen.email();
 * const number = gen.integer({ min: 1, max: 100 });
 * ```
 */
export function createMockGen(config?: Partial<MockGenConfig>): MockGen {
  const seed = config?.seed ?? Date.now();
  const prng = createPrng(seed);

  const word = (range?: LengthRange): string => {
    const { min, max } = range ?? DEFAULT_WORD_RANGE;
    const length = randomInt(prng, min, max);
    let result = "";
    for (let i = 0; i < length; i++) {
      result += randomChar(prng);
    }
    return result;
  };

  const sentence = (range?: LengthRange): string => {
    const { min, max } = range ?? DEFAULT_SENTENCE_RANGE;
    const wordCount = randomInt(prng, min, max);
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(pickRandom(prng, WORDS));
    }
    const text = words.join(" ");
    return text.charAt(0).toUpperCase() + text.slice(1) + ".";
  };

  const paragraph = (range?: LengthRange): string => {
    const { min, max } = range ?? DEFAULT_PARAGRAPH_RANGE;
    const sentenceCount = randomInt(prng, min, max);
    const sentences: string[] = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(sentence());
    }
    return sentences.join(" ");
  };

  const markdown = (range?: LengthRange): string => {
    const { min, max } = range ?? DEFAULT_MARKDOWN_RANGE;
    const sectionCount = randomInt(prng, min, max);
    const sections: string[] = [];
    for (let i = 0; i < sectionCount; i++) {
      const header = pickRandom(prng, MARKDOWN_HEADERS);
      const title = sentence({ min: 2, max: 5 }).slice(0, -1);
      const content = paragraph();
      sections.push(`${header}${title}\n\n${content}`);
    }
    return sections.join("\n\n");
  };

  const email = (): string => {
    const username = word({ min: 5, max: 10 });
    const domain = pickRandom(prng, DOMAINS);
    return `${username}@${domain}`;
  };

  const uuid = (): string => {
    const p1 = randomHex(prng, 8);
    const p2 = randomHex(prng, 4);
    const p3 = randomHex(prng, 4);
    const p4 = randomHex(prng, 4);
    const p5 = randomHex(prng, 12);
    return `${p1}-${p2}-${p3}-${p4}-${p5}`;
  };

  const number = (range?: NumberRange): number => {
    const { min, max } = range ?? DEFAULT_NUMBER_RANGE;
    return prng() * (max - min) + min;
  };

  const integer = (range?: NumberRange): number => {
    const { min, max } = range ?? DEFAULT_NUMBER_RANGE;
    return randomInt(prng, min, max);
  };

  const bool = (): boolean => {
    return prng() >= 0.5;
  };

  const pick = <T>(array: readonly T[]): T => {
    return pickRandom(prng, array);
  };

  const getSeed = (): number => seed;

  return {
    word,
    sentence,
    paragraph,
    markdown,
    email,
    uuid,
    number,
    integer,
    bool,
    pick,
    getSeed,
  };
}

