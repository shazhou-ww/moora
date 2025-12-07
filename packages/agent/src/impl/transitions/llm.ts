/**
 * Llm Actor 的 Transition 函数实现
 */

import type { StateOfLlm } from "@/decl/states";
import type {
  InputFromLlm,
  StartAssiMessageStream,
  EndAssiMessageStream,
  RequestToolCall,
} from "@/decl/inputs";

/**
 * Llm Actor 的状态转换函数
 *
 * 根据 Input 更新 Llm 的状态。
 * 这是一个纯函数，不产生副作用。
 *
 * @param input - Llm 的输入
 * @returns 状态转换函数
 */
export function transitionLlm(
  input: InputFromLlm
): (state: StateOfLlm) => StateOfLlm {
  return (state: StateOfLlm) => {
    if (input.type === "start-assi-message-stream") {
      return transitionLlmStartStream(input)(state);
    }
    if (input.type === "end-assi-message-stream") {
      return transitionLlmEndStream(input)(state);
    }
    if (input.type === "request-tool-call") {
      return transitionLlmRequestToolCall(input)(state);
    }
    return state;
  };
}

/**
 * 处理开始流式生成助手消息的转换
 *
 * 确保 cutOff 只增不减，防止异步 dispatch 导致的时序问题
 */
function transitionLlmStartStream(
  input: StartAssiMessageStream
): (state: StateOfLlm) => StateOfLlm {
  return (state: StateOfLlm) => {
    return {
      ...state,
      assiMessages: [
        ...state.assiMessages,
        {
          id: input.id,
          timestamp: input.timestamp,
          role: "assistant",
          streaming: true,
        },
      ],
      // 确保 cutOff 只增不减，防止异步 dispatch 导致的时序问题
      cutOff: Math.max(state.cutOff, input.cutOff),
    };
  };
}

/**
 * 处理结束流式生成助手消息的转换
 *
 * 保留 start stream 时的时间戳，不使用 end stream 的时间戳
 * 显式保留 cutOff，防止异步 dispatch 导致的时序问题导致 cutOff 被回退
 */
function transitionLlmEndStream(
  input: EndAssiMessageStream
): (state: StateOfLlm) => StateOfLlm {
  return (state: StateOfLlm) => {
    // 找到对应的消息并更新
    const originalMessage = state.assiMessages.find(
      (msg) => msg.id === input.id
    );

    if (!originalMessage) {
      // 如果找不到消息，可能是状态不一致，返回原状态
      return state;
    }

    // 更新消息，保留原来的 timestamp（start stream 的时间）
    const updatedMessages = state.assiMessages.map((msg) => {
      if (msg.id === input.id) {
        return {
          id: input.id,
          timestamp: originalMessage.timestamp, // 保留 start stream 的时间戳
          role: "assistant" as const,
          streaming: false as const,
          content: input.content,
        };
      }
      return msg;
    });

    return {
      ...state,
      assiMessages: updatedMessages,
      // 显式保留 cutOff，防止异步 dispatch 导致的时序问题导致 cutOff 被回退
      cutOff: state.cutOff,
    };
  };
}

/**
 * 处理工具调用请求的转换
 *
 * 同时更新 cutOff，确保只有 tool_calls 时也能正确更新 cutOff
 */
function transitionLlmRequestToolCall(
  input: RequestToolCall
): (state: StateOfLlm) => StateOfLlm {
  return (state: StateOfLlm) => {
    return {
      ...state,
      toolCallRequests: [
        ...state.toolCallRequests,
        {
          toolCallId: input.toolCallId,
          name: input.name,
          arguments: input.arguments,
          timestamp: input.timestamp,
        },
      ],
      // 确保 cutOff 只增不减
      cutOff: Math.max(state.cutOff, input.cutOff),
    };
  };
}
