// ============================================================================
// Agent Core State Machine 导出
// ============================================================================

/**
 * Agent Core State Machine
 * 
 * 提供 Agent 的状态机定义，包括：
 * - Agent State: 内部状态类型
 * - Agent Input: 状态机输入信号类型
 * - Agent State Machine: 状态机实现
 */

// ============================================================================
// 导出所有类型
// ============================================================================
export type {
  // Agent State 相关
  AgentState,
  InternalMessage,
  LLMCall,
  ToolCall,
  AgentTask,
  AgentTaskStatus,
  // Agent Input 相关
  AgentInput,
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
} from "./types";

// ============================================================================
// 导出 State Machine
// ============================================================================
export {
  initialAgentState,
  agentTransition,
  agentStateMachine,
} from "./state-machine";

