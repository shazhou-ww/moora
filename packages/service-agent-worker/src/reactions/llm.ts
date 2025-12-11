/**
 * LLM Reaction 回调工厂
 *
 * 创建用于调用 LLM 的回调函数
 */

import type { CallLlm } from "@moora/agent-common";
import { createCallLlmWithOpenAI } from "@moora/llm-openai";
import type { CreateServiceOptions } from "@/types";

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
 * 使用 @moora/llm-openai 适配器创建 CallLlm 函数
 *
 * @param options - 配置选项
 * @returns CallLlm 回调函数
 */
export function createCallLlmCallback(options: CreateCallLlmCallbackOptions): CallLlm {
  const { openai, prompt } = options;

  return createCallLlmWithOpenAI({
    baseURL: openai.endpoint.url,
    apiKey: openai.endpoint.key,
    model: openai.model,
    systemPrompt: prompt,
  });
}
