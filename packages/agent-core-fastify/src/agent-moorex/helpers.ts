// ============================================================================
// Agent Moorex 辅助函数
// ============================================================================

import type { Dispatch, EffectController } from "@moora/moorex";
import type { AgentInput, AgentState } from "@moora/agent-core-state-machine";
import type { CallLlmEffect, CallLlmFn, CallToolEffect, Tool } from "../types";
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

      // 生成消息 ID
      const messageId = `msg-${reActContext.updatedAt}`;

      // 发送 LLM 消息开始事件
      dispatch({
        type: "llm-message-started",
        messageId,
        timestamp: Date.now(),
      });

      if (canceled) {
        return;
      }

      try {
        // 调用 LLM
        const response = await callLLM({
          prompt: pendingUserMessage.content,
          messages: state.messages,
          toolCalls: state.toolCalls,
          tools: state.tools,
        });

        if (canceled) {
          return;
        }

        // 发送 LLM 消息完成事件，带上完整的 content
        dispatch({
          type: "llm-message-completed",
          messageId,
          content: response,
          timestamp: Date.now(),
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        // 对于错误情况，发送包含错误信息的完成事件
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        dispatch({
          type: "llm-message-completed",
          messageId,
          content: `Error: ${errorMessage}`,
          timestamp: Date.now(),
        });
      }
    },
    cancel: () => {
      canceled = true;
    },
  };
};

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

      // 从 state 中获取 toolCall 信息
      const toolCall = state.toolCalls[effect.toolCallId];

      if (!toolCall) {
        // Tool Call 记录不存在，分发错误结果
        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: false,
            error: `Tool call "${effect.toolCallId}" not found in state`,
            receivedAt: Date.now(),
          },
          timestamp: Date.now(),
        });
        return;
      }

      // 获取对应的 Tool
      const tool = tools[toolCall.name];

      if (!tool) {
        // Tool 不存在，立即分发错误结果
        dispatch({
          type: "tool-call-started",
          toolCallId: effect.toolCallId,
          name: toolCall.name,
          parameters: toolCall.parameters,
          timestamp: Date.now(),
        });

        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: false,
            error: `Tool "${toolCall.name}" not found`,
            receivedAt: Date.now(),
          },
          timestamp: Date.now(),
        });
        return;
      }

      // 分发 Tool Call 开始事件
      dispatch({
        type: "tool-call-started",
        toolCallId: effect.toolCallId,
        name: toolCall.name,
        parameters: toolCall.parameters,
        timestamp: Date.now(),
      });

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
        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: true,
            content: typeof result === "string" ? result : JSON.stringify(result),
            receivedAt: Date.now(),
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        // 分发错误结果
        dispatch({
          type: "tool-call-completed",
          toolCallId: effect.toolCallId,
          result: {
            isSuccess: false,
            error: error instanceof Error ? error.message : "Unknown error",
            receivedAt: Date.now(),
          },
          timestamp: Date.now(),
        });
      }
    },
    cancel: () => {
      canceled = true;
    },
  };
};

