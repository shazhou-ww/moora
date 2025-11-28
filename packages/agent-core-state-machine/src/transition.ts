// ============================================================================
// Agent State Machine - Transition Functions
// ============================================================================

import { create } from "mutative";
import type { AgentState } from "./state";
import type { AgentInput } from "./input";

/**
 * 处理用户消息输入
 *
 * @internal
 */
const handleUserMessage = (
  input: Extract<AgentInput, { type: "user-message" }>,
  state: AgentState,
  expandContextWindowSize: number
): AgentState => {
  // 检查消息 ID 是否已存在
  const existingIndex = state.messages.findIndex(
    (msg) => msg.id === input.messageId
  );

  if (existingIndex >= 0) {
    console.warn(
      `[AgentStateMachine] Ignoring user message with duplicate ID: ${input.messageId}`
    );
    return state;
  }

  // 检查时间戳是否大于最后一条消息的时间戳
  if (state.messages.length > 0) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && input.timestamp <= lastMessage.timestamp) {
      console.warn(
        `[AgentStateMachine] Ignoring user message with invalid timestamp: messageId=${input.messageId}, timestamp=${input.timestamp}, lastMessageTimestamp=${lastMessage.timestamp}`
      );
      return state;
    }
  }

  return create(state, (draft) => {
    const newMessage = {
      id: input.messageId,
      role: "user" as const,
      content: input.content,
      timestamp: input.timestamp,
      taskIds: [] as string[],
    };

    // 添加新消息（由于已验证时间戳，直接 push 到末尾即可）
    draft.messages.push(newMessage);

    // 自动扩展 context window 以确保新消息包含在上下文中
    // 如果当前 contextWindowSize 小于消息总数，扩展它
    if (draft.reactContext.contextWindowSize < draft.messages.length) {
      draft.reactContext.contextWindowSize = Math.min(
        draft.reactContext.contextWindowSize + expandContextWindowSize,
        draft.messages.length
      );
    }
  });
};

/**
 * 处理 LLM Chunk 输入
 *
 * @internal
 */
const handleLlmChunk = (
  input: Extract<AgentInput, { type: "llm-chunk" }>,
  state: AgentState
): AgentState => {
  return create(state, (draft) => {
    const existingIndex = draft.messages.findIndex(
      (msg) => msg.id === input.messageId
    );

    if (existingIndex >= 0) {
      const existingMessage = draft.messages[existingIndex];
      if (existingMessage && existingMessage.role === "assistant") {
        // 更新现有助手消息的内容
        draft.messages[existingIndex] = {
          ...existingMessage,
          content: existingMessage.content + input.chunk,
          streaming: true,
        };
      }
    } else {
      // 创建新的助手消息
      const timestamp = Date.now();
      const newMessage = {
        id: input.messageId,
        role: "assistant" as const,
        content: input.chunk,
        timestamp,
        streaming: true,
        taskIds: [] as string[],
      };

      // 保持按时间戳排序
      const insertIndex = draft.messages.findIndex(
        (msg) => msg.timestamp > timestamp
      );
      if (insertIndex >= 0) {
        draft.messages.splice(insertIndex, 0, newMessage);
      } else {
        draft.messages.push(newMessage);
      }
    }
  });
};

/**
 * 处理 LLM 消息完成输入
 *
 * @internal
 */
const handleLlmMessageComplete = (
  input: Extract<AgentInput, { type: "llm-message-complete" }>,
  state: AgentState
): AgentState => {
  return create(state, (draft) => {
    const existingIndex = draft.messages.findIndex(
      (msg) => msg.id === input.messageId
    );

    if (existingIndex >= 0) {
      const existingMessage = draft.messages[existingIndex];
      if (existingMessage && existingMessage.role === "assistant") {
        // 标记消息不再流式输出
        draft.messages[existingIndex] = {
          ...existingMessage,
          streaming: false,
        };
      }
    }
  });
};

/**
 * 处理 Tool Call 开始输入
 *
 * @internal
 */
