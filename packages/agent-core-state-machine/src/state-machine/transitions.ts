// ============================================================================
// Agent State Transitions - 状态转换处理函数
// ============================================================================

import type {
  AgentState,
  InternalMessage,
  LLMCall,
  AgentTask,
  AgentTaskStatus,
  UserMessageInput,
  LLMCallStartedInput,
  LLMResponseInput,
  LLMErrorInput,
  ToolResultInput,
  ToolErrorInput,
  CancelTaskInput,
  UpdateTaskSummaryInput,
  TaskCreatedInput,
  TaskStatusUpdatedInput,
  MessageLinkedToTaskInput,
} from "../types";
import { initialAgentState } from "./state-machine";

/**
 * 处理用户消息输入
 * @internal
 */
export const handleUserMessage = (
  input: UserMessageInput,
  state: AgentState
): AgentState => {
  const newMessage: InternalMessage = {
    id: `msg-${Date.now()}-${Math.random()}`,
    role: "user",
    content: input.content,
    timestamp: Date.now(),
    taskIds: input.taskHints,
  };
  return {
    ...state,
    phase: "processing",
    messages: [...state.messages, newMessage],
    currentRequestId: input.requestId,
  };
};

/**
 * 处理 LLM 调用开始输入
 * @internal
 */
export const handleLLMCallStarted = (
  input: LLMCallStartedInput,
  state: AgentState
): AgentState => {
  if (input.requestId !== state.currentRequestId) {
    return state; // 忽略过期的调用
  }

  // 创建流式的 assistant 消息
  const assistantMessage: InternalMessage = {
    id: `msg-${Date.now()}-${Math.random()}`,
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    streaming: true,
    taskIds: [], // 将在后续通过 message-linked-to-task 输入关联
  };

  // 创建 LLM 调用历史记录
  const llmCall: LLMCall = {
    id: input.callId,
    requestId: input.requestId,
    timestamp: Date.now(),
    prompt: input.prompt,
  };

  return {
    ...state,
    messages: [...state.messages, assistantMessage],
    llmHistory: [...state.llmHistory, llmCall],
  };
};

/**
 * 处理 LLM 响应输入
 * @internal
 */
export const handleLLMResponse = (
  input: LLMResponseInput,
  state: AgentState
): AgentState => {
  if (input.requestId !== state.currentRequestId) {
    return state; // 忽略过期的响应
  }

  // 更新或创建 assistant 消息
  const existingAssistantIndex = state.messages.findIndex(
    (msg) => msg.role === "assistant" && msg.streaming
  );

  const existingMessage = existingAssistantIndex >= 0
    ? state.messages[existingAssistantIndex]!
    : null;
  const assistantMessage: InternalMessage = {
    id:
      existingMessage?.id ?? `msg-${Date.now()}-${Math.random()}`,
    role: "assistant",
    content: input.response,
    timestamp: Date.now(),
    streaming: false,
    taskIds: existingMessage?.taskIds ?? [],
  };

  const updatedMessages =
    existingAssistantIndex >= 0
      ? state.messages.map((msg, idx) =>
          idx === existingAssistantIndex ? assistantMessage : msg
        )
      : [...state.messages, assistantMessage];

  // 更新 LLM 历史记录（应该已经由 llm-call-started 创建）
  const existingLLMCallIndex = state.llmHistory.findIndex(
    (call) => call.id === input.callId
  );
  const updatedLLMHistory =
    existingLLMCallIndex >= 0
      ? state.llmHistory.map((call, idx) =>
          idx === existingLLMCallIndex
            ? { ...call, response: input.response }
            : call
        )
      : [
          // 如果记录不存在（异常情况），从最后一条用户消息获取 prompt
          ...state.llmHistory,
          {
            id: input.callId,
            requestId: input.requestId,
            timestamp: Date.now(),
            prompt:
              state.messages.find((msg) => msg.role === "user")?.content || "",
            response: input.response,
          },
        ];

  return {
    ...state,
    messages: updatedMessages,
    llmHistory: updatedLLMHistory,
    phase: "idle",
  };
};

/**
 * 处理 LLM 错误输入
 * @internal
 */
