/**
 * POST /send handler
 *
 * 处理用户发送消息的请求
 */

import { v4 as uuidv4 } from "uuid";

import type { createAgent } from "@moora/agent-coordinator";
import type { ActionFromUser } from "@moora/agent-coordinator";
import { getLogger } from "@/logger";

const logger = getLogger();

/**
 * 创建 POST /send handler
 *
 * @param agent - Agent 实例
 * @returns POST handler 函数
 */
export function createPostSendHandler(agent: ReturnType<typeof createAgent>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ body, set }: any) => {
    logger.server.debug("[POST /send] Received request", { body });

    const { content } = body as { content: string };

    if (!content || typeof content !== "string") {
      logger.server.warn("[POST /send] Invalid request body", { content });
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

    logger.server.info("[POST /send] Dispatching action", {
      id,
      contentLength: content.length,
      timestamp,
      time: new Date(timestamp).toISOString(),
    });
    agent.dispatch(action);
    logger.server.debug("[POST /send] Action dispatched successfully");

    set.headers = {
      "Content-Type": "application/json",
    };
    return {
      id,
      timestamp,
    };
  };
}
