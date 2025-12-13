# @moora/test-mocks

用于测试的 Mock 工具集，提供可重复的随机数据生成和 Mock LLM 调用功能。

## 安装

```bash
bun add @moora/test-mocks
```

## 功能特性

- **可重复的随机数据生成**：通过 seed 控制随机序列，确保测试可重复
- **丰富的数据类型**：支持字符串、数字、布尔值等多种类型
- **Mock LLM 调用**：模拟 LLM 调用，支持流式输出和调用记录

## 使用方法

### MockGen - 随机数据生成器

```typescript
import { createMockGen } from "@moora/test-mocks";

// 创建随机数据生成器（可选指定 seed）
const gen = createMockGen({ seed: 12345 });

// 字符串类
const word = gen.word(); // 随机单词
const word2 = gen.word({ min: 5, max: 10 }); // 指定长度范围
const sentence = gen.sentence(); // 随机句子
const paragraph = gen.paragraph(); // 随机段落
const markdown = gen.markdown(); // 随机 Markdown 文本
const email = gen.email(); // 随机邮箱
const uuid = gen.uuid(); // 随机 UUID

// 数字类
const num = gen.number(); // 随机浮点数 (0-100)
const num2 = gen.number({ min: 10, max: 20 }); // 指定范围
const int = gen.integer(); // 随机整数 (0-100)
const int2 = gen.integer({ min: 1, max: 10 }); // 指定范围

// 布尔值
const bool = gen.bool(); // 随机布尔值

// 从数组中选择
const picked = gen.pick(["a", "b", "c"]); // 随机选择一个元素
```

### MockCallLlm - Mock LLM 调用

```typescript
import { createMockGen, createMockCallLlm } from "@moora/test-mocks";

const gen = createMockGen({ seed: 12345 });

// 创建 Mock LLM
const mockLlm = createMockCallLlm(gen, {
  onCall: (record) => {
    console.log("Called with:", record.context);
    console.log("Response:", record.response);
  },
  delay: 50, // 响应延迟（毫秒）
  streaming: true, // 是否模拟流式输出
  chunkSize: 5, // 流式输出的 chunk 大小
});

// 使用 mock LLM
await mockLlm.callLlm(context, callbacks);

// 查看调用记录
const records = mockLlm.getRecords();

// 清空记录
mockLlm.clearRecords();
```

### 便捷方法

```typescript
import { createMockGen, createSimpleMockCallLlm } from "@moora/test-mocks";

const gen = createMockGen({ seed: 12345 });

// 只需要传入 onCall 回调
const mockLlm = createSimpleMockCallLlm(gen, (record) => {
  console.log("Called:", record);
});
```

## API 参考

### createMockGen(config?)

创建 MockGen 实例。

**参数：**
- `config.seed?: number` - 随机种子，默认使用当前时间戳

**返回：** `MockGen` 实例

### MockGen

随机数据生成器接口。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `word(range?)` | `{ min, max }` | `string` | 生成随机单词 |
| `sentence(range?)` | `{ min, max }` | `string` | 生成随机句子 |
| `paragraph(range?)` | `{ min, max }` | `string` | 生成随机段落 |
| `markdown(range?)` | `{ min, max }` | `string` | 生成随机 Markdown |
| `email()` | - | `string` | 生成随机邮箱 |
| `uuid()` | - | `string` | 生成随机 UUID |
| `number(range?)` | `{ min, max }` | `number` | 生成随机浮点数 |
| `integer(range?)` | `{ min, max }` | `number` | 生成随机整数 |
| `bool()` | - | `boolean` | 生成随机布尔值 |
| `pick(array)` | `T[]` | `T` | 从数组中随机选择 |
| `getSeed()` | - | `number` | 获取当前 seed |

### createMockCallLlm(mockGen, config?)

创建 Mock CallLlm 实例。

**参数：**
- `mockGen: MockGen` - MockGen 实例
- `config.onCall?: (record) => void` - 每次调用时的回调
- `config.delay?: number` - 响应延迟（毫秒），默认 10
- `config.streaming?: boolean` - 是否流式输出，默认 true
- `config.chunkSize?: number` - chunk 大小，默认 5

**返回：** `MockCallLlm` 实例

### MockCallLlm

Mock LLM 调用接口。

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `callLlm` | `CallLlm` | LLM 调用函数 |
| `getRecords()` | `() => MockCallLlmRecord[]` | 获取调用记录 |
| `clearRecords()` | `() => void` | 清空调用记录 |

## License

MIT