export const handleLLMError = (
  input: LLMErrorInput,
  state: AgentState
): AgentState => {
  if (input.requestId !== state.currentRequestId) {
    return state;
  }

  // 更新 LLM 历史记录（应该已经由 llm-call-started 创建）
  const existingLLMCallIndex = state.llmHistory.findIndex(
    (call) => call.id === input.callId
  );
  const updatedLLMHistory =
    existingLLMCallIndex >= 0
      ? state.llmHistory.map((call, idx) =>
          idx === existingLLMCallIndex ? { ...call, error: input.error } : call
        )
      : [
          // 如果记录不存在（异常情况），从最后一条用户消息获取 prompt
          ...state.llmHistory,
          {
            id: input.callId,
            requestId: input.requestId,
            timestamp: Date.now(),
            prompt:
              state.messages.find((msg) => msg.role === "user")?.content || "",
            error: input.error,
          },
        ];

  return {
    ...state,
    llmHistory: updatedLLMHistory,
    phase: "error",
  };
};

/**
 * 处理 Tool 结果输入
 * @internal
 */
export const handleToolResult = (
  input: ToolResultInput,
  state: AgentState
): AgentState => {
  if (input.requestId !== state.currentRequestId) {
    return state;
  }

  // 更新或创建 Tool 历史记录
  const existingToolCallIndex = state.toolHistory.findIndex(
    (call) => call.id === input.callId
  );
  const updatedToolHistory =
    existingToolCallIndex >= 0
      ? state.toolHistory.map((call, idx) =>
          idx === existingToolCallIndex
            ? { ...call, result: input.result }
            : call
        )
      : [
          ...state.toolHistory,
          {
            id: input.callId,
            requestId: input.requestId,
            timestamp: Date.now(),
            toolName: "", // 这个信息应该在 tool-call 时记录，这里先留空
            arguments: {},
            result: input.result,
          },
        ];

  return {
    ...state,
    toolHistory: updatedToolHistory,
  };
};

/**
 * 处理 Tool 错误输入
 * @internal
 */
export const handleToolError = (
  input: ToolErrorInput,
  state: AgentState
): AgentState => {
  if (input.requestId !== state.currentRequestId) {
    return state;
  }

  // 更新或创建 Tool 历史记录
  const existingToolCallIndex = state.toolHistory.findIndex(
    (call) => call.id === input.callId
  );
  const updatedToolHistory =
    existingToolCallIndex >= 0
      ? state.toolHistory.map((call, idx) =>
          idx === existingToolCallIndex
            ? { ...call, error: input.error }
            : call
        )
      : [
          ...state.toolHistory,
          {
            id: input.callId,
            requestId: input.requestId,
            timestamp: Date.now(),
            toolName: "", // 这个信息应该在 tool-call 时记录，这里先留空
            arguments: {},
            error: input.error,
          },
        ];

  return {
    ...state,
    toolHistory: updatedToolHistory,
    phase: "error",
  };
};

/**
 * 处理取消 Task 输入
 * @internal
 */
export const handleCancelTask = (
  input: CancelTaskInput,
  state: AgentState
): AgentState => {
  const updatedTasks = state.tasks.map((task) =>
    task.id === input.taskId
      ? { ...task, status: "cancelled" as AgentTaskStatus }
      : task
  );

  return {
    ...state,
    tasks: updatedTasks,
  };
};

/**
 * 处理更新 Task 简介输入
 * @internal
 */
export const handleUpdateTaskSummary = (
  input: UpdateTaskSummaryInput,
  state: AgentState
): AgentState => {
  const updatedTasks = state.tasks.map((task) =>
    task.id === input.taskId
      ? { ...task, summary: input.summary }
      : task
  );

  return {
    ...state,
    tasks: updatedTasks,
  };
};

/**
 * 处理 Task 创建输入
 * @internal
 */
export const handleTaskCreated = (
  input: TaskCreatedInput,
  state: AgentState
): AgentState => {
  const newTask: AgentTask = {
    id: input.taskId,
    status: "running",
    summary: input.summary,
    requestId: input.requestId,
  };

  return {
    ...state,
    tasks: [...state.tasks, newTask],
  };
};

/**
 * 处理 Task 状态更新输入
 * @internal
 */
export const handleTaskStatusUpdated = (
  input: TaskStatusUpdatedInput,
  state: AgentState
): AgentState => {
  const updatedTasks = state.tasks.map((task) =>
    task.id === input.taskId
      ? { ...task, status: input.status }
      : task
  );

  return {
    ...state,
    tasks: updatedTasks,
  };
};

/**
 * 处理消息关联 Task 输入
 * @internal
 */
export const handleMessageLinkedToTask = (
  input: MessageLinkedToTaskInput,
  state: AgentState
): AgentState => {
  const updatedMessages = state.messages.map((msg) =>
    msg.id === input.messageId
      ? { ...msg, taskIds: [...msg.taskIds, input.taskId] }
      : msg
  );

  return {
    ...state,
    messages: updatedMessages,
  };
};

