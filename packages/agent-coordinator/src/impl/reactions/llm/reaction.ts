/**
 * Llm Reaction 实现
 *
 * Coordinator 的 LLM Reaction 负责：
 * 1. 检测新的用户消息，调用 LLM 生成响应
 * 2. 通过伪工具让 LLM 管理 workforce 任务
 */

import { v4 as uuidv4 } from "uuid";

import type { CallLlmCallbacks } from "@moora/agent-common";
import type { Dispatch } from "@moora/automata";
import { stateful } from "@moora/effects";

import { buildLlmContext } from "./context";
import { parseCoordinatorPseudoToolCall } from "./pseudo-tools";
import type {
  LLM,
  ReactionFnOf,
  PerspectiveOfLlm,
  CallLlm,
  Actuation,
} from "../../../decl";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Llm Reaction 依赖
 */
export type LlmReactionDeps = {
  /** LLM 调用函数 */
  callLlm: CallLlm;
  /**
   * 可选的流式开始回调
   *
   * 当 LLM 开始输出时调用，可用于初始化流
   *
   * @param messageId - 消息 ID
   */
  onStart?: (messageId: string) => void;
  /**
   * 可选的流式输出回调
   *
   * 当 LLM 输出 chunk 时调用，可用于实时推送到客户端
   *
   * @param messageId - 消息 ID
   * @param chunk - 输出的 chunk 内容
   */
  onChunk?: (messageId: string, chunk: string) => void;
  /**
   * 可选的流式完成回调
   *
   * 当 LLM 输出完成时调用，可用于关闭流
   *
   * @param messageId - 消息 ID
   * @param content - 完整的输出内容
   */
  onComplete?: (messageId: string, content: string) => void;
};

/**
 * Llm Reaction 的内部状态
 */
type LlmReactionState = {
  /** 正在进行的 llm 调用的 messageId */
  ongoingCallId: string | null;
};

// ============================================================================
// 辅助函数：检查是否需要调用 LLM
// ============================================================================

/**
 * 检查是否有新的用户消息需要处理
 */
function hasNewUserMessages(perspective: PerspectiveOfLlm): boolean {
  const { userMessages, llmProceedCutOff } = perspective;
  return userMessages.some((msg) => msg.timestamp > llmProceedCutOff);
}

/**
 * 检查是否有新完成的任务需要处理（succeeded 或 failed）
 */
function hasNewCompletedTasks(perspective: PerspectiveOfLlm): boolean {
  const { topLevelTasks, llmProceedCutOff } = perspective;
  return topLevelTasks.some(
    (task) => task.completionUpdatedAt > llmProceedCutOff
  );
}

/**
 * 获取最新的用户消息或任务完成时间戳
 */
function getLatestProceedTimestamp(perspective: PerspectiveOfLlm): number {
  const { userMessages, topLevelTasks } = perspective;
  const latestUserMessage = Math.max(0, ...userMessages.map((m) => m.timestamp));
  const latestTaskCompletion = Math.max(0, ...topLevelTasks.map((t) => t.completionUpdatedAt));
  return Math.max(latestUserMessage, latestTaskCompletion);
}

// ============================================================================
// 辅助函数：处理伪工具调用
// ============================================================================

/**
 * 处理伪工具调用，dispatch 对应的 action
 */
function handlePseudoToolCall(
  name: string,
  argsJson: string,
  dispatch: Dispatch<Actuation>
): void {
  const parsed = parseCoordinatorPseudoToolCall(name, argsJson);
  if (!parsed) return;

  const timestamp = Date.now();

  switch (parsed.type) {
    case "create-tasks": {
      for (const task of parsed.params.tasks) {
        dispatch({
          type: "request-create-task",
          taskId: uuidv4(),
          title: task.title,
          goal: task.goal,
          timestamp,
        });
      }
      break;
    }
    case "append-message": {
      dispatch({
        type: "request-append-message",
        messageId: uuidv4(),
        content: parsed.params.content,
        taskIds: parsed.params.taskIds,
        timestamp,
      });
      break;
    }
    case "cancel-tasks": {
      dispatch({
        type: "request-cancel-tasks",
        taskIds: parsed.params.taskIds,
        timestamp,
      });
      break;
    }
  }
}

