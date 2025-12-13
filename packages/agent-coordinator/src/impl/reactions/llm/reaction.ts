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

import type {
  LLM,
  ReactionFnOf,
  PerspectiveOfLlm,
  CallLlm,
  Actuation,
} from "../../../decl";
import { buildLlmContext } from "./context";
import { parseCoordinatorPseudoToolCall } from "./pseudo-tools";

// ============================================================================
// 类型定义
// ============================================================================

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
 * 获取最新的用户消息时间戳
 */
function getLatestUserMessageTimestamp(perspective: PerspectiveOfLlm): number {
  const { userMessages } = perspective;
  return Math.max(0, ...userMessages.map((m) => m.timestamp));
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
 * 创建 LLM 回调函数
 */
function createLlmCallbacks(
  messageId: string,
  timestamp: number,
  latestUserMessageTimestamp: number,
  dispatch: Dispatch<Actuation>,
  setState: (fn: () => LlmReactionState) => void
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
          llmProceedCutOff: latestUserMessageTimestamp,
        });
      }
      return messageId;
    },
    onChunk: () => {
      // Coordinator 不需要流式输出
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
 * 1. 检测新的用户消息，调用 LLM 生成响应
 * 2. 通过伪工具让 LLM 管理 workforce 任务
 */
export function createLlmReaction(
  deps: LlmReactionDeps
): ReactionFnOf<typeof LLM> {
  const { callLlm } = deps;

  return stateful<
    { perspective: PerspectiveOfLlm; dispatch: Dispatch<Actuation> },
    LlmReactionState
  >({ ongoingCallId: null }, ({ context: ctx, state, setState }) => {
    const { perspective, dispatch } = ctx;

    // 如果有正在进行的调用，跳过
    if (state.ongoingCallId !== null) {
      return;
    }

    // 检查是否有新的用户消息需要处理
    if (!hasNewUserMessages(perspective)) {
      return;
    }

    // 准备 LLM 调用
    const messageId = uuidv4();
    const timestamp = Date.now();
    const latestUserMessageTimestamp = getLatestUserMessageTimestamp(perspective);

    // 更新状态
    setState(() => ({ ongoingCallId: messageId }));

    // 构建 context 和 callbacks
    const context = buildLlmContext(perspective);
    const callbacks = createLlmCallbacks(
      messageId,
      timestamp,
      latestUserMessageTimestamp,
      dispatch,
      setState
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
