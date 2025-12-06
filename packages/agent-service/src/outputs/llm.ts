/**
 * LLM Output 函数实现
 *
 * 调用 OpenAI Streaming API，通过 StreamManager 分发 chunk，
 * 并通过 InputFromLlm 通知 Agent State 流式开始和结束
 */

import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type {
  ContextOfLlm,
  InputFromLlm,
  AgentInput,
  Output,
} from "@moora/agent";
import type { Dispatch } from "@moora/automata";
import type { StreamManager } from "@/streams";

/**
 * 创建 LLM Output 函数的选项
 */
export type CreateLlmOutputOptions = {
  /**
   * OpenAI 客户端配置
   */
  openai: {
    /**
     * API endpoint URL
     */
    endpoint: {
      url: string;
      key: string;
    };
    /**
     * 模型名称
     */
    model: string;
  };

  /**
   * System prompt
   */
  prompt: string;

  /**
   * StreamManager 实例
   */
  streamManager: StreamManager;
};

/**
 * 创建 LLM Output 函数
 *
 * 当 ContextOfLlm 发生变化时，调用 OpenAI Streaming API 生成回复
 *
 * @param options - 创建选项
 * @returns LLM Output 函数
 */
export function createLlmOutput(
  options: CreateLlmOutputOptions
): (context: ContextOfLlm) => Output<AgentInput> {
  const { openai: openaiConfig, prompt, streamManager } = options;

  // 创建 OpenAI 客户端
  const openai = new OpenAI({
    apiKey: openaiConfig.endpoint.key,
    baseURL: openaiConfig.endpoint.url,
  });

  return (context: ContextOfLlm) => {
    return () => async (dispatch: Dispatch<AgentInput>) => {
      // 检查是否有新的用户消息需要回复
      const { userMessages, assiMessages } = context;

      // 计算已完成的助手消息数量（不包括流式中的消息）
      const completedAssiMessagesCount = assiMessages.filter(
        (msg) => msg.streaming === false
      ).length;

      // 如果用户消息数量大于已完成的助手消息数量，说明有新消息需要回复
      // 并且没有正在流式的消息
      const hasStreamingMessage = assiMessages.some(
        (msg) => msg.streaming === true
      );

      if (
        userMessages.length > completedAssiMessagesCount &&
        !hasStreamingMessage
      ) {
        // 生成消息 ID
        const messageId = uuidv4();
        const timestamp = Date.now();

        // 通知 Agent State 开始流式生成
        const startInput: InputFromLlm = {
          type: "start-assi-message-stream",
          id: messageId,
          timestamp,
        };
        dispatch(startInput);

        // 在 StreamManager 中开始流式生成
        streamManager.startStream(messageId);

        try {
          // 构建消息列表
          const messages: Array<{
            role: "system" | "user" | "assistant";
            content: string;
          }> = [{ role: "system", content: prompt }];

          // 添加历史消息（交替添加用户和助手消息）
          const maxLength = Math.max(userMessages.length, assiMessages.length);
          for (let i = 0; i < maxLength; i++) {
            if (i < userMessages.length) {
              messages.push({
                role: "user",
                content: userMessages[i]?.content ?? "",
              });
            }
            if (i < assiMessages.length) {
              const assiMsg = assiMessages[i];
              // 只添加已完成的消息（有 content）
              if (assiMsg && assiMsg.streaming === false) {
                messages.push({
                  role: "assistant",
                  content: assiMsg.content,
                });
              }
            }
          }

          // 调用 OpenAI Streaming API
          const stream = await openai.chat.completions.create({
            model: openaiConfig.model,
            messages,
            stream: true,
          });

          let fullContent = "";

          // 处理流式响应
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              fullContent += content;
              // 通过 StreamManager 分发 chunk
              streamManager.appendChunk(messageId, content);
            }
          }

          // 通知 Agent State 结束流式生成
          const endInput: InputFromLlm = {
            type: "end-assi-message-stream",
            id: messageId,
            content: fullContent,
            timestamp: Date.now(),
          };
          dispatch(endInput);

          // 在 StreamManager 中结束流式生成
          streamManager.endStream(messageId, fullContent);
        } catch (error) {
          // 错误处理：直接结束 streaming
          console.error("OpenAI API error:", error);

          // 通知 Agent State 结束流式生成（使用空内容或错误消息）
          const endInput: InputFromLlm = {
            type: "end-assi-message-stream",
            id: messageId,
            content: "",
            timestamp: Date.now(),
          };
          dispatch(endInput);

          // 在 StreamManager 中结束流式生成（如果流还存在）
          // 流可能已被清理（超时），所以这里静默处理
          streamManager.endStream(messageId, "");
        }
      }
    };
  };
}

