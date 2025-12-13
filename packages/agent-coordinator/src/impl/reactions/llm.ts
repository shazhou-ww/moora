/**
 * Llm Reaction 工厂函数
 */

import { v4 as uuidv4 } from "uuid";

import type { CallLlmCallbacks, CallLlmContext } from "@moora/agent-common";
import type { Dispatch } from "@moora/automata";
import { stateful } from "@moora/effects";

import type {
  LLM,
  ReactionFnOf,
  PerspectiveOfLlm,
  CallLlm,
  Actuation,
} from "../../decl";

/**
 * Llm Reaction 依赖
 */
export type LlmReactionDeps = {
  /** LLM 调用函数 */
  callLlm: CallLlm;
};

/**
 * Llm Reaction 的内部状态
 */
type LlmReactionState = {
  /** 正在进行的 llm 调用的 messageId */
  ongoingCallId: string | null;
};

/**
 * 创建 Llm Reaction
 *
 * Llm 负责：
 * 1. 检测新的用户消息，调用 LLM 生成响应
 * 2. 根据 LLM 响应生成 workforce 操作请求
 */
export function createLlmReaction(
  deps: LlmReactionDeps
): ReactionFnOf<typeof LLM> {
  const { callLlm } = deps;

  return stateful<{ perspective: PerspectiveOfLlm; dispatch: Dispatch<Actuation> }, LlmReactionState>(
    { ongoingCallId: null },
    ({ context: ctx, state, setState }) => {
      const { perspective, dispatch } = ctx;
      const { userMessages, assiMessages, llmProceedCutOff, topLevelTasks } = perspective;

      // 如果有正在进行的调用，跳过
      if (state.ongoingCallId !== null) {
        return;
      }

      // 检查是否有新的用户消息需要处理
      const hasNewMessages = userMessages.some((msg) => msg.timestamp > llmProceedCutOff);

      if (!hasNewMessages) {
        return;
      }

      // 获取最新的用户消息时间戳
      const latestUserMessageTimestamp = Math.max(
        0,
        ...userMessages.map((m) => m.timestamp)
      );

      // 开始新的 LLM 调用
      const messageId = uuidv4();
      const timestamp = Date.now();

      // 更新状态
      setState(() => ({ ongoingCallId: messageId }));

      // 构建消息列表
      const messages = [
        ...userMessages.map((m) => ({
          role: "user" as const,
          id: m.id,
          content: m.content,
          timestamp: m.timestamp,
        })),
        ...assiMessages
          .filter((m) => !m.streaming)
          .map((m) => ({
            role: "assistant" as const,
            id: m.id,
            streaming: false as const,
            content: !m.streaming ? m.content : "",
            timestamp: m.timestamp,
          })),
      ];

      // 构建系统提示，包含任务信息
      const taskInfo = topLevelTasks
        .map(
          (task) =>
            `- Task "${task.title}" (${task.id}): ${task.status}${
              task.result
                ? task.result.success
                  ? ` - Success: ${task.result.conclusion}`
                  : ` - Failed: ${!task.result.success ? task.result.error : "unknown error"}`
                : ""
            }`
        )
        .join("\n");

      const systemPrompt = `You are a coordinator agent that manages tasks in a workforce system.

Current Tasks:
${taskInfo || "No active tasks"}

Available Actions:
1. Create a new task - Request workforce to create a new task
2. Append message - Send additional information to an existing task
3. Cancel task - Cancel an ongoing task

When responding, you can mention these actions in natural language, and I will help you execute them.`;

      const context: CallLlmContext = {
        messages: [
          { role: "user" as const, id: "system", content: systemPrompt, timestamp: 0 },
          ...messages,
        ],
        scenario: "re-act-loop",
        tools: [],
        toolCalls: [],
        toolChoice: "auto",
      };

      let hasStarted = false;

      const callbacks: CallLlmCallbacks = {
        onStart: () => {
          if (!hasStarted) {
            hasStarted = true;
            dispatch({
              type: "start-assi-message-stream",
              id: messageId,
              timestamp,
              llmProceedCutOff: latestUserMessageTimestamp,
            });
          }
          return messageId;
        },
        onChunk: (_chunk: string) => {
          // 不处理 chunk，coordinator 不需要流式输出
        },
        onComplete: (content: string) => {
          if (hasStarted) {
            dispatch({
              type: "end-assi-message-stream",
              id: messageId,
              content,
              timestamp: Date.now(),
            });
          }
          setState(() => ({ ongoingCallId: null }));
        },
        onToolCall: (_request: { name: string; arguments: string }) => {
          // Coordinator 暂不支持工具调用
        },
      };

      // 异步调用 LLM
      // eslint-disable-next-line no-undef
      queueMicrotask(() => {
        Promise.resolve(callLlm(context, callbacks)).catch(() => {
          setState(() => ({ ongoingCallId: null }));
        });
      });
    }
  );
}
