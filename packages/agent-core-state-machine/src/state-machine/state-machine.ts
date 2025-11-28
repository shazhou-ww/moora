// ============================================================================
// Agent State Machine - 前后端共用的状态机定义
// ============================================================================

import type { StateMachine } from "@moora/moorex";
import type { AgentState, AgentInput } from "../types";
import {
  handleUserMessage,
  handleLLMCallStarted,
  handleLLMResponse,
  handleLLMError,
  handleToolResult,
  handleToolError,
  handleCancelTask,
  handleUpdateTaskSummary,
  handleTaskCreated,
  handleTaskStatusUpdated,
  handleMessageLinkedToTask,
} from "./transitions";

/**
 * Agent 状态机的初始状态
 */
export const initialAgentState = (): AgentState => ({
  phase: "idle",
  messages: [],
  tasks: [],
  llmHistory: [],
  toolHistory: [],
});

/**
 * Agent 状态转换函数
 * 
 * @param input - 输入信号
 * @returns 状态转换函数
 */
export const agentTransition = (input: AgentInput) => (state: AgentState): AgentState => {
  switch (input.type) {
    case "user-message":
      return handleUserMessage(input, state);
    case "llm-call-started":
      return handleLLMCallStarted(input, state);
    case "llm-response":
      return handleLLMResponse(input, state);
    case "llm-error":
      return handleLLMError(input, state);
    case "tool-result":
      return handleToolResult(input, state);
    case "tool-error":
      return handleToolError(input, state);
    case "cancel-task":
      return handleCancelTask(input, state);
    case "update-task-summary":
      return handleUpdateTaskSummary(input, state);
    case "task-created":
      return handleTaskCreated(input, state);
    case "task-status-updated":
      return handleTaskStatusUpdated(input, state);
    case "message-linked-to-task":
      return handleMessageLinkedToTask(input, state);
    default:
      return state;
  }
};

/**
 * Agent 状态机定义
 */
export const agentStateMachine: StateMachine<AgentInput, AgentState> = {
  initial: initialAgentState,
  transition: agentTransition,
};

