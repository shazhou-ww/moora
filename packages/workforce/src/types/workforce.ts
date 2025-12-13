/**
 * Workforce 相关类型定义
 */

import type {
  TaskId,
  MessageId,
  // TaskInput, // Currently not used
  Task,
  TaskRuntimeStatus,
  SubscribeTaskEvent,
  SubscribeTaskDetailEvent,
} from "./task";
import type { CallLlm } from "@moora/agent-common";
import type { Toolkit } from "@moora/toolkit";

/**
 * Nullable 工具类型
 */
type Nullable<T> = T | null;

// ============================================================================
// Workforce Logger 类型
// ============================================================================

/**
 * Workforce 日志级别
 */
export type WorkforceLogLevel = "debug" | "info" | "warn" | "error";

/**
 * Workforce 日志条目
 */
export type WorkforceLogEntry = {
  /** 日志级别 */
  level: WorkforceLogLevel;
  /** 日志消息 */
  message: string;
  /** 时间戳 */
  timestamp: number;
  /** 相关的 Task ID（如果有） */
  taskId: Nullable<TaskId>;
  /** 额外的上下文数据 */
  data: Record<string, unknown>;
};

/**
 * Workforce Logger 函数类型
 *
 * 用于接收 Workforce 内部的日志输出
 */
export type WorkforceLogger = (entry: WorkforceLogEntry) => void;

// ============================================================================
// Workforce 配置
// ============================================================================

/**
 * Workforce 配置
 */
export type WorkforceConfig = {
  /** Agent 池上限 */
  maxAgents: number;
  /** 用于创建 Agent 的 Toolkit */
  toolkit: Toolkit;
  /** LLM 调用函数 */
  callLlm: CallLlm;
  /** 可选的日志函数，用于调试 */
  logger: Nullable<WorkforceLogger>;
};

// ============================================================================
// Workforce 操作类型
// ============================================================================

/**
 * 创建 Task 的输入
 *
 * 必须包含 id, title, goal，调用方需要提供唯一 ID
 */
export type CreateTaskInput = {
  /** 任务唯一 ID（UUID 格式），由调用方提供 */
  id: TaskId;
  /** 任务简短标题 */
  title: string;
  /** 任务详细目标需求 */
  goal: string;
  /** 父任务 ID（可选，默认为根任务） */
  parentId?: TaskId;
};

/**
 * 追加消息到 Task 的输入
 */
export type AppendMessageInput = {
  /** 消息唯一 ID，由调用方提供 */
  messageId: MessageId;
  /** 消息内容 */
  content: string;
  /** 目标 Task ID 列表 */
  taskIds: TaskId[];
};

// ============================================================================
// Workforce 接口
// ============================================================================

/**
 * Workforce 接口
 *
 * 维护 Task tree 和 Agent 池，自动调度 Worker Agent 完成分配的任务
 */
export interface Workforce {
  /**
   * 创建一组 Task
   *
   * @param tasks - 要创建的 Task 列表
   */
  createTasks(tasks: CreateTaskInput[]): void;

  /**
   * 向 Task 追加补充信息
   *
   * @param input - 消息内容和目标 Task ID 列表
   */
  appendMessage(input: AppendMessageInput): void;

  /**
   * 取消一组 Task
   *
   * 将 Task 标记为取消，并终止对应的正在执行的 Agent
   *
   * @param taskIds - 要取消的 Task ID 列表
   */
  cancelTasks(taskIds: TaskId[]): void;

  /**
   * 获取指定 Task 的完整信息
   *
   * @param taskId - Task ID
   * @returns Task 信息，如果不存在则返回 undefined
   */
  getTask(taskId: TaskId): Task | undefined;

  /**
   * 获取指定 Task 的运行时状态
   *
   * @param taskId - Task ID
   * @returns Task 状态，如果不存在则返回 undefined
   */
  getTaskStatus(taskId: TaskId): TaskRuntimeStatus | undefined;

  /**
   * 获取所有 Task 的 ID 列表
   */
  getAllTaskIds(): TaskId[];

  /**
   * 获取指定 Task 的子任务 ID 列表
   *
   * @param taskId - 父 Task ID
   */
  getChildTaskIds(taskId: TaskId): TaskId[];

  /**
   * 监听 Task 事件
   *
   * 事件包括：task 创建、开始执行、追加消息、取消、成功完成、失败退出
   */
  subscribeTaskEvent: SubscribeTaskEvent;

  /**
   * 监听 Task 详情事件
   *
   * 事件包括：收到用户消息、worker agent 的流式输出、tool call 的 request 和 response
   */
  subscribeTaskDetailEvent: SubscribeTaskDetailEvent;

  /**
   * 销毁 Workforce
   *
   * 停止所有 Agent，释放资源
   */
  destroy(): void;
}