const handleToolCallStarted = (
  input: Extract<AgentInput, { type: "tool-call-started" }>,
  state: AgentState
): AgentState => {
  return create(state, (draft) => {
    // 创建 Tool Call 记录
    draft.toolCalls[input.toolCallId] = {
      name: input.name,
      parameters: input.parameters,
      timestamp: input.timestamp,
      result: null,
    };

    // 将 Tool Call 添加到当前 ReAct Loop 上下文
    if (!draft.reactContext.toolCallIds.includes(input.toolCallId)) {
      draft.reactContext.toolCallIds.push(input.toolCallId);
    }
  });
};

/**
 * 处理 Tool Call 结果输入
 *
 * @internal
 */
const handleToolCallResult = (
  input: Extract<AgentInput, { type: "tool-call-result" }>,
  state: AgentState
): AgentState => {
  return create(state, (draft) => {
    const existingToolCall = draft.toolCalls[input.toolCallId];

    if (existingToolCall) {
      // 更新 Tool Call 记录的结果
      draft.toolCalls[input.toolCallId] = {
        ...existingToolCall,
        result: input.result,
      };
    }
  });
};

/**
 * 处理扩展上下文窗口输入
 *
 * @internal
 */
const handleExpandContextWindow = (
  input: Extract<AgentInput, { type: "expand-context-window" }>,
  state: AgentState,
  expandContextWindowSize: number
): AgentState => {
  return create(state, (draft) => {
    // 增加上下文窗口大小
    draft.reactContext.contextWindowSize += expandContextWindowSize;
    // 限制为不超过实际消息数量
    draft.reactContext.contextWindowSize = Math.min(
      draft.reactContext.contextWindowSize,
      draft.messages.length
    );
  });
};

/**
 * 处理加载历史 ToolCall 结果到上下文输入
 *
 * @internal
 */
const handleAddToolCallsToContext = (
  input: Extract<AgentInput, { type: "add-tool-calls-to-context" }>,
  state: AgentState
): AgentState => {
  return create(state, (draft) => {
    // 将 Tool Call ID 添加到当前 ReAct Loop 上下文
    for (const toolCallId of input.toolCallIds) {
      if (!draft.reactContext.toolCallIds.includes(toolCallId)) {
        draft.reactContext.toolCallIds.push(toolCallId);
      }
    }
  });
};

/**
 * Agent 状态转换函数
 *
 * @param input - 输入信号（AgentInput）
 * @param options - 可选配置
 * @param options.initialContextWindowSize - 初始上下文窗口大小，默认为 10
 * @param options.expandContextWindowSize - 每次扩展上下文窗口的增量，默认为 10
 * @returns 状态转换函数
 *
 * @example
 * ```typescript
 * const transition = agentTransition(
 *   {
 *     type: "user-message",
 *     messageId: "msg-1",
 *     content: "Hello",
 *     timestamp: Date.now(),
 *   },
 *   {
 *     initialContextWindowSize: 20,
 *     expandContextWindowSize: 5,
 *   }
 * );
 *
 * const newState = transition(currentState);
 * ```
 */
export function agentTransition(
  input: AgentInput,
  options?: {
    initialContextWindowSize?: number;
    expandContextWindowSize?: number;
  }
) {
  const expandContextWindowSize = options?.expandContextWindowSize ?? 10;

  return (state: AgentState): AgentState => {
    switch (input.type) {
      case "user-message":
        return handleUserMessage(input, state, expandContextWindowSize);
      case "llm-chunk":
        return handleLlmChunk(input, state);
      case "llm-message-complete":
        return handleLlmMessageComplete(input, state);
      case "tool-call-started":
        return handleToolCallStarted(input, state);
      case "tool-call-result":
        return handleToolCallResult(input, state);
      case "expand-context-window":
        return handleExpandContextWindow(input, state, expandContextWindowSize);
      case "add-tool-calls-to-context":
        return handleAddToolCallsToContext(input, state);
      default:
        // 确保所有 case 都被处理
        const _exhaustive: never = input;
        return state;
    }
  };
}

