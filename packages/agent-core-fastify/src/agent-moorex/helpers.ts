// ============================================================================
// Agent Moorex 辅助函数
// ============================================================================

import type { Dispatch, EffectController } from "@moora/moorex";
import type { AgentInput } from "@moora/agent-core-state-machine";
import type { CallLLMEffect, CallToolEffect, Tool } from "../types";

/**
 * 创建 LLM 调用的 Effect 控制器
 * @internal
 */
export const createLLMEffectController = (
  effect: CallLLMEffect,
  callLLM: (options: {
    prompt: string;
    systemPrompt?: string;
    messageHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  }) => Promise<string>
): EffectController<AgentInput> => {
  let canceled = false;

  return {
    start: async (dispatch: Dispatch<AgentInput>) => {
      if (canceled) {
        return;
      }

      // 先分发 LLM 调用开始事件，创建流式消息
      dispatch({
        type: "llm-call-started",
        requestId: effect.requestId,
        callId: effect.callId,
        prompt: effect.prompt,
      });

      if (canceled) {
        return;
      }

      try {
        // 调用 LLM
        const response = await callLLM({
          prompt: effect.prompt,
          systemPrompt: effect.systemPrompt,
          messageHistory: effect.messageHistory,
        });

        if (canceled) {
          return;
        }

        // 分发 LLM 响应
        dispatch({
          type: "llm-response",
          requestId: effect.requestId,
          callId: effect.callId,
          response,
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        // 分发错误
        dispatch({
          type: "llm-error",
          requestId: effect.requestId,
          callId: effect.callId,
          error: error instanceof Error ? error.message : "Unknown error",
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
  tool: Tool | undefined
): EffectController<AgentInput> => {
  let canceled = false;

  if (!tool) {
    // Tool 不存在，立即分发错误
    return {
      start: async (dispatch: Dispatch<AgentInput>) => {
        dispatch({
          type: "tool-error",
          requestId: effect.requestId,
          callId: effect.callId,
          error: `Tool "${effect.toolName}" not found`,
        });
      },
      cancel: () => {
        canceled = true;
      },
    };
  }

  return {
    start: async (dispatch: Dispatch<AgentInput>) => {
      if (canceled) {
        return;
      }

      try {
        // 执行 Tool
        const result = await tool.execute(effect.arguments);

        if (canceled) {
          return;
        }

        // 分发 Tool 结果
        dispatch({
          type: "tool-result",
          requestId: effect.requestId,
          callId: effect.callId,
          result,
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        // 分发错误
        dispatch({
          type: "tool-error",
          requestId: effect.requestId,
          callId: effect.callId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    cancel: () => {
      canceled = true;
    },
  };
};

