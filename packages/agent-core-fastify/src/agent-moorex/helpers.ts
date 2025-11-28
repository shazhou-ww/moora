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

      // 生成消息 ID
      const messageId = `msg-${effect.callId}`;

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

        // 将响应作为单个 chunk 发送
        // 注意：如果 LLM 支持流式输出，可以在这里逐字符或逐块发送
        dispatch({
          type: "llm-chunk",
          messageId,
          chunk: response,
        });

        if (canceled) {
          return;
        }

        // 标记消息完成
        dispatch({
          type: "llm-message-complete",
          messageId,
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        // 对于错误情况，我们通过发送一个包含错误信息的 chunk 来处理
        // 然后标记为完成
        const messageId = `msg-${effect.callId}`;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        dispatch({
          type: "llm-chunk",
          messageId,
          chunk: `Error: ${errorMessage}`,
        });

        if (canceled) {
          return;
        }

        dispatch({
          type: "llm-message-complete",
          messageId,
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
    // Tool 不存在，立即分发错误结果
    return {
      start: async (dispatch: Dispatch<AgentInput>) => {
        dispatch({
          type: "tool-call-started",
          toolCallId: effect.callId,
          name: effect.toolName,
          parameters: effect.parameter,
          timestamp: Date.now(),
        });

        dispatch({
          type: "tool-call-result",
          toolCallId: effect.callId,
          result: {
            isSuccess: false,
            error: `Tool "${effect.toolName}" not found`,
          },
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

      // 分发 Tool Call 开始事件
      dispatch({
        type: "tool-call-started",
        toolCallId: effect.callId,
        name: effect.toolName,
        parameters: effect.parameter,
        timestamp: Date.now(),
      });

      if (canceled) {
        return;
      }

      try {
        // 执行 Tool
        const args = JSON.parse(effect.parameter);
        const result = await tool.execute(args);

        if (canceled) {
          return;
        }

        // 分发 Tool 结果（成功）
        dispatch({
          type: "tool-call-result",
          toolCallId: effect.callId,
          result: {
            isSuccess: true,
            content: typeof result === "string" ? result : JSON.stringify(result),
          },
        });
      } catch (error) {
        if (canceled) {
          return;
        }

        // 分发错误结果
        dispatch({
          type: "tool-call-result",
          toolCallId: effect.callId,
          result: {
            isSuccess: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    },
    cancel: () => {
      canceled = true;
    },
  };
};

