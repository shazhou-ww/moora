/**
 * OpenAI Streaming API 调用逻辑
 *
 * 将 Agent 消息转换为 OpenAI 格式，并调用 OpenAI Streaming API
 */

import type { UserMessage, AssiMessage } from "@moora/agent";
import type {
  OpenAIMessage,
  StreamLlmCallOptions,
} from "@/types";

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 将 Agent 消息转换为 OpenAI 消息格式
 *
 * @param prompt - System prompt
 * @param userMessages - 用户消息列表
 * @param assiMessages - 助手消息列表
 * @returns OpenAI 消息列表
 */
function convertToOpenAIMessages(
  prompt: string,
  userMessages: UserMessage[],
  assiMessages: AssiMessage[]
): OpenAIMessage[] {
  // 将用户消息转换为 OpenAI 消息格式
  const userOpenAIMessages = userMessages.map((msg) => ({
    role: "user" as const,
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  // 将已完成的助手消息转换为 OpenAI 消息格式
  const assiOpenAIMessages = assiMessages
    .filter((msg) => msg.streaming === false)
    .map((msg) => ({
      role: "assistant" as const,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

  // 合并所有消息并按 timestamp 排序
  const allMessages = [...userOpenAIMessages, ...assiOpenAIMessages].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // 构建最终消息列表（移除 timestamp）
  return [
    { role: "system" as const, content: prompt },
    ...allMessages.map(({ role, content }) => ({ role, content })),
  ];
}

// ============================================================================
// 主要函数
// ============================================================================

/**
 * 执行 Streaming LLM Call
 *
 * 将 Agent 消息转换为 OpenAI 格式，调用 OpenAI Streaming API 并处理流式响应
 *
 * @param options - Streaming LLM Call 选项
 * @returns 完整的响应内容
 *
 * @example
 * ```typescript
 * const fullContent = await streamLlmCall({
 *   openai: new OpenAI({ apiKey: "..." }),
 *   model: "gpt-4",
 *   prompt: "You are a helpful assistant.",
 *   userMessages: [{ id: "1", role: "user", content: "Hello", timestamp: 1000 }],
 *   assiMessages: [],
 *   streamManager,
 *   messageId: "msg-123",
 * });
 * ```
 */
export async function streamLlmCall(
  options: StreamLlmCallOptions
): Promise<string> {
  const {
    openai,
    model,
    prompt,
    userMessages,
    assiMessages,
    streamManager,
    messageId,
    onFirstChunk,
  } = options;

  // 将 Agent 消息转换为 OpenAI 消息格式
  const messages = convertToOpenAIMessages(prompt, userMessages, assiMessages);

  // 调用 OpenAI Streaming API
  const stream = await openai.chat.completions.create({
    model,
    messages,
    stream: true,
  });

  let fullContent = "";
  let isFirstChunk = true;

  // 处理流式响应
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;

    if (content) {
      // 如果是第一个 chunk，调用回调
      if (isFirstChunk && onFirstChunk) {
        isFirstChunk = false;
        onFirstChunk();
      }

      fullContent += content;
      // 通过 StreamManager 分发 chunk
      streamManager.appendChunk(messageId, content);
    }
  }

  return fullContent;
}

