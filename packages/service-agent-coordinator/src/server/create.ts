/**
 * 创建 Coordinator Agent Service 服务器
 */

import { Elysia } from "elysia";

import type { Actuation, ReactionFns } from "@moora/agent-coordinator";
import { createAgent, createReaction, USER, LLM, TOOLKIT, WORKFORCE } from "@moora/agent-coordinator";
import { createPubSub } from "@moora/pub-sub";
import type { Toolkit } from "@moora/toolkit";
import { getLogger } from "@/logger";
import {
  createNotifyUserCallback,
  createCallLlmCallback,
  createCallToolCallback,
  createDefaultToolkit,
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

  // 创建 Patch PubSub（用于 /agent 路由的 SSE 推送）
  const patchPubSub = createPubSub<string>();

  // 创建 StreamManager 实例
  const streamManager = createStreamManager();

  // TODO: 创建各个 Actor 的 ReactionFn
  // 注意：agent-coordinator 的 reaction 结构与 agent-worker 不同
  // 需要为每个 Actor 提供 ReactionFnOf<Actor> 函数
  
  const reactions: ReactionFns = {
    [USER]: async () => {
      // User Actor 本身不需要主动做任何事
      // 所有对用户的通知都在 transition 中处理
    },
    [LLM]: async () => {
      // LLM Reaction - 调用 LLM，处理用户消息
      // TODO: 实现 LLM reaction 逻辑
    },
    [TOOLKIT]: async () => {
      // Toolkit Reaction - 执行工具调用
      // TODO: 实现 Toolkit reaction 逻辑
    },
    [WORKFORCE]: async () => {
      // Workforce Reaction - 处理任务管理
      // TODO: 实现 Workforce reaction 逻辑
    },
  };

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
