/**
 * 创建 Agent Service 服务器
 */

import { Elysia } from "elysia";
import { createAgent } from "@moora/agent";
import { createPubSub } from "@moora/automata";
import { createUserOutput } from "@/outputs/user";
import { createLlmOutput } from "@/outputs/llm";
import { createStreamManager } from "@/streams";
import type { CreateServiceOptions } from "@/types";
import {
  createAgentSSEHandler,
  createPostSendHandler,
  createStreamSSEHandler,
} from "./handlers";

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
  const { openai, prompt } = options;

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
    }),
  });

  // 订阅 agent 状态变化，触发 output
  // output 是 () => async (dispatch) => {...} 格式，直接返回让 runEffect 处理
  agent.subscribe((output) => {
    console.log("[createService] Agent state changed, output received");
    return output;
  });

  const app = new Elysia()
    .get("/agent", createAgentSSEHandler(agent, patchPubSub.sub))
    .post("/send", createPostSendHandler(agent))
    .get("/streams/:messageId", createStreamSSEHandler(streamManager));

  return app;
}
