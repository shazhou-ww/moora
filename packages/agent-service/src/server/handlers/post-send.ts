/**
 * POST /send handler
 *
 * 处理用户发送消息的请求
 */

import { v4 as uuidv4 } from "uuid";
import { createAgent } from "@moora/agent";
import type { InputFromUser } from "@moora/agent";

/**
 * 创建 POST /send handler
 *
 * @param agent - Agent 实例
 * @returns POST handler 函数
 */
export function createPostSendHandler(agent: ReturnType<typeof createAgent>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ body, set }: any) => {
    const { content } = body as { content: string };

    if (!content || typeof content !== "string") {
      set.status = 400;
      set.headers = {
        "Content-Type": "application/json",
      };
      return {
        error: "Invalid request body. Expected { content: string }",
      };
    }

    const id = uuidv4();
    const timestamp = Date.now();

    const input: InputFromUser = {
      type: "send-user-message",
      id,
      content,
      timestamp,
    };

    console.log("[createPostSendHandler] Dispatching input:", { id, content, timestamp });
    agent.dispatch(input);
    console.log("[createPostSendHandler] Input dispatched");

    set.headers = {
      "Content-Type": "application/json",
    };
    return {
      id,
      timestamp,
    };
  };
}
