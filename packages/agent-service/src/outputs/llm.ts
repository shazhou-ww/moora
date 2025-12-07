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
 * 用于跟踪是否有正在进行的 llm 调用
 */
type LlmOutputInternalState = {
  /**
   * 是否有正在进行的 llm 调用
   */
  isCalling: boolean;
  /**
   * 当前重试次数（用于防止无限重试）
   */
  retryCount: number;
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
): (dispatch: Dispatch<AgentInput>) => Eff<ContextOfLlm> {
  const { openai: openaiConfig, prompt, streamManager } = options;

  // 创建 OpenAI 客户端
  const openai = new OpenAI({
    apiKey: openaiConfig.endpoint.key,
    baseURL: openaiConfig.endpoint.url,
  });

  // 最大重试次数
  const MAX_RETRY_COUNT = 3;

  return (dispatch: Dispatch<AgentInput>) => {
    return stateful<ContextOfLlm, LlmOutputInternalState>(
      { isCalling: false, retryCount: 0 },
      ({ context, state, setState }) => {
        // 如果正在调用中，忽略这次 effect
        if (state.isCalling) {
          return;
        }

        const { userMessages, assiMessages, cutOff } = context;

        // 检查是否有尚未发给过 llm 的 user message
        const hasNewer = hasNewerUserMessages(userMessages, cutOff);

        // 检查是否有正在流式生成的消息（从持久化状态中获取）
        const isStreaming = hasStreamingMessage(assiMessages);

        // 如果没有新消息，或者已经有 streaming 消息，不做任何操作
        if (!hasNewer || isStreaming) {
          // 重置重试次数
          setState({ isCalling: false, retryCount: 0 });
          return;
        }

        // 检查重试次数是否超过限制
        if (state.retryCount >= MAX_RETRY_COUNT) {
          console.error(
            `[createLlmOutput] Max retry count (${MAX_RETRY_COUNT}) reached, giving up`
          );
          // 重置状态，不再重试
          setState({ isCalling: false, retryCount: 0 });
          return;
        }

        // 记录当前重试次数
        const currentRetryCount = state.retryCount + 1;

        // 设置 internal state 为正在调用，增加重试次数
        setState({ isCalling: true, retryCount: currentRetryCount });

        // 使用 queueMicrotask 执行异步 LLM 调用
        queueMicrotask(() => {
          executeLlmCall({
            openai,
            openaiConfig,
            prompt,
            streamManager,
            context,
            dispatch,
            onComplete: () => {
              // 调用完成后，重置 isCalling 状态和重试次数
              setState({ isCalling: false, retryCount: 0 });
            },
            onError: () => {
              // 调用失败时，重置 isCalling 状态，保留当前重试次数（会在下次重试时增加）
              setState({ isCalling: false, retryCount: currentRetryCount });
            },
          }).catch((error) => {
            console.error("[createLlmOutput] Error executing LLM call:", error);
            // 即使出错，也要重置 isCalling 状态，保留当前重试次数
            setState({ isCalling: false, retryCount: currentRetryCount });
          });
        });
      }
    );
  };
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
    onComplete,
    onError,
  } = params;
  const { userMessages, assiMessages } = context;

  // 生成消息 ID
  const messageId = uuidv4();
  const timestamp = Date.now();

  // 计算这次请求实际处理的最迟的用户消息时间戳
  const cutOff = getLatestUserMessageTimestamp(userMessages);

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

    // 调用成功，调用 onComplete
    onComplete();
  } catch (error) {
    // 错误处理：如果在收到第一个 chunk 之前就出错，不 dispatch start-assi-message-stream
    console.error("OpenAI API error:", error);

    // 如果已经收到第一个 chunk，需要结束 streaming
    if (hasReceivedFirstChunk) {
      // 通知 Agent State 结束流式生成（使用空内容或错误消息）
      const endInput: InputFromLlm = {
        type: "end-assi-message-stream",
        id: messageId,
        content: "",
        timestamp: Date.now(),
      };
      dispatch(endInput);
    }

    // 在 StreamManager 中结束流式生成（如果流还存在）
    streamManager.endStream(messageId, "");

    // 调用失败，调用 onError
    onError();
  }
}

