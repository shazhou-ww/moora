import { describe, test, expect } from "vitest";
import { createMockGen } from "../src/mock-gen";

describe("createMockGen", () => {
  describe("seed 可重复性", () => {
    test("相同 seed 生成相同的序列", () => {
      const gen1 = createMockGen({ seed: 12345 });
      const gen2 = createMockGen({ seed: 12345 });

      expect(gen1.word()).toBe(gen2.word());
      expect(gen1.integer()).toBe(gen2.integer());
      expect(gen1.bool()).toBe(gen2.bool());
    });

    test("不同 seed 生成不同的序列", () => {
      const gen1 = createMockGen({ seed: 12345 });
      const gen2 = createMockGen({ seed: 54321 });

      // 很大概率不同（理论上有可能相同，但概率极低）
      const word1 = gen1.word();
      const word2 = gen2.word();
      expect(word1).not.toBe(word2);
    });

    test("getSeed 返回当前 seed", () => {
      const gen = createMockGen({ seed: 42 });
      expect(gen.getSeed()).toBe(42);
    });
  });

  describe("word", () => {
    test("生成指定长度范围的单词", () => {
      const gen = createMockGen({ seed: 100 });
      const word = gen.word({ min: 5, max: 5 });
      expect(word.length).toBe(5);
    });

    test("默认长度在 3-10 之间", () => {
      const gen = createMockGen({ seed: 100 });
      for (let i = 0; i < 20; i++) {
        const word = gen.word();
        expect(word.length).toBeGreaterThanOrEqual(3);
        expect(word.length).toBeLessThanOrEqual(10);
      }
    });

    test("只包含小写字母", () => {
      const gen = createMockGen({ seed: 100 });
      const word = gen.word({ min: 20, max: 20 });
      expect(word).toMatch(/^[a-z]+$/);
    });
  });

  describe("sentence", () => {
    test("生成以大写字母开头、句号结尾的句子", () => {
      const gen = createMockGen({ seed: 100 });
      const sentence = gen.sentence();
      expect(sentence).toMatch(/^[A-Z]/);
      expect(sentence).toMatch(/\.$/);
    });

    test("生成指定单词数的句子", () => {
      const gen = createMockGen({ seed: 100 });
      const sentence = gen.sentence({ min: 3, max: 3 });
      const words = sentence.slice(0, -1).split(" ");
      expect(words.length).toBe(3);
    });
  });

  describe("paragraph", () => {
    test("生成包含多个句子的段落", () => {
      const gen = createMockGen({ seed: 100 });
      const para = gen.paragraph({ min: 3, max: 3 });
      // 计算句子数量（通过 . 号分割）
      const sentences = para.split(". ").filter((s) => s.length > 0);
      expect(sentences.length).toBe(3);
    });
  });

  describe("markdown", () => {
    test("生成包含标题和内容的 Markdown", () => {
      const gen = createMockGen({ seed: 100 });
      const md = gen.markdown({ min: 2, max: 2 });
      // 检查是否包含 Markdown 标题
      expect(md).toMatch(/^#+ /m);
    });
  });

  describe("email", () => {
    test("生成有效格式的邮箱", () => {
      const gen = createMockGen({ seed: 100 });
      const email = gen.email();
      expect(email).toMatch(/^[a-z]+@[a-z]+\.[a-z]+$/);
    });
  });

  describe("uuid", () => {
    test("生成有效格式的 UUID", () => {
      const gen = createMockGen({ seed: 100 });
      const uuid = gen.uuid();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe("number", () => {
    test("生成指定范围内的浮点数", () => {
      const gen = createMockGen({ seed: 100 });
      for (let i = 0; i < 20; i++) {
        const num = gen.number({ min: 10, max: 20 });
        expect(num).toBeGreaterThanOrEqual(10);
        expect(num).toBeLessThanOrEqual(20);
      }
    });

    test("默认范围是 0-100", () => {
      const gen = createMockGen({ seed: 100 });
      for (let i = 0; i < 20; i++) {
        const num = gen.number();
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("integer", () => {
    test("生成整数", () => {
      const gen = createMockGen({ seed: 100 });
      for (let i = 0; i < 20; i++) {
        const num = gen.integer();
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    test("生成指定范围内的整数", () => {
      const gen = createMockGen({ seed: 100 });
      for (let i = 0; i < 20; i++) {
        const num = gen.integer({ min: 5, max: 10 });
        expect(num).toBeGreaterThanOrEqual(5);
        expect(num).toBeLessThanOrEqual(10);
      }
    });
  });

  describe("bool", () => {
    test("生成布尔值", () => {
      const gen = createMockGen({ seed: 100 });
      const results = new Set<boolean>();
      for (let i = 0; i < 100; i++) {
        results.add(gen.bool());
      }
      // 100 次应该能同时产生 true 和 false
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });
  });

  describe("pick", () => {
    test("从数组中选择元素", () => {
      const gen = createMockGen({ seed: 100 });
      const array = ["a", "b", "c", "d"];
      const picked = gen.pick(array);
      expect(array).toContain(picked);
    });

    test("多次选择应覆盖多个元素", () => {
      const gen = createMockGen({ seed: 100 });
      const array = ["a", "b", "c", "d"];
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(gen.pick(array));
      }
      // 100 次应该能覆盖所有元素
      expect(results.size).toBe(4);
    });
  });
});

