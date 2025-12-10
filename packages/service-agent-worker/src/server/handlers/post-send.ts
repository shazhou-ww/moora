/**
 * POST /send handler
 *
 * 处理用户发送消息的请求
 */

import { v4 as uuidv4 } from "uuid";
import { createAgent } from "@moora/agent-worker";
import type { ActionFromUser } from "@moora/agent-worker";

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

    const action: ActionFromUser = {
      type: "send-user-message",
      id,
      content,
      timestamp,
    };

    agent.dispatch(action);

    set.headers = {
      "Content-Type": "application/json",
    };
    return {
      id,
      timestamp,
    };
  };
}
