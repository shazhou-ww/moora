/**
 * LLM Actor Reaction 工厂函数
 */

import { v4 as uuidv4 } from "uuid";

import { stateful } from "@moora/effects";

import type { LLM } from "@/decl/actors";
import type { Actuation } from "@/decl/agent";
import type { ReactionFnOf } from "@/decl/helpers";
import type { PerspectiveOfLlm } from "@/decl/perspectives";
import type {
  LlmReactionOptions,
  CallLlmContext,
  CallLlmCallbacks,
  CallLlmMessage,
  CallLlmToolCall,
  CallLlmToolDefinition,
} from "@/decl/reactions";
import type { Dispatch } from "@moora/automata";

// ============================================================================
// 类型定义
// ============================================================================

type LlmReactionFn = ReactionFnOf<typeof LLM>;

/**
 * LLM Reaction 的内部状态（不持久化）
 * 用于跟踪正在进行的 llm 调用
 */
type LlmReactionInternalState = {
  /**
   * 正在进行的 llm 调用的 messageId 数组
   */
  llmCalls: string[];
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 检查是否有比 cutOff 更新的用户消息或工具结果
 */
function hasNewerMessages(
  userMessages: Array<{ timestamp: number }>,
  toolResults: Array<{ timestamp: number }>,
  cutOff: number
): boolean {
  const hasNewerUserMessage = userMessages.some((msg) => msg.timestamp > cutOff);
  const hasNewerToolResult = toolResults.some((r) => r.timestamp > cutOff);
  return hasNewerUserMessage || hasNewerToolResult;
}

/**
 * 检查是否有待处理的 tool calls（有 request 但没有对应的 result）
 */
function hasPendingToolCalls(
  toolCallRequests: Array<{ toolCallId: string }>,
  toolResults: Array<{ toolCallId: string }>
): boolean {
  const resultIds = new Set(toolResults.map((r) => r.toolCallId));
  return toolCallRequests.some((req) => !resultIds.has(req.toolCallId));
}

/**
 * 检查是否有正在流式生成的消息
 */
function hasStreamingMessage(assiMessages: Array<{ streaming: boolean }>): boolean {
  return assiMessages.some((msg) => msg.streaming === true);
}

/**
 * 从 perspective 和 tools 构建 CallLlmContext
 */
function buildCallLlmContext(
  perspective: PerspectiveOfLlm,
  tools: CallLlmToolDefinition[]
): CallLlmContext {
  const { userMessages, assiMessages, toolCallRequests, toolResults } = perspective;

  // 转换消息列表
  const messages: CallLlmMessage[] = [];

  // 合并 user 和 assistant 消息，按时间戳排序
  const allMessages = [
    ...userMessages.map((m) => ({ ...m, _type: "user" as const })),
    ...assiMessages
      .filter((m) => !m.streaming) // 只包含已完成的消息
      .map((m) => ({ ...m, _type: "assistant" as const })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  for (const msg of allMessages) {
    messages.push(msg as CallLlmMessage);
  }

  // 构建 toolCalls（已完成的工具调用记录）
  const toolCalls: CallLlmToolCall[] = [];
  const resultMap = new Map(toolResults.map((r) => [r.toolCallId, r]));

  for (const req of toolCallRequests) {
    const result = resultMap.get(req.toolCallId);
    if (result) {
      toolCalls.push({
        toolCallId: req.toolCallId,
        name: req.name,
        parameter: req.arguments,
        result: result.result,
        requestedAt: req.timestamp,
        respondedAt: result.timestamp,
      });
    }
  }

  return {
    messages,
    scenario: "re-act-loop",
    tools,
    toolCalls,
    toolChoice: "auto",
  };
}

/**
 * 计算新的 cutOff 值
 */
function calculateNewCutOff(perspective: PerspectiveOfLlm): number {
  const { userMessages, toolResults } = perspective;
  const allTimestamps = [
    ...userMessages.map((m) => m.timestamp),
    ...toolResults.map((r) => r.timestamp),
  ];
  return allTimestamps.length > 0 ? Math.max(...allTimestamps) : 0;
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建 LLM Actor 的 Reaction 函数
 *
 * LLM Actor 的 reaction 负责：
 * 1. 检查是否需要调用 LLM（有新的用户消息或工具结果）
 * 2. 构建 CallLlmContext 并调用 callLlm
 * 3. 处理 callbacks，dispatch 对应的 Action
 *
 * @param options - LLM reaction 配置选项
 * @returns LLM Actor 的 reaction 函数
 *
 * @example
 * ```typescript
 * const llmReaction = createLlmReaction({
 *   callLlm: async (context, callbacks) => {
 *     // 调用 OpenAI API
 *     const stream = await openai.chat.completions.create({...});
 *     for await (const chunk of stream) {
 *       callbacks.onChunk(chunk.choices[0]?.delta?.content ?? "");
 *     }
 *     callbacks.onComplete(fullContent);
 *   },
 * });
 * ```
 */
export const createLlmReaction = (options: LlmReactionOptions): LlmReactionFn => {
  const { callLlm, tools = [], onStart: onStartOption, onChunk: onChunkOption, onComplete: onCompleteOption } = options;

  return stateful<{ perspective: PerspectiveOfLlm; dispatch: Dispatch<Actuation> }, LlmReactionInternalState>(
    { llmCalls: [] },
    ({ context: ctx, state, setState }) => {
      const { perspective, dispatch } = ctx;
      const { userMessages, assiMessages, cutOff, toolCallRequests, toolResults } = perspective;

      // 判断是否有正在进行的调用
      const hasActiveCalls = state.llmCalls.length > 0;

      // 检查条件
      const hasNewer = hasNewerMessages(userMessages, toolResults, cutOff);
      const isStreaming = hasStreamingMessage(assiMessages);
      const hasPending = hasPendingToolCalls(toolCallRequests, toolResults);

      // 如果正在调用中，忽略这次 reaction
      if (hasActiveCalls) return;

      // 如果正在 streaming，不做任何操作
      if (isStreaming) return;

      // 如果有待处理的 tool calls，等待它们完成
      if (hasPending) return;

      // 需要调用 LLM 的条件：有新的用户消息或新的工具结果
      if (!hasNewer) return;

      // 生成消息 ID
      const messageId = uuidv4();

      // 将 messageId 添加到 llmCalls 数组中
      setState((prev) => ({
        llmCalls: [...prev.llmCalls, messageId],
      }));

      // 计算新的 cutOff
      const newCutOff = calculateNewCutOff(perspective);

      // 构建 context
      const context = buildCallLlmContext(perspective, tools);

      let hasStarted = false;

      // 构建 callbacks
      const callbacks: CallLlmCallbacks = {
        onStart: () => {
          if (!hasStarted) {
            hasStarted = true;
            // 收到第一个 chunk 时才 dispatch start action
            dispatch({
              type: "start-assi-message-stream",
              id: messageId,
              timestamp: Date.now(),
              cutOff: newCutOff,
            });
            // 如果提供了 onStart 回调，调用它
            if (onStartOption) {
              onStartOption(messageId);
            }
          }
          return messageId;
        },
        onChunk: (chunk: string) => {
          // 如果提供了 onChunk 回调，调用它
          if (onChunkOption) {
            onChunkOption(messageId, chunk);
          }
        },
        onComplete: (content: string) => {
          // 只有在 onStart 被调用后才 dispatch end action
          if (hasStarted) {
            dispatch({
              type: "end-assi-message-stream",
              id: messageId,
              content,
              timestamp: Date.now(),
            });
            // 如果提供了 onComplete 回调，调用它
            if (onCompleteOption) {
              onCompleteOption(messageId, content);
            }
          }
          // 调用完成后，从 llmCalls 中移除 messageId
          setState((prev) => ({
            llmCalls: prev.llmCalls.filter((id) => id !== messageId),
          }));
        },
        onToolCall: (request: { name: string; arguments: string }) => {
          const toolCallId = uuidv4();
          dispatch({
            type: "request-tool-call",
            toolCallId,
            name: request.name,
            arguments: request.arguments,
            timestamp: Date.now(),
            cutOff: newCutOff,
          });
        },
      };

      // 使用 queueMicrotask 执行异步 LLM 调用
      queueMicrotask(() => {
        Promise.resolve(callLlm(context, callbacks)).catch(() => {
          // 调用失败时，从 llmCalls 中移除 messageId
          setState((prev) => ({
            llmCalls: prev.llmCalls.filter((id) => id !== messageId),
          }));
        });
      });
    }
  );
};
