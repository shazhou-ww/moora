/**
 * LLM Reaction 回调工厂
 *
 * 创建用于调用 LLM 的回调函数
 */

import type { CallLlm, CallLlmContext, CallLlmCallbacks } from "@moora/agent-common";
import { createCallLlmWithOpenAI } from "@moora/llm-openai";
import { getLogger } from "@/logger";
import type { CreateServiceOptions } from "@/types";

const logger = getLogger();

/**
 * 创建 callLlm 回调的选项
 */
export type CreateCallLlmCallbackOptions = {
  /**
   * OpenAI 配置
   */
  openai: CreateServiceOptions["openai"];
  /**
   * System prompt
   */
  prompt: string;
};

/**
 * 创建 callLlm 回调
 *
 * 使用 @moora/llm-openai 适配器创建 CallLlm 函数，并添加性能日志
 *
 * @param options - 配置选项
 * @returns CallLlm 回调函数
 */
export function createCallLlmCallback(options: CreateCallLlmCallbackOptions): CallLlm {
  const { openai, prompt } = options;

  const baseCallLlm = createCallLlmWithOpenAI({
    baseURL: openai.endpoint.url,
    apiKey: openai.endpoint.key,
    model: openai.model,
    systemPrompt: prompt,
  });

  // 包装 callLlm 函数，添加性能日志
  const wrappedCallLlm: CallLlm = async (
    context: CallLlmContext,
    callbacks: CallLlmCallbacks
  ): Promise<void> => {
    const callStartTime = Date.now();
    const latestUserMessageTime = Math.max(
      0,
      ...context.messages
        .filter((m) => m.role === "user")
        .map((m) => m.timestamp)
    );

    // 计算从用户消息发送到 LLM 调用开始的时间差
    const timeSinceUserMessage = latestUserMessageTime > 0
      ? callStartTime - latestUserMessageTime
      : 0;

    logger.llm.info("[LLM] Starting LLM call", {
      messageCount: context.messages.length,
      toolCount: context.tools.length,
      latestUserMessageTime: latestUserMessageTime > 0 ? latestUserMessageTime : null,
      callStartTime,
      timeSinceUserMessage: timeSinceUserMessage > 0 ? `${timeSinceUserMessage}ms` : null,
      model: openai.model,
    });

    let apiCallStartTime: number | null = null;
    let firstChunkTime: number | null = null;
    let onStartCalled = false;

    // 包装 callbacks，记录响应开始时间
    const wrappedCallbacks: CallLlmCallbacks = {
      onStart: () => {
        if (!onStartCalled) {
          onStartCalled = true;
          firstChunkTime = Date.now();
          const timeToFirstChunk = firstChunkTime - callStartTime;
          const totalTimeSinceUserMessage = latestUserMessageTime > 0
            ? firstChunkTime - latestUserMessageTime
            : null;

          logger.llm.info("[LLM] First chunk received", {
            callStartTime,
            firstChunkTime,
            timeToFirstChunk: `${timeToFirstChunk}ms`,
            totalTimeSinceUserMessage: totalTimeSinceUserMessage
              ? `${totalTimeSinceUserMessage}ms`
              : null,
          });
        }
        return callbacks.onStart();
      },
      onChunk: callbacks.onChunk,
      onComplete: (content: string) => {
        const completeTime = Date.now();
        const totalCallDuration = completeTime - callStartTime;
        const streamingDuration = firstChunkTime
          ? completeTime - firstChunkTime
          : null;

        logger.llm.info("[LLM] LLM call completed", {
          contentLength: content.length,
          totalCallDuration: `${totalCallDuration}ms`,
          streamingDuration: streamingDuration ? `${streamingDuration}ms` : null,
          timeToFirstChunk: firstChunkTime
            ? `${firstChunkTime - callStartTime}ms`
            : null,
        });

        callbacks.onComplete(content);
      },
      onToolCall: callbacks.onToolCall,
    };

    try {
      await baseCallLlm(context, wrappedCallbacks);
    } catch (error) {
      const errorTime = Date.now();
      const errorDuration = errorTime - callStartTime;

      logger.llm.error("[LLM] LLM call failed", {
        error: error instanceof Error ? error.message : String(error),
        duration: `${errorDuration}ms`,
        timeSinceUserMessage: latestUserMessageTime > 0
          ? `${errorTime - latestUserMessageTime}ms`
          : null,
      });

      throw error;
    }
  };

  return wrappedCallLlm;
}
