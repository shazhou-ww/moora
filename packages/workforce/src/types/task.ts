/**
 * Task 相关类型定义
 */

import type { Unsubscribe } from "@moora/pub-sub";
import type { Worldscape } from "@moora/agent-worker";

// ============================================================================
// 基础类型
// ============================================================================

/**
 * Task ID 类型，使用 UUID 格式
 */
export type TaskId = string;

/**
 * Message ID 类型
 */
export type MessageId = string;

/**
 * 根任务 ID，固定为全 0 的 UUID
 */
export const ROOT_TASK_ID: TaskId = "00000000-0000-0000-0000-000000000000";

// ============================================================================
// Task 状态相关类型
// ============================================================================

/**
 * Task 状态
 *
 * - ready: 就绪，等待被调度执行
 * - pending: 等待子任务完成
 * - processing: 正在被 agent 处理
 * - succeeded: 成功完成
 * - failed: 失败退出
 */
export type TaskStatus = "ready" | "pending" | "processing" | "succeeded" | "failed";

/**
 * Task 成功结果
 */
export type TaskSuccessResult = {
  success: true;
  conclusion: string;
};

/**
 * Task 失败结果
 */
export type TaskFailureResult = {
  success: false;
  error: string;
};

/**
 * Task 结果（成功或失败）
 */
export type TaskResult = TaskSuccessResult | TaskFailureResult;

// ============================================================================
// Task 定义
// ============================================================================

/**
 * 创建 Task 的输入参数
 */
export type TaskInput = {
  /** 任务唯一 ID（UUID 格式），由调用方提供 */
  id: TaskId;
  /** 任务简短标题 */
  title: string;
  /** 任务详细目标需求 */
  goal: string;
  /** 父任务 ID */
  parentId: TaskId;
};

/**
 * Task 运行时数据
 *
 * 包含任务的基本信息和 Worker Agent 的 Worldscape
 */
export type TaskRuntimeData = {
  /** 任务唯一 ID */
  readonly id: TaskId;
  /** 任务简短标题 */
  readonly title: string;
  /** 任务详细目标需求 */
  readonly goal: string;
  /** 父任务 ID */
  readonly parentId: TaskId;
  /**
   * Worker Agent 的 Worldscape
   *
   * 包含 userMessages, assiMessages, toolCallRequests, toolResults 等
   */
  worldscape: Worldscape;
};

/**
 * Task 运行时状态
 *
 * 包含任务的状态信息和时间戳
 */
export type TaskRuntimeStatus = {
  /** 任务唯一 ID */
  readonly id: TaskId;
  /** 当前状态 */
  status: TaskStatus;
  /** 任务结果（仅当 status 为 succeeded 或 failed 时有效） */
  result?: TaskResult;
  /** 创建时间戳 */
  createdAt: number;
  /** 状态最近一次变化的时间戳 */
  updatedAt: number;
};

/**
 * 完整的 Task 信息
 */
export type Task = TaskRuntimeData & TaskRuntimeStatus;

// ============================================================================
// Task 事件类型
// ============================================================================

/**
 * Task 创建事件
 */
export type TaskCreatedEvent = {
  type: "task-created";
  task: TaskInput;
  timestamp: number;
};

/**
 * Task 开始执行事件
 */
export type TaskStartedEvent = {
  type: "task-started";
  taskId: TaskId;
  timestamp: number;
};

/**
 * Task 追加消息事件
 */
export type TaskMessageAppendedEvent = {
  type: "task-message-appended";
  taskId: TaskId;
  messageId: MessageId;
  content: string;
  timestamp: number;
};

/**
 * Task 取消事件
 */
export type TaskCancelledEvent = {
  type: "task-cancelled";
  taskId: TaskId;
  timestamp: number;
};

/**
 * Task 成功完成事件
 */
export type TaskSucceededEvent = {
  type: "task-succeeded";
  taskId: TaskId;
  conclusion: string;
  timestamp: number;
};

/**
 * Task 失败退出事件
 */
export type TaskFailedEvent = {
  type: "task-failed";
  taskId: TaskId;
  error: string;
  timestamp: number;
};

/**
 * Task 事件联合类型
 */
export type TaskEvent =
  | TaskCreatedEvent
  | TaskStartedEvent
  | TaskMessageAppendedEvent
  | TaskCancelledEvent
  | TaskSucceededEvent
  | TaskFailedEvent;

// ============================================================================
// Task 详情事件类型（Worker Agent 执行过程中的事件）
// ============================================================================

/**
 * 收到用户消息事件（包括初始目标）
 */
export type TaskDetailUserMessageEvent = {
  type: "task-detail-user-message";
  taskId: TaskId;
  messageId: MessageId;
  content: string;
  timestamp: number;
};

/**
 * Worker Agent 流式输出 chunk 事件
 */
export type TaskDetailStreamChunkEvent = {
  type: "task-detail-stream-chunk";
  taskId: TaskId;
  messageId: MessageId;
  chunk: string;
  timestamp: number;
};

/**
 * Worker Agent 流式输出完成事件
 */
export type TaskDetailStreamCompleteEvent = {
  type: "task-detail-stream-complete";
  taskId: TaskId;
  messageId: MessageId;
  content: string;
  timestamp: number;
};

/**
 * 工具调用请求事件
 */
export type TaskDetailToolCallRequestEvent = {
  type: "task-detail-tool-call-request";
  taskId: TaskId;
  toolCallId: string;
  name: string;
  arguments: string;
  timestamp: number;
};

/**
 * 工具调用响应事件
 */
export type TaskDetailToolCallResponseEvent = {
  type: "task-detail-tool-call-response";
  taskId: TaskId;
  toolCallId: string;
  result: string;
  timestamp: number;
};

/**
 * Task 详情事件联合类型
 */
export type TaskDetailEvent =
  | TaskDetailUserMessageEvent
  | TaskDetailStreamChunkEvent
  | TaskDetailStreamCompleteEvent
  | TaskDetailToolCallRequestEvent
  | TaskDetailToolCallResponseEvent;

// ============================================================================
// 事件订阅类型
// ============================================================================

/**
 * Task 事件处理器
 */
export type TaskEventHandler = (event: TaskEvent) => void;

/**
 * Task 详情事件处理器
 */
export type TaskDetailEventHandler = (event: TaskDetailEvent) => void;

/**
 * 订阅 Task 事件
 */
export type SubscribeTaskEvent = (handler: TaskEventHandler) => Unsubscribe;

/**
 * 订阅 Task 详情事件
 */
export type SubscribeTaskDetailEvent = (handler: TaskDetailEventHandler) => Unsubscribe;
