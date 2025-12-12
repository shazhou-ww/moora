/**
 * 创建 Coordinator Agent 的所有 Reactions
 */

import { v4 as uuidv4 } from "uuid";

import type { CallLlm } from "@moora/agent-common";
import {
  USER,
  LLM,
  TOOLKIT,
  WORKFORCE,
} from "@moora/agent-coordinator";
import type {
  ReactionFns,
  PerspectiveOfUser,
} from "@moora/agent-coordinator";
import { stateful } from "@moora/effects";
import type { Toolkit } from "@moora/toolkit";
import type { Workforce } from "@moora/workforce";

import { getLogger } from "@/logger";

const logger = getLogger();

/**
 * 创建 Reactions 的配置选项
 */
export type CreateReactionsOptions = {
  /** LLM 调用函数 */
  callLlm: CallLlm;
  /** Toolkit 实例 */
  toolkit: Toolkit;
  /** Workforce 实例 */
  workforce: Workforce;
  /** 发布 User Perspective 变化的回调 */
  publishPatch: (patch: string) => void;
  /** Stream 管理回调 */
  onStreamStart?: (messageId: string) => void;
  onStreamChunk?: (messageId: string, chunk: string) => void;
  onStreamComplete?: (messageId: string, content: string) => void;
};

/**
 * 创建所有 Actor 的 Reactions
 */
