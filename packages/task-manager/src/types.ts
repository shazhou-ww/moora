/**
 * Task Manager 类型定义
 *
 * 基于自动机建模方法论设计：
 * - Input：系统响应的事件（过去式命名）
 * - State：观察者需要的数据
 */

// ============================================================================
// 常量
// ============================================================================

/**
 * 根节点的虚拟 ID
 * 所有顶层任务的 parentId 都是这个值
 */
export const ROOT_TASK_ID = "00000000-0000-0000-0000-000000000000";

// ============================================================================
// Task 创建信息
// ============================================================================

/**
 * Task 的创建信息（不可变数据）
 * 一旦创建就不会改变
 */
export type TaskCreation = {
  /** 任务 ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务目标/描述 */
  goal: string;
  /** 父任务 ID，顶层任务的 parentId 是 ROOT_TASK_ID */
  parentId: string;
  /** 创建时间戳 */
  createdAt: number;
};

// ============================================================================
// Task 追加消息
// ============================================================================

/**
 * 追加到任务的消息
 */
export type AppendedMessage = {
  /** 任务 ID */
  taskId: string;
  /** 追加的消息 */
  message: string;
  /** 时间戳 */
  timestamp: number;
};

// ============================================================================
// Task Status 类型
// ============================================================================

/**
 * 任务状态
 *
 * - ready: 就绪，可被执行
 * - pending: 等待子任务完成
 * - running: 执行中
 * - completed: 成功完成
 * - failed: 失败
 * - suspended: 挂起，等待用户输入
 * - cancelled: 已取消（终结状态）
 */
export type TaskStatus =
  | "ready"
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "suspended"
  | "cancelled";

// ============================================================================
// Task Result 类型
// ============================================================================

/**
 * 任务成功结果
 */
export type TaskResultSuccess = {
  type: "success";
  result: string;
};

/**
 * 任务失败结果
 */
export type TaskResultFailure = {
  type: "failure";
  error: string;
};

/**
 * 任务挂起结果
 */
export type TaskResultSuspended = {
  type: "suspended";
  reason: string;
};

/**
 * 任务取消结果
 */
export type TaskResultCancelled = {
  type: "cancelled";
  reason: string;
};

/**
 * 任务终结结果
 * 当任务进入 completed/failed/suspended/cancelled 状态时记录
 */
export type TaskResult =
  | TaskResultSuccess
  | TaskResultFailure
  | TaskResultSuspended
  | TaskResultCancelled;

// ============================================================================
// State 类型
// ============================================================================

/**
 * Task Manager 的状态
 */
export type TaskManagerState = {
  /** 所有任务的创建信息 */
  creations: Record<string, TaskCreation>;
  /** 所有任务的当前状态 */
  statuses: Record<string, TaskStatus>;
  /** 已终结任务的结果 */
  results: Record<string, TaskResult>;
  /** 父子关系：taskId → childIds，包含 ROOT_TASK_ID */
  children: Record<string, string[]>;
  /** 追加的消息（有序列表） */
  appendedMessages: AppendedMessage[];
};

// ============================================================================
// Input 类型
// ============================================================================

/**
 * 任务已创建事件
 *
 * 副作用：若父任务是 running 状态，父任务 → pending
 */
export type TaskManagerInputTaskCreated = {
  type: "task-created";
  timestamp: number;
  taskId: string;
  title: string;
  goal: string;
  parentId: string;
};

/**
 * 任务开始执行事件
 *
 * ready → running
 */
export type TaskManagerInputTaskStarted = {
  type: "task-started";
  timestamp: number;
  taskId: string;
};

/**
 * 任务成功完成事件
 *
 * running → completed
 * 副作用：检查父任务是否所有子任务都已终结 → ready
 */
export type TaskManagerInputTaskCompleted = {
  type: "task-completed";
  timestamp: number;
  taskId: string;
  result: string;
};

/**
 * 任务失败事件
 *
 * running → failed
 * 副作用：检查父任务是否所有子任务都已终结 → ready
 */
export type TaskManagerInputTaskFailed = {
  type: "task-failed";
  timestamp: number;
  taskId: string;
  error: string;
};

/**
 * 任务挂起事件（等待用户输入）
 *
 * running → suspended
 * 副作用：检查父任务是否所有子任务都已终结 → ready
 */
export type TaskManagerInputTaskSuspended = {
  type: "task-suspended";
  timestamp: number;
  taskId: string;
  reason: string;
};

/**
 * 任务取消事件
 *
 * 任意非终结状态 → cancelled
 * 副作用：递归取消所有子任务
 */
export type TaskManagerInputTaskCancelled = {
  type: "task-cancelled";
  timestamp: number;
  taskId: string;
  reason: string;
};

/**
 * 消息追加事件
 *
 * 副作用：所有非 running 状态的目标任务 → ready
 */
export type TaskManagerInputMessageAppended = {
  type: "message-appended";
  timestamp: number;
  taskIds: string[];
  message: string;
};

/**
 * Task Manager 的总 Input 类型
 */
export type TaskManagerInput =
  | TaskManagerInputTaskCreated
  | TaskManagerInputTaskStarted
  | TaskManagerInputTaskCompleted
  | TaskManagerInputTaskFailed
  | TaskManagerInputTaskSuspended
  | TaskManagerInputTaskCancelled
  | TaskManagerInputMessageAppended;

// ============================================================================
// TaskInfo 类型（查询结果）
// ============================================================================

/**
 * 任务信息 - 对外查询返回的类型
 * 从 State 的各个部分组装而成
 */
export type TaskInfo = {
  /** 任务 ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务目标/描述 */
  goal: string;
  /** 父任务 ID */
  parentId: string;
  /** 子任务 ID 列表 */
  childIds: string[];
  /** 附加消息列表 */
  appendedMessages: string[];
  /** 任务状态 */
  status: TaskStatus;
  /** 任务结果（仅终结状态有值） */
  result: TaskResult | null;
  /** 创建时间戳 */
  createdAt: number;
};
