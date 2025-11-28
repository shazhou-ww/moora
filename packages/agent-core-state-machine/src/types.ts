// ============================================================================
// Agent State Machine 类型定义
// ============================================================================

// ============================================================================
// Agent State 相关类型
// ============================================================================

/**
 * Task 状态类型
 * 
 * - `running`: task 正在执行
 * - `pending`: task 在等待用户操作
 * - `cancelled`: task 被取消
 * - `completed`: task 完成
 */
export type AgentTaskStatus =
  | "running"
  | "pending"
  | "cancelled"
  | "completed";

/**
 * Agent Task
 * 
 * 表示 Agent 执行的一个任务，每个任务包含唯一标识、状态和简介。
 */
export type AgentTask = {
  /**
   * Task 唯一标识符
   */
  id: string;

  /**
   * Task 状态
   */
  status: AgentTaskStatus;

  /**
   * Task 简介（一句话简介）
   */
  summary: string;

  /**
   * Task 关联的请求 ID（如果有）
   */
  requestId?: string;
};

/**
 * Agent 内部状态
 * 
 * 这是 Agent 的完整状态表示，包含所有内部实现细节。
 * 前后端共用这个状态定义来保持同步。
 */
export type AgentState = {
  /**
   * 当前状态阶段
   */
  phase: "idle" | "processing" | "error";

  /**
   * 消息列表（内部格式）
   */
  messages: InternalMessage[];

  /**
   * Task 列表
   * 包含所有 Agent 执行的任务
   */
  tasks: AgentTask[];

  /**
   * 当前正在处理的请求 ID（如果有）
   */
  currentRequestId?: string;

  /**
   * LLM 调用历史
   */
  llmHistory: LLMCall[];

  /**
   * Tool 调用历史
   */
  toolHistory: ToolCall[];
};

/**
 * 内部消息格式
 */
export type InternalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /**
   * 是否正在流式输出中（仅 assistant 消息）
   */
  streaming?: boolean;
  /**
   * 关联的 Task ID 列表
   * 如果没有关联的 task，则为空数组
   */
  taskIds: string[];
};

/**
 * LLM 调用记录
 */
export type LLMCall = {
  id: string;
  requestId: string;
  timestamp: number;
  prompt: string;
  response?: string;
  error?: string;
};

/**
 * Tool 调用记录
 */
export type ToolCall = {
  id: string;
  requestId: string;
  timestamp: number;
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
};

// ============================================================================
// Agent Input 相关类型
// ============================================================================

/**
 * 用户消息输入
 */
export type UserMessageInput = {
  type: "user-message";
  requestId: string;
  content: string;
  /**
   * 关联的 Task ID 列表（作为 hint）
   * 提醒 Agent message 和哪些 task 相关
   * 如果没有关联的 task，则为空数组
   */
  taskHints: string[];
};

/**
 * LLM 调用开始输入
 */
export type LLMCallStartedInput = {
  type: "llm-call-started";
  requestId: string;
  callId: string;
  prompt: string;
};

/**
 * LLM 响应输入
 */
export type LLMResponseInput = {
  type: "llm-response";
  requestId: string;
  callId: string;
  response: string;
};

/**
 * LLM 错误输入
 */
export type LLMErrorInput = {
  type: "llm-error";
  requestId: string;
  callId: string;
  error: string;
};

/**
 * Tool 结果输入
 */
export type ToolResultInput = {
  type: "tool-result";
  requestId: string;
  callId: string;
  result: unknown;
};

/**
 * Tool 错误输入
 */
export type ToolErrorInput = {
  type: "tool-error";
  requestId: string;
  callId: string;
  error: string;
};

/**
 * 取消 Task 输入
 */
export type CancelTaskInput = {
  type: "cancel-task";
  taskId: string;
};

/**
 * 更新 Task 简介输入
 */
export type UpdateTaskSummaryInput = {
  type: "update-task-summary";
  taskId: string;
  summary: string;
};

/**
 * Task 创建输入
 */
export type TaskCreatedInput = {
  type: "task-created";
  taskId: string;
  requestId: string;
  summary: string;
};

/**
 * Task 状态更新输入
 */
export type TaskStatusUpdatedInput = {
  type: "task-status-updated";
  taskId: string;
  status: AgentTaskStatus;
};

/**
 * 消息关联 Task 输入
 */
export type MessageLinkedToTaskInput = {
  type: "message-linked-to-task";
  messageId: string;
  taskId: string;
};

/**
 * Agent 输入信号
 * 
 * 这些是 Agent 状态机可以接收的输入信号。
 */
export type AgentInput =
  | UserMessageInput
  | LLMCallStartedInput
  | LLMResponseInput
  | LLMErrorInput
  | ToolResultInput
  | ToolErrorInput
  | CancelTaskInput
  | UpdateTaskSummaryInput
  | TaskCreatedInput
  | TaskStatusUpdatedInput
  | MessageLinkedToTaskInput;

