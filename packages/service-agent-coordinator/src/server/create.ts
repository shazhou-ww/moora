/**
 * 创建 Coordinator Agent Service 服务器
 */

import { Elysia } from "elysia";

import type { Actuation } from "@moora/agent-coordinator";
import { createAgent, createReaction } from "@moora/agent-coordinator";
import { createPubSub } from "@moora/pub-sub";
import type { Toolkit } from "@moora/toolkit";
import { createWorkforce } from "@moora/workforce";
import { getLogger } from "@/logger";
import {
  createCallLlmCallback,
  createDefaultToolkit,
  createReactions,
} from "@/reactions";
import { createStreamManager } from "@/streams";
import type { CreateServiceOptions } from "@/types";

import {
  createAgentSSEHandler,
  createPostSendHandler,
  createStreamSSEHandler,
} from "./handlers";



const logger = getLogger();

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
function formatInputLog(update: { prev: { state: any; input: Actuation } | null; state: any }) {
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
    case "call-tool":
      return { ...input, arguments: ellipsis(input.arguments) };
    case "return-tool-result":
      return { ...input, result: ellipsis(input.result) };
    default:
      return input;
  }
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 创建 Coordinator Agent Service
 *
 * @param options - 服务选项
 * @returns Elysia 应用实例
 *
 * @example
 * ```typescript
 * import { createService } from '@moora/service-agent-coordinator';
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

  // 创建 callLlm 回调
  const callLlm = createCallLlmCallback({
    openai,
    prompt,
  });

  // 创建 Workforce 实例
  const workforce = createWorkforce({
    maxAgents: 5,
    toolkit,
    callLlm,
  });

  // 创建 Patch PubSub（用于 /agent 路由的 SSE 推送）
  const patchPubSub = createPubSub<string>();

  // 创建 StreamManager 实例
  const streamManager = createStreamManager();

  // 创建所有 Actor 的 reactions
  const reactions = createReactions({
    callLlm,
    toolkit,
    workforce,
    publishPatch: patchPubSub.pub,
    onStreamStart: (messageId: string) => {
      streamManager.startStream(messageId);
    },
    onStreamChunk: (messageId: string, chunk: string) => {
      streamManager.appendChunk(messageId, chunk);
    },
    onStreamComplete: (messageId: string, content: string) => {
      streamManager.endStream(messageId, content);
    },
  });

  // 创建 agent reaction
  const reaction = createReaction(reactions);

  // 创建 agent 实例
  const agent = createAgent(reaction);

  // 订阅 agent 状态变化，记录日志
  agent.subscribe((update) => {
    logger.agent.debug("Agent input", formatInputLog(update));
  });

  const app = new Elysia()
    .get("/agent", createAgentSSEHandler(agent, patchPubSub.sub))
    .post("/send", createPostSendHandler(agent))
    .get("/streams/:messageId", createStreamSSEHandler(streamManager));

  return app;
}
