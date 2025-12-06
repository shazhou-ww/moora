/**
 * 创建 Agent Service 服务器
 */

import { Elysia, sse } from "elysia";
import { v4 as uuidv4 } from "uuid";
import { createAgent } from "@moora/agent";
import type { InputFromUser, ContextOfUser } from "@moora/agent";
import { createUserOutput } from "@/outputs/user";
import { createLlmOutput } from "@/outputs/llm";
import { StreamManager, type SSEConnection } from "@/streams";

/**
 * SSE 连接（用于 /agent 路由）
 */
type AgentSSEConnection = {
  queue: string[];
  resolve: (() => void) | null;
  closed: boolean;
};

/**
 * 创建服务的选项
 */
export type CreateServiceOptions = {
  /**
   * OpenAI 配置
   */
  openai: {
    endpoint: {
      url: string;
      key: string;
    };
    model: string;
  };

  /**
   * System prompt
   */
  prompt: string;
};

/**
 * 创建 GET /agent SSE handler
 *
 * @param agent - Agent 实例
 * @param connections - SSE 连接集合
 * @returns SSE 生成器函数
 */
function createSSEHandler(
  agent: ReturnType<typeof createAgent>,
  connections: Set<AgentSSEConnection>
) {
  return function* () {
    // 创建 SSE 连接
    const connection: AgentSSEConnection = {
      queue: [],
      resolve: null,
      closed: false,
    };

    // 添加到连接集合
    connections.add(connection);

    try {
      // 发送初始全量数据
      const state = agent.current();
      const context: ContextOfUser = {
        userMessages: state.userMessages,
        assiMessages: state.assiMessages,
      };
      const fullData = JSON.stringify({
        type: "full",
        data: context,
      });
      yield sse(fullData);

      // 保持连接打开，等待后续更新
      while (!connection.closed) {
        // 等待数据到达队列
        yield new Promise<void>((resolve) => {
          connection.resolve = resolve;
          // 如果队列中已有数据，立即 resolve
          if (connection.queue.length > 0) {
            resolve();
          }
        });

        // 发送队列中的所有数据
        while (connection.queue.length > 0 && !connection.closed) {
          const data = connection.queue.shift();
          if (data) {
            yield sse(data);
          }
        }
      }
    } catch (error) {
      // 连接异常时标记为关闭
      connection.closed = true;
      throw error;
    } finally {
      // 确保连接被标记为关闭并从集合中移除
      connection.closed = true;
      connections.delete(connection);
    }
  };
}

/**
 * 创建 POST /agent handler
 *
 * @param agent - Agent 实例
 * @returns POST handler 函数
 */
function createPostHandler(agent: ReturnType<typeof createAgent>) {
  return async ({ body }: { body: unknown }) => {
    // 解析请求体（ElysiaJS 自动解析 JSON）
    const { content } = body as { content: string };

    if (!content || typeof content !== "string") {
      return {
        error: "Invalid request body. Expected { content: string }",
      };
    }

    // 生成 message id 和 timestamp
    const id = uuidv4();
    const timestamp = Date.now();

    // 创建 InputFromUser
    const input: InputFromUser = {
      type: "send-user-message",
      id,
      content,
      timestamp,
    };

    // Dispatch 到 agent
    agent.dispatch(input);

    // 返回 id 和 timestamp
    return {
      id,
      timestamp,
    };
  };
}

/**
 * 创建 GET /streams/:messageId SSE handler
 *
 * @param streamManager - StreamManager 实例
 * @returns SSE 生成器函数
 */
function createStreamSSEHandler(streamManager: StreamManager) {
  return function* ({ params }: { params: { messageId: string } }) {
    const { messageId } = params;

    // 创建 SSE 连接
    const connection: SSEConnection = {
      queue: [],
      resolve: null,
      closed: false,
    };

    try {
      // 订阅流式更新
      streamManager.subscribe(messageId, connection);

      // 保持连接打开，等待后续更新
      while (!connection.closed) {
        // 等待数据到达队列
        yield new Promise<void>((resolve) => {
          connection.resolve = resolve;
          // 如果队列中已有数据，立即 resolve
          if (connection.queue.length > 0) {
            resolve();
          }
        });

        // 发送队列中的所有数据
        while (connection.queue.length > 0 && !connection.closed) {
          const data = connection.queue.shift();
          if (data) {
            yield sse(data);
          }
        }
      }
    } catch (error) {
      // 连接异常时标记为关闭
      connection.closed = true;
      throw error;
    } finally {
      // 确保连接被标记为关闭并取消订阅
      connection.closed = true;
      streamManager.unsubscribe(messageId, connection);
    }
  };
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
  const { openai, prompt } = options;

  // SSE 连接集合（用于 /agent 路由）
  const connections = new Set<AgentSSEConnection>();

  // 创建 StreamManager 实例
  const streamManager = new StreamManager();

  // 创建 agent 实例
  const agent = createAgent({
    user: createUserOutput({
      connections,
    }),
    llm: createLlmOutput({
      openai,
      prompt,
      streamManager,
    }),
  });

  // 订阅 agent 状态变化，触发 output
  agent.subscribe((output) => output);

  const app = new Elysia()
    .get("/agent", createSSEHandler(agent, connections))
    .post("/agent", createPostHandler(agent))
    .get("/streams/:messageId", createStreamSSEHandler(streamManager));

  return app;
}

