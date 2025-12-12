/**
 * Workforce 内部类型定义
 *
 * 用于 automata-based 实现的类型定义
 */

import type {
  TaskId,
  Task,
  TaskEvent,
  TaskDetailEvent,
  // TaskStatus, // Currently not used
} from "../types";
import type { WorkforceConfig, CreateTaskInput, AppendMessageInput } from "../types";
import type { PseudoToolCall } from "./pseudo-tools";
import type { Worldscape } from "@moora/agent-worker";
import type { Agent } from "@moora/agent-worker";
// import type { Dispatch } from "@moora/automata";
// import type { Eff } from "@moora/effects";

// ============================================================================
// Workforce 状态定义
// ============================================================================

/**
 * Workforce 状态
 *
 * 包含所有任务树数据、Agent 池标记和配置
 */
export type WorkforceState = {
  /** 任务数据映射 */
  tasks: Record<TaskId, Task>;
  /** 父子关系映射（parentId -> childIds） */
  children: Record<TaskId, TaskId[]>;
  /** 工作中的 Agent 标记（taskId -> true） */
  workingAgents: Record<TaskId, true>;
  /** 配置（不变） */
  config: WorkforceConfig;
  /** 是否已销毁 */
  destroyed: boolean;
};

// ============================================================================
// Workforce 输入信号定义
// ============================================================================

/**
 * 创建任务输入
 */
export type CreateTasksInput = {
  type: "create-tasks";
  tasks: CreateTaskInput[];
};

/**
 * 追加消息输入
 */
export type AppendMessageInputSignal = {
  type: "append-message";
  input: AppendMessageInput;
};

/**
 * 取消任务输入
 */
export type CancelTasksInput = {
  type: "cancel-tasks";
  taskIds: TaskId[];
};

/**
 * 伪工具调用输入
 */
export type PseudoToolCallInput = {
  type: "pseudo-tool-call";
  taskId: TaskId;
  call: PseudoToolCall;
};

/**
 * Agent 完成输入
 */
export type AgentCompletedInput = {
  type: "agent-completed";
  taskId: TaskId;
};

/**
 * 调度 Agent 输入（内部使用）
 */
export type ScheduleAgentInput = {
  type: "schedule-agent";
  taskId: TaskId;
};

/**
 * 更新 Worldscape 输入（内部使用）
 */
export type UpdateWorldscapeInput = {
  type: "update-worldscape";
  taskId: TaskId;
  worldscape: Worldscape;
};

/**
 * 销毁输入
 */
export type DestroyInput = {
  type: "destroy";
};

/**
 * Workforce 输入信号联合类型
 */
export type WorkforceInput =
  | CreateTasksInput
  | AppendMessageInputSignal
  | CancelTasksInput
  | PseudoToolCallInput
  | AgentCompletedInput
  | ScheduleAgentInput
  | UpdateWorldscapeInput
  | DestroyInput;

// ============================================================================
// Agent 管理相关类型
// ============================================================================

/**
 * 工作中的 Agent 实例
 */
export type WorkingAgent = {
  /** Agent 实例 */
  agent: Agent;
  /** 正在处理的 Task ID */
  taskId: TaskId;
  /** 取消订阅函数 */
  unsubscribe: () => void;
};

// ============================================================================
// 输出函数上下文类型
// ============================================================================

/**
 * 输出函数上下文
 *
 * 包含输出函数执行时需要的上下文信息
 */
export type OutputContext = {
  /** Task 事件 PubSub */
  taskEventPubSub: {
    pub: (event: TaskEvent) => void;
  };
  /** Task 详情事件 PubSub */
  taskDetailEventPubSub: {
    pub: (event: TaskDetailEvent) => void;
  };
  /** Agent 管理器 */
  agentManager: {
    create: (taskId: TaskId, agent: Agent, unsubscribe: () => void) => void;
    destroy: (taskId: TaskId) => void;
    get: (taskId: TaskId) => WorkingAgent | undefined;
    getAll: () => WorkingAgent[];
  };
};