export function createReactions(options: CreateReactionsOptions): ReactionFns {
  const {
    callLlm,
    toolkit,
    workforce,
    publishPatch,
    onStreamStart,
    onStreamChunk,
    onStreamComplete,
  } = options;

  // User Reaction - 处理通知用户
  const userReaction: ReactionFns[typeof USER] = (() => {
    let previousPerspective: PerspectiveOfUser | null = null;

    return async ({ perspective }) => {
      // 计算 perspective 变化并发送 patch
      if (previousPerspective === null) {
        logger.server.debug("User reaction: First perspective");
        previousPerspective = perspective;
        return;
      }

      // 检查是否有变化
      if (JSON.stringify(previousPerspective) !== JSON.stringify(perspective)) {
        const { createPatch } = await import("rfc6902");
        const patches = createPatch(previousPerspective, perspective);

        if (patches.length > 0) {
          logger.server.debug(`User reaction: Publishing ${patches.length} patches`);
          publishPatch(
            JSON.stringify({
              type: "patch",
              patches,
            })
          );
          previousPerspective = perspective;
        }
      }
    };
  })();

  // LLM Reaction - 处理 LLM 调用
  const llmReaction: ReactionFns[typeof LLM] = stateful(
    { ongoingCallId: null as string | null },
    ({ context: ctx, state, setState }) => {
      const { perspective, dispatch } = ctx;

      // 类型断言：perspective 实际是 Appearance，包含输入字段
      const p = perspective as any;

      if (!p || !p.userMessages || !p.assiMessages) {
        return;
      }

      const { userMessages, assiMessages, cutOff, topLevelTasks, toolResults } = p;

      // 如果有正在进行的调用，跳过
      if (state.ongoingCallId !== null) {
        return;
      }

      // 检查是否有新的用户消息需要处理
      const hasNewMessages = userMessages.some((msg: any) => msg.timestamp > cutOff);

      if (!hasNewMessages) {
        return;
      }

      // 开始新的 LLM 调用
      const messageId = uuidv4();
      const timestamp = Date.now();

      setState(() => ({ ongoingCallId: messageId }));

      if (onStreamStart) {
        onStreamStart(messageId);
      }

      // 构建消息列表
      const messages = [
        ...userMessages.map((m: any) => ({
          role: "user" as const,
          id: m.id,
          content: m.content,
          timestamp: m.timestamp,
        })),
        ...assiMessages
          .filter((m: any) => !m.streaming)
          .map((m: any) => ({
            role: "assistant" as const,
            id: m.id,
            streaming: false as const,
            content: m.content,
            timestamp: m.timestamp,
          })),
      ];

      // 构建系统提示，包含任务信息
      const taskInfo = Object.values(topLevelTasks || {})
        .map(
          (task: any) =>
            `- Task "${task.title}" (${task.id}): ${task.status}${
              task.result
                ? task.result.success
                  ? ` - Success: ${task.result.conclusion}`
                  : ` - Failed: ${task.result.error}`
                : ""
            }`
        )
        .join("\n");

      // 获取最新的用户消息时间戳
      const latestUserMessageTimestamp = Math.max(
        0,
        ...userMessages.map((m: any) => m.timestamp)
      );

      // 异步调用 LLM
      void (async () => {
        try {
          // Dispatch start action
          dispatch({
            type: "start-assi-message-stream",
            id: messageId,
            timestamp,
            cutOff: latestUserMessageTimestamp,
          });

          // 调用 LLM
          await callLlm(
            {
              messages,
              scenario: "re-act-loop",
              tools: [],
              toolCalls: [],
            },
            {
              onStart: () => {
                if (onStreamStart) {
                  onStreamStart(messageId);
                }
                return messageId;
              },
              onChunk: (chunk: string) => {
                if (onStreamChunk) {
                  onStreamChunk(messageId, chunk);
                }
              },
              onComplete: (content: string) => {
                dispatch({
                  type: "end-assi-message-stream",
                  id: messageId,
                  content,
                  timestamp: Date.now(),
                });

                if (onStreamComplete) {
                  onStreamComplete(messageId, content);
                }

                setState(() => ({ ongoingCallId: null }));
              },
              onToolCall: () => {
                // TODO: Handle tool calls
              },
            }
          );
        } catch (error) {
          logger.llm.error("LLM call failed", error as unknown as Record<string, unknown>);
          setState(() => ({ ongoingCallId: null }));
        }
      })();
    }
  );

  // Toolkit Reaction - 处理工具调用
  const toolkitReaction: ReactionFns[typeof TOOLKIT] = stateful(
    { executingToolCalls: [] as string[] },
    ({ context: ctx, state, setState }) => {
      const { perspective, dispatch } = ctx;

      const p = perspective as any;

      if (!p || !p.toolCallRequests) {
        return;
      }

      const { toolCallRequests, toolResults } = p;

      // 找出已经有结果的 tool call IDs
      const completedToolCallIds = new Set(toolResults.map((r: any) => r.toolCallId));

      // 找出需要执行的 tool calls（没有结果且不在执行中）
      const pendingToolCalls = toolCallRequests.filter(
        (req: any) =>
          !completedToolCallIds.has(req.toolCallId) &&
          !state.executingToolCalls.includes(req.toolCallId)
      );

      if (pendingToolCalls.length === 0) {
        return;
      }

      // 将所有 pending tool calls 标记为执行中
      setState((prev) => ({
        executingToolCalls: [
          ...prev.executingToolCalls,
          ...pendingToolCalls.map((t: any) => t.toolCallId),
        ],
      }));

      // 异步执行每个 tool call
      void (async () => {
        await Promise.all(
          pendingToolCalls.map(async (t: any) => {
            try {
              // 查找工具
              const tool = toolkit.getAllToolInfos().find((tool) => tool.name === t.name);
              if (!tool) {
                logger.toolkit.warn(`Tool "${t.name}" not found`);
                dispatch({
                  type: "return-tool-result",
                  toolCallId: t.toolCallId,
                  result: JSON.stringify({ error: `Tool not found: ${t.name}` }),
                  timestamp: Date.now(),
                });
                return;
              }

              // 执行工具
              const result = await toolkit.invoke(t.name, t.arguments);

              // 发送结果
              dispatch({
                type: "return-tool-result",
                toolCallId: t.toolCallId,
                result,
                timestamp: Date.now(),
              });
            } catch (error) {
              logger.toolkit.error(`Tool execution failed: ${t.name}`, error as unknown as Record<string, unknown>);
              dispatch({
                type: "return-tool-result",
                toolCallId: t.toolCallId,
                result: JSON.stringify({
                  error: error instanceof Error ? error.message : String(error),
                }),
                timestamp: Date.now(),
              });
            }
          })
        );

        // 从执行中列表移除
        setState((prev) => ({
          executingToolCalls: prev.executingToolCalls.filter(
            (id) => !pendingToolCalls.some((t: any) => t.toolCallId === id)
          ),
        }));
      })();
    }
  );

  // Workforce Reaction - 处理任务管理
  const workforceReaction: ReactionFns[typeof WORKFORCE] = async ({ perspective, dispatch }) => {
    const p = perspective as any;

    if (!p) {
      return;
    }

    const { taskCreateRequests, messageAppendRequests, taskCancelRequests } = p;

    // 处理任务创建请求
    for (const request of taskCreateRequests || []) {
      try {
        const task = workforce.getTask(request.taskId);
        if (!task) {
          workforce.createTasks([
            {
              id: request.taskId,
              title: request.title,
              goal: request.goal,
            },
          ]);

          dispatch({
            type: "update-task-status",
            taskId: request.taskId,
            status: "ready",
            timestamp: Date.now(),
          });

          logger.server.info(`Task created: ${request.taskId}`);
        }
      } catch (error) {
        logger.server.error(`Failed to create task: ${request.taskId}`, error as unknown as Record<string, unknown>);
      }
    }

    // 处理追加消息请求
    for (const request of messageAppendRequests || []) {
      try {
        workforce.appendMessage({
          messageId: request.messageId,
          content: request.content,
          taskIds: request.taskIds,
        });
        logger.server.debug(`Message appended: ${request.messageId}`);
      } catch (error) {
        logger.server.error(`Failed to append message: ${request.messageId}`, error as unknown as Record<string, unknown>);
      }
    }

    // 处理取消任务请求
    for (const request of taskCancelRequests || []) {
      try {
        workforce.cancelTasks(request.taskIds);
        logger.server.info(`Tasks cancelled: ${request.taskIds.join(", ")}`);
      } catch (error) {
        logger.server.error(`Failed to cancel tasks`, error as unknown as Record<string, unknown>);
      }
    }
  };

  return {
    [USER as any]: userReaction,
    [LLM as any]: llmReaction,
    [TOOLKIT as any]: toolkitReaction,
    [WORKFORCE as any]: workforceReaction,
  } as ReactionFns;
}
