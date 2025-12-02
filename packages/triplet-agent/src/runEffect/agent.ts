// ============================================================================
// Agent 节点的 makeRunEffectForAgent 函数
// ============================================================================

import type { Dispatch, EffectController } from "@moora/moorex";
import type {
  EffectOfAgent,
  MakeRunEffectForAgentOptions,
  StateForAgent,
} from "../types/effects";
import type { OutputFromAgent } from "../types/signal";
import type { Message } from "../types/signal";

/**
 * Agent 节点的 makeRunEffectForAgent 函数
 * 
 * 柯里化函数，接收 options，返回符合 MoorexDefinition 要求的 runEffect 函数。
 * 
 * @param options - 包含所有需要注入的依赖
 * @returns 符合 MoorexDefinition 要求的 runEffect 函数
 */
export function makeRunEffectForAgent(
  options: MakeRunEffectForAgentOptions
): (
  effect: EffectOfAgent,
  state: StateForAgent,
  key: string
) => EffectController<OutputFromAgent> {
  return (
    effect: EffectOfAgent,
    state: StateForAgent,
    key: string
  ): EffectController<OutputFromAgent> => {
    return {
      start: async (dispatch: Dispatch<OutputFromAgent>) => {
        // 获取工具名称列表
        const toolNames = await options.getToolNames();
        // 获取工具定义
        const tools = await options.getToolDefinitions(toolNames);

        // 构建 messages：包含 user messages 和 tool messages
        const messages: Message[] = [];

        // 添加用户消息
        for (const userMsg of state.userAgent.userMessages) {
          messages.push({
            id: userMsg.id,
            role: "user",
            content: userMsg.content,
            timestamp: userMsg.timestamp,
          });
        }

        // 将工具执行结果整合为 tool messages
        // 对于每个 tool result，需要添加两条消息：
        // 1. assistant 消息：模拟 assistant request for tool call
        // 2. tool 消息：工具执行结果（role: 'tool'）
        for (const toolResult of state.toolkitAgent.toolResults) {
          // 查找对应的 tool call 请求（从 pendingToolCalls 或已执行的 tool calls 中查找）
          // 如果找不到，使用 toolResult 中的信息来构建
          const toolCall = state.agentToolkit.pendingToolCalls.find(
            (tc) => tc.toolCallId === toolResult.toolCallId
          );

          // 1. 添加 assistant 消息：模拟 assistant request for tool call
          // 这条消息表示 assistant 请求调用工具
          const assistantMessageId = `assistant-tool-call-${toolResult.toolCallId}`;
          const toolCallContent = toolCall
            ? `Tool call: ${toolResult.toolName}(${toolCall.parameters})`
            : `Tool call: ${toolResult.toolName} (toolCallId: ${toolResult.toolCallId})`;
          messages.push({
            id: assistantMessageId,
            role: "assistant",
            content: toolCallContent,
            timestamp: toolResult.timestamp - 1, // 确保在 tool 消息之前
          });

          // 2. 添加 tool 消息：工具执行结果（role: 'tool'）
          if (toolResult.isSuccess) {
            messages.push({
              id: `tool-${toolResult.toolCallId}`,
              role: "tool",
              content: toolResult.result,
              timestamp: toolResult.timestamp,
            });
          } else {
            messages.push({
              id: `tool-error-${toolResult.toolCallId}`,
              role: "tool",
              content: `Error: ${toolResult.error}`,
              timestamp: toolResult.timestamp,
            });
          }
        }

        // 调用 LLM API
        const response = await options.callLLM(options.prompt, tools, messages);

        // 收集处理了哪些用户消息和工具结果（用于跟踪处理进度）
        const processedUserMessageIds = state.userAgent.userMessages.map(
          (msg) => msg.id
        );
        const processedToolResultIds = state.toolkitAgent.toolResults.map(
          (result) => result.toolCallId
        );

        // 根据响应 dispatch 相应的 Output
        if (response.type === "toolCall") {
          dispatch({
            type: "callTool",
            toolCallId: response.toolCallId,
            toolName: response.toolName,
            parameters: response.parameters,
          });
        } else {
          // 流式输出消息
          const messageId = response.messageId;
          let isFirstChunk = true;
          for await (const chunk of response.chunks) {
            dispatch({
              type: "sendChunk",
              messageId,
              chunk,
              // 只在第一个 chunk 时记录处理信息，避免重复
              processedUserMessageIds: isFirstChunk
                ? processedUserMessageIds
                : undefined,
              processedToolResultIds: isFirstChunk
                ? processedToolResultIds
                : undefined,
            });
            isFirstChunk = false;
          }
          dispatch({
            type: "completeMessage",
            messageId,
            // 如果之前没有记录，在 completeMessage 时记录
            processedUserMessageIds:
              processedUserMessageIds.length > 0
                ? processedUserMessageIds
                : undefined,
            processedToolResultIds:
              processedToolResultIds.length > 0
                ? processedToolResultIds
                : undefined,
          });
        }
      },
      cancel: () => {
        // 取消 LLM 调用（如果需要）
      },
    };
  };
}

