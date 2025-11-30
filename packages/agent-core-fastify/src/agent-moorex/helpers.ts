// ============================================================================
// Agent Moorex 辅助函数
// ============================================================================

import type { Dispatch, EffectController } from "@moora/moorex";
import type { AgentInput, AgentState } from "@moora/agent-core-state-machine";
import type {
  CallLlmEffect,
  CallLlmFn,
  CallToolEffect,
  Tool,
  CallLlmResult,
  CallLlmCompleteResult,
} from "../types";
import { findPendingUserMessageIndex } from "./message-selectors";

/**
 * 创建 LLM 调用的 Effect 控制器
 * @internal
 */
export const createLLMEffectController = (
  effect: CallLlmEffect,
  state: AgentState,
  callLLM: CallLlmFn
): EffectController<AgentInput> => {
  let canceled = false;

  return {
    start: async (dispatch: Dispatch<AgentInput>) => {
      if (canceled) {
        return;
      }

      // 从 state 中获取 reActContext
      if (!state.reActContext) {
        return;
      }

      const { reActContext } = state;
      const pendingUserIndex = findPendingUserMessageIndex(state.messages);
      const pendingUserMessage =
        pendingUserIndex === -1 ? null : state.messages[pendingUserIndex];

      if (!pendingUserMessage) {
        return;
      }

      let lastTimestamp = state.updatedAt;
      const nextTimestamp = () => {
        const now = Date.now();
        if (now <= lastTimestamp) {
          lastTimestamp += 1;
          return lastTimestamp;
        }
        lastTimestamp = now;
        return lastTimestamp;
      };
      const calledLlmAt = nextTimestamp();

      try {
        const result = await callLLM({
          prompt: pendingUserMessage.content,
          messages: state.messages,
          toolCalls: state.toolCalls,
          tools: state.tools,
        });

        if (canceled) {
          return;
        }

        processCallLlmResult({
          result,
          dispatch,
          nextTimestamp,
          messageId: `msg-${reActContext.updatedAt}`,
          calledLlmAt,
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        handleCallLlmError({
          error,
          dispatch,
          nextTimestamp,
          messageId: `msg-${reActContext.updatedAt}`,
          calledLlmAt,
        });
      }
    },
    cancel: () => {
      canceled = true;
    },
  };
};

type DispatchDependencies = {
  dispatch: Dispatch<AgentInput>;
  nextTimestamp: () => number;
  messageId: string;
};

const processCallLlmResult = ({
  result,
  dispatch,
  nextTimestamp,
  messageId,
  calledLlmAt,
}: {
  result: CallLlmResult;
  calledLlmAt: number;
} & DispatchDependencies) => {
  if (isCompleteReActResult(result)) {
    dispatch({
      type: "llm-message-started",
      messageId,
      timestamp: nextTimestamp(),
    });

    dispatch({
      type: "llm-message-completed",
      messageId,
      content: result.response,
      timestamp: nextTimestamp(),
    });
  }

  dispatch({
    type: "re-act-observed",
    observation: result.observation,
    calledLlmAt,
    timestamp: nextTimestamp(),
  });
};

const handleCallLlmError = ({
  error,
  dispatch,
  nextTimestamp,
  messageId,
  calledLlmAt,
}: DispatchDependencies & { error: unknown; calledLlmAt: number }) => {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error";

  dispatch({
    type: "llm-message-started",
    messageId,
    timestamp: nextTimestamp(),
  });

  dispatch({
    type: "llm-message-completed",
    messageId,
    content: `Error: ${errorMessage}`,
    timestamp: nextTimestamp(),
  });

  dispatch({
    type: "re-act-observed",
    observation: {
      type: "complete-re-act",
    },
    calledLlmAt,
    timestamp: nextTimestamp(),
  });
};

const isCompleteReActResult = (
  result: CallLlmResult
): result is CallLlmCompleteResult =>
  result.observation.type === "complete-re-act";

/**
 * 创建 Tool 调用的 Effect 控制器
 * @internal
 */
export const createToolEffectController = (
  effect: CallToolEffect,
  state: AgentState,
  tools: Record<string, Tool>
): EffectController<AgentInput> => {
  let canceled = false;

  return {
    start: async (dispatch: Dispatch<AgentInput>) => {
      if (canceled) {
        return;
      }

      let lastTimestamp = state.updatedAt;
      const nextTimestamp = () => {
        const now = Date.now();
        if (now <= lastTimestamp) {
          lastTimestamp += 1;
          return lastTimestamp;
        }
        lastTimestamp = now;
        return lastTimestamp;
      };

      // 从 state 中获取 toolCall 信息
      const toolCall = state.toolCalls[effect.toolCallId];

      if (!toolCall) {
        // Tool Call 记录不存在，分发错误结果
        const timestamp = nextTimestamp();
        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: false,
            error: `Tool call "${effect.toolCallId}" not found in state`,
            receivedAt: timestamp,
          },
          timestamp,
        });
        return;
      }

      // 获取对应的 Tool
      const tool = tools[toolCall.name];

      if (!tool) {
        // Tool 不存在，立即分发错误结果
        const timestamp = nextTimestamp();
        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: false,
            error: `Tool "${toolCall.name}" not found`,
            receivedAt: timestamp,
          },
          timestamp,
        });
        return;
      }

      if (canceled) {
        return;
      }

      try {
        // 执行 Tool
        const args = JSON.parse(toolCall.parameters);
        const result = await tool.execute(args);

        if (canceled) {
          return;
        }

        // 分发 Tool 结果（成功）
        const timestamp = nextTimestamp();
        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: true,
            content: typeof result === "string" ? result : JSON.stringify(result),
            receivedAt: timestamp,
          },
          timestamp,
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        // 分发错误结果
        const timestamp = nextTimestamp();
        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: false,
            error: error instanceof Error ? error.message : "Unknown error",
            receivedAt: timestamp,
          },
          timestamp,
        });
      }
    },
    cancel: () => {
      canceled = true;
    },
  };
};

