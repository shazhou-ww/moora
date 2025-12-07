/**
 * 创建 Agent Service 服务器
 */

import { Elysia } from "elysia";
import { createAgent } from "@moora/agent";
import type { AgentUpdatePack } from "@moora/agent";
import { createPubSub } from "@moora/automata";
import { createUserOutput } from "@/outputs/user";
import { createLlmOutput } from "@/outputs/llm";
import { createToolkitOutput, createDefaultToolkit } from "@/outputs/toolkit";
import { createStreamManager } from "@/streams";
import type { Toolkit } from "@moora/toolkit";
import { getLogger } from "@/logger";
import type { CreateServiceOptions } from "@/types";
import {
  createAgentSSEHandler,
  createPostSendHandler,
  createStreamSSEHandler,
} from "./handlers";

const logger = getLogger().agent;

/**
 * 截断过长的字符串
 */
function ellipsis(str: string, maxLen = 20): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

/**
 * 格式化输入日志（只记录 input，不记录 state）
 * 对可能过长的 content 字段进行截断
 */
function formatInputLog(update: AgentUpdatePack) {
  const { prev } = update;

  if (prev === null) {
    // 初始状态，没有 input
    return { type: "initial" };
  }

  const input = prev.input;

  // 根据 input 类型，对可能过长的字段进行截断
  switch (input.type) {
    case "send-user-message":
      return { ...input, content: ellipsis(input.content) };
    case "end-assi-message-stream":
      return { ...input, content: ellipsis(input.content) };
    case "request-tool-call":
      return { ...input, arguments: ellipsis(input.arguments) };
    case "receive-tool-result":
      return { ...input, result: ellipsis(input.result) };
    default:
      return input;
  }
}

/**
 * 创建 Agent Service
 *
 * @param options - 服务选项
 * @returns Elysia 应用实例
 *
 * @example
 * ```typescript
 * import { createService } from '@moora/agent-service';
 *
 * const app = createService({
 *   openai: {
 *     endpoint: {
 *       url: 'https://api.openai.com/v1',
 *       key: process.env.OPENAI_API_KEY!,
 *     },
 *     model: 'gpt-4',
 *   },
 *   prompt: 'You are a helpful assistant.',
 * });
 *
 * app.listen(3000);
 * ```
 */
export function createService(options: CreateServiceOptions) {
  const { openai, prompt, toolkit: providedToolkit, tavilyApiKey } = options;

  // 使用提供的 toolkit 或创建默认 toolkit（包含 Tavily 等内置工具）
  const toolkit: Toolkit = providedToolkit ?? createDefaultToolkit({ tavilyApiKey });

  // 创建 Patch PubSub（用于 /agent 路由的 SSE 推送）
  const patchPubSub = createPubSub<string>();

  // 创建 StreamManager 实例
  const streamManager = createStreamManager();

  // 创建 agent 实例
  const agent = createAgent({
    user: createUserOutput({
      publishPatch: patchPubSub.pub,
    }),
    llm: createLlmOutput({
      openai,
      prompt,
      streamManager,
      toolkit,
    }),
    toolkit: createToolkitOutput({
      toolkit,
    }),
  });

  // 订阅 agent 状态变化，记录日志
  // 副作用已在 createAgent 内部自动执行，这里只需处理日志
  agent.subscribe((update) => {
    logger.debug("Agent input", formatInputLog(update));
  });

  const app = new Elysia()
    .get("/agent", createAgentSSEHandler(agent, patchPubSub.sub))
    .post("/send", createPostSendHandler(agent))
    .get("/streams/:messageId", createStreamSSEHandler(streamManager));

  return app;
}