// ============================================================================
// 辅助函数：创建 LLM Callbacks
// ============================================================================

/**
 * 流式回调配置
 */
type StreamCallbacks = {
  onStart?: (messageId: string) => void;
  onChunk?: (messageId: string, chunk: string) => void;
  onComplete?: (messageId: string, content: string) => void;
};

/**
 * 创建 LLM 回调函数
 */
function createLlmCallbacks(
  messageId: string,
  timestamp: number,
  latestProceedTimestamp: number,
  dispatch: Dispatch<Actuation>,
  setState: (fn: () => LlmReactionState) => void,
  streamCallbacks: StreamCallbacks
): CallLlmCallbacks {
  let hasStarted = false;

  return {
    onStart: () => {
      if (!hasStarted) {
        hasStarted = true;
        dispatch({
          type: "start-assi-message-stream",
          id: messageId,
          timestamp,
          llmProceedCutOff: latestProceedTimestamp,
        });
        // 调用外部回调
        streamCallbacks.onStart?.(messageId);
      }
      return messageId;
    },
    onChunk: (chunk: string) => {
      // 调用外部回调，支持流式输出
      streamCallbacks.onChunk?.(messageId, chunk);
    },
    onComplete: (content: string) => {
      if (hasStarted) {
        dispatch({
          type: "end-assi-message-stream",
          id: messageId,
          content,
          timestamp: Date.now(),
        });
        // 调用外部回调
        streamCallbacks.onComplete?.(messageId, content);
      }
      setState(() => ({ ongoingCallId: null }));
    },
    onToolCall: (request: { name: string; arguments: string }) => {
      handlePseudoToolCall(request.name, request.arguments, dispatch);
    },
  };
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 创建 Llm Reaction
 *
 * Llm 负责：
 * 1. 检测新的用户消息或任务完成，调用 LLM 生成响应
 * 2. 通过伪工具让 LLM 管理 workforce 任务
 */
export function createLlmReaction(
  deps: LlmReactionDeps
): ReactionFnOf<typeof LLM> {
  const { callLlm, onStart, onChunk, onComplete } = deps;

  // 流式回调配置
  const streamCallbacks: StreamCallbacks = {
    onStart,
    onChunk,
    onComplete,
  };

  return stateful<
    { perspective: PerspectiveOfLlm; dispatch: Dispatch<Actuation> },
    LlmReactionState
  >({ ongoingCallId: null }, ({ context: ctx, state, setState }) => {
    const { perspective, dispatch } = ctx;

    // 如果有正在进行的调用，跳过
    if (state.ongoingCallId !== null) {
      return;
    }

    // 检查是否有新的用户消息或新完成的任务需要处理
    const hasNewMessages = hasNewUserMessages(perspective);
    const hasCompletedTasks = hasNewCompletedTasks(perspective);

    if (!hasNewMessages && !hasCompletedTasks) {
      return;
    }

    // 准备 LLM 调用
    const messageId = uuidv4();
    const timestamp = Date.now();
    const latestProceedTimestamp = getLatestProceedTimestamp(perspective);

    // 更新状态
    setState(() => ({ ongoingCallId: messageId }));

    // 构建 context 和 callbacks
    const context = buildLlmContext(perspective);
    const callbacks = createLlmCallbacks(
      messageId,
      timestamp,
      latestProceedTimestamp,
      dispatch,
      setState,
      streamCallbacks
    );

    // 异步调用 LLM
    // eslint-disable-next-line no-undef
    queueMicrotask(() => {
      Promise.resolve(callLlm(context, callbacks)).catch(() => {
        setState(() => ({ ongoingCallId: null }));
      });
    });
  });
}
