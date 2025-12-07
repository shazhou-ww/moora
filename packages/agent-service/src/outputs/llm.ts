/**
 * LLM Output 函数实现
 *
 * 使用 stateful effect 模式协调消息构建、OpenAI API 调用和 Agent State 更新
 */

import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type {
  ContextOfLlm,
  InputFromLlm,
  AgentInput,
} from "@moora/agent";
import type { Dispatch } from "@moora/automata";
import type { CreateLlmOutputOptions } from "@/types";
import { streamLlmCall } from "./openai";
import type { Eff } from "@moora/effects";
import { stateful } from "@moora/effects";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * LLM Output 的内部状态（不持久化）
 * 用于跟踪正在进行的 llm 调用
 */
type LlmOutputInternalState = {
  /**
   * 正在进行的 llm 调用的 messageId 数组
   * 每个调用使用自己的 messageId（复用 assi message 的 id）来标记
   */
  llmCalls: string[];
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 检查是否有比 cutOff 更新的用户消息
 */
function hasNewerUserMessages(
  userMessages: Array<{ timestamp: number }>,
  cutOff: number
): boolean {
  return userMessages.some((msg) => msg.timestamp > cutOff);
}

// ============================================================================
// 主要函数
// ============================================================================

/**
 * 检查是否有正在流式生成的消息
 */
function hasStreamingMessage(
  assiMessages: Array<{ streaming: boolean }>
): boolean {
  return assiMessages.some((msg) => msg.streaming === true);
}

/**
 * 创建 LLM Output 函数
 *
 * 使用 stateful effect 管理是否有进行中的 llm 调用（internal state）。
 * cutOff 从 context 中获取（持久化状态）。
 *
 * @param options - 创建选项
 * @returns LLM Output 函数
 */
export function createLlmOutput(
  options: CreateLlmOutputOptions
): Eff<{ context: ContextOfLlm; dispatch: Dispatch<AgentInput> }> {
  const { openai: openaiConfig, prompt, streamManager } = options;

  // 创建 OpenAI 客户端
  const openai = new OpenAI({
    apiKey: openaiConfig.endpoint.key,
    baseURL: openaiConfig.endpoint.url,
  });

  // 在闭包外层创建 stateful，确保在多次调用之间共享状态
  return stateful<{ context: ContextOfLlm; dispatch: Dispatch<AgentInput> }, LlmOutputInternalState>(
    { llmCalls: [] },
    ({ context: ctx, state, setState }) => {
      const { context, dispatch } = ctx;
      const { userMessages, assiMessages, cutOff } = context;

      // 判断是否有正在进行的调用
      const hasActiveCalls = state.llmCalls.length > 0;

      console.log("[createLlmOutput] Effect triggered", {
        activeCallsCount: state.llmCalls.length,
        activeCallIds: state.llmCalls,
        userMessagesCount: userMessages.length,
        assiMessagesCount: assiMessages.length,
        cutOff,
        latestUserMessageTimestamp: getLatestUserMessageTimestamp(userMessages),
      });

      // 如果正在调用中，忽略这次 effect
      if (hasActiveCalls) {
        console.log("[createLlmOutput] Already calling, skipping this effect");
        return;
      }

      // 检查是否有尚未发给过 llm 的 user message
      const hasNewer = hasNewerUserMessages(userMessages, cutOff);

      // 检查是否有正在流式生成的消息（从持久化状态中获取）
      const isStreaming = hasStreamingMessage(assiMessages);

      console.log("[createLlmOutput] Condition check", {
        hasNewer,
        isStreaming,
      });

      // 如果没有新消息，或者已经有 streaming 消息，不做任何操作
      if (!hasNewer || isStreaming) {
        console.log("[createLlmOutput] No action needed", {
          reason: !hasNewer ? "no-newer-messages" : "already-streaming",
        });
        return;
      }

      // 生成消息 ID（会在 executeLlmCall 中复用）
      const messageId = uuidv4();

      console.log("[createLlmOutput] Starting LLM call", {
        messageId,
      });

      // 将 messageId 添加到 llmCalls 数组中
      setState((prev) => ({
        llmCalls: [...prev.llmCalls, messageId],
      }));

      // 使用 queueMicrotask 执行异步 LLM 调用
      queueMicrotask(() => {
        console.log("[createLlmOutput] queueMicrotask: About to execute LLM call", {
          messageId,
        });
        executeLlmCall({
          openai,
          openaiConfig,
          prompt,
          streamManager,
          context,
          dispatch,
          messageId, // 传入 messageId，确保复用
          onComplete: () => {
            console.log("[createLlmOutput] LLM call completed, removing from llmCalls", {
              messageId,
            });
            // 调用完成后，从 llmCalls 中移除 messageId（使用 updater 函数）
            setState((prev) => ({
              llmCalls: prev.llmCalls.filter((id) => id !== messageId),
            }));
          },
          onError: () => {
            console.log("[createLlmOutput] LLM call failed, removing from llmCalls", {
              messageId,
            });
            // 调用失败时，从 llmCalls 中移除 messageId（使用 updater 函数）
            setState((prev) => ({
              llmCalls: prev.llmCalls.filter((id) => id !== messageId),
            }));
          },
        }).catch((error) => {
          console.error("[createLlmOutput] Error executing LLM call:", error, {
            messageId,
          });
          // 即使出错，也要从 llmCalls 中移除 messageId（使用 updater 函数）
          setState((prev) => ({
            llmCalls: prev.llmCalls.filter((id) => id !== messageId),
          }));
        });
      });
    }
  );
}

// ============================================================================
// 内部函数
// ============================================================================

/**
 * 执行 LLM 调用的参数
 */
type ExecuteLlmCallParams = {
  openai: OpenAI;
  openaiConfig: { model: string };
  prompt: string;
  streamManager: CreateLlmOutputOptions["streamManager"];
  context: ContextOfLlm;
  dispatch: Dispatch<AgentInput>;
  messageId: string;
  onComplete: () => void;
  onError: () => void;
};

/**
 * 获取最新的用户消息时间戳
 */
function getLatestUserMessageTimestamp(
  userMessages: Array<{ timestamp: number }>
): number {
  if (userMessages.length === 0) return 0;
  return Math.max(...userMessages.map((msg) => msg.timestamp));
}

/**
 * 执行 LLM 调用
 *
 * @internal
 */
async function executeLlmCall(params: ExecuteLlmCallParams): Promise<void> {
  const {
    openai,
    openaiConfig,
    prompt,
    streamManager,
    context,
    dispatch,
    messageId,
    onComplete,
    onError,
  } = params;
  const { userMessages, assiMessages } = context;

  const timestamp = Date.now();

  // 计算这次请求实际处理的最迟的用户消息时间戳
  const cutOff = getLatestUserMessageTimestamp(userMessages);

  console.log("[executeLlmCall] Starting LLM call", {
    messageId,
    timestamp,
    cutOff,
    userMessagesCount: userMessages.length,
  });

  // 先在 StreamManager 中创建流（确保前端连接时流已存在）
  streamManager.startStream(messageId);

  // 标记是否已经收到第一个 chunk（用于决定何时 dispatch start-assi-message-stream）
  let hasReceivedFirstChunk = false;

  try {
    // 执行 Streaming LLM Call（内部会处理消息格式转换）
    const fullContent = await streamLlmCall({
      openai,
      model: openaiConfig.model,
      prompt,
      userMessages,
      assiMessages,
      streamManager,
      messageId,
      onFirstChunk: () => {
        // 在收到第一个 chunk 时，通知 Agent State 开始流式生成，携带 cutOff
        if (!hasReceivedFirstChunk) {
          hasReceivedFirstChunk = true;
          console.log("[executeLlmCall] Received first chunk, dispatching start-assi-message-stream", {
            messageId,
            cutOff,
          });
          const startInput: InputFromLlm = {
            type: "start-assi-message-stream",
            id: messageId,
            timestamp,
            cutOff,
          };
          dispatch(startInput);
        }
      },
    });

    // 如果没有收到任何 chunk（不应该发生，但为了安全）
    if (!hasReceivedFirstChunk) {
      console.log("[executeLlmCall] No chunks received, dispatching start-assi-message-stream anyway", {
        messageId,
        cutOff,
      });
      // 仍然需要 dispatch start-assi-message-stream
      const startInput: InputFromLlm = {
        type: "start-assi-message-stream",
        id: messageId,
        timestamp,
        cutOff,
      };
      dispatch(startInput);
    }

    // 通知 Agent State 结束流式生成
    const endInput: InputFromLlm = {
      type: "end-assi-message-stream",
      id: messageId,
      content: fullContent,
      timestamp: Date.now(),
    };
    dispatch(endInput);

    // 在 StreamManager 中结束流式生成
    streamManager.endStream(messageId, fullContent);

    console.log("[executeLlmCall] LLM call succeeded", {
      messageId,
      contentLength: fullContent.length,
    });

    // 调用成功，调用 onComplete
    onComplete();
  } catch (error) {
    // 错误处理：如果在收到第一个 chunk 之前就出错，不 dispatch start-assi-message-stream
    console.error("[executeLlmCall] OpenAI API error:", error);

    // 如果已经收到第一个 chunk，需要结束 streaming
    if (hasReceivedFirstChunk) {
      console.log("[executeLlmCall] Error after first chunk, dispatching end-assi-message-stream");
      // 通知 Agent State 结束流式生成（使用空内容或错误消息）
      const endInput: InputFromLlm = {
        type: "end-assi-message-stream",
        id: messageId,
        content: "",
        timestamp: Date.now(),
      };
      dispatch(endInput);
    } else {
      console.log("[executeLlmCall] Error before first chunk, skipping end-assi-message-stream");
    }

    // 在 StreamManager 中结束流式生成（如果流还存在）
    streamManager.endStream(messageId, "");

    console.log("[executeLlmCall] LLM call failed, calling onError", {
      messageId,
      hasReceivedFirstChunk,
    });

    // 调用失败，调用 onError
    onError();
  }
}

