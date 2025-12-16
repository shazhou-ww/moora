/**
 * Task Manager 类型定义
 *
 * 设计原则：
 * - 状态最小化：只存储基本数据，TaskStatus 从 completions 和 children 推导
 * - 父子即依赖：任务的依赖关系通过父子关系表达，父任务必须等所有子任务完成
 * - 虚拟根节点：所有任务都有 parentId，顶层任务的 parentId 是 ROOT_TASK_ID
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
export type AppendedInfo = {
  /** 任务 ID */
  taskId: string;
  /** 追加的信息 */
  info: string;
};

// ============================================================================
// Task Completion 类型
// ============================================================================

/**
 * 任务成功完成
 */
export type CompletionSuccess = {
  isSuccess: true;
  result: string;
};

/**
 * 任务失败
 */
export type CompletionFailure = {
  isSuccess: false;
  error: string;
};

/**
 * 任务完成状态
 * 只有完成的任务才会在 completions 中
 */
export type Completion = CompletionSuccess | CompletionFailure;

// ============================================================================
// Task Status 类型（推导出的状态）
// ============================================================================

/**
 * 任务等待状态 - 有未完成的子任务
 */
export type TaskStatusPending = {
  type: "pending";
};

/**
 * 任务就绪状态 - 所有子任务已完成，可以执行
 */
export type TaskStatusReady = {
  type: "ready";
};

/**
 * 任务成功状态
 */
export type TaskStatusSucceeded = {
  type: "succeeded";
  result: string;
};

/**
 * 任务失败状态
 */
export type TaskStatusFailed = {
  type: "failed";
  error: string;
};

/**
 * 任务状态联合类型
 * 这是从 completions 和 children 推导出来的，不直接存储在 state 中
 */
export type TaskStatus =
  | TaskStatusPending
  | TaskStatusReady
  | TaskStatusSucceeded
  | TaskStatusFailed;

// ============================================================================
// State 类型
// ============================================================================

/**
 * Task Manager 的状态
 *
 * 设计原则：
 * - 只存储最基本的数据
 * - TaskStatus 从 completions 和 children 推导
 */
export type TaskManagerState = {
  /** 所有 task 的创建信息 */
  creations: Record<string, TaskCreation>;
  /** 所有追加的消息（有序列表） */
  appendedInfos: AppendedInfo[];
  /** 已完成任务的结果，key 是 taskId */
  completions: Record<string, Completion>;
  /** (cache) 所有 task 的 children 列表，key 包含 ROOT_TASK_ID */
  children: Record<string, string[]>;
};

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
  /** 附加信息列表 */
  appendedInfos: string[];
  /** 任务状态（从 completions 和 children 推导） */
  status: TaskStatus;
  /** 创建时间戳 */
  createdAt: number;
};

// ============================================================================
// Input 类型
// ============================================================================

/**
 * 创建任务
 * - parentId 是必须的，顶层任务用 ROOT_TASK_ID
 */
export type InputCreate = {
  type: "create";
  timestamp: number;
  id: string;
  title: string;
  goal: string;
  parentId: string;
};

/**
 * 取消任务
 * 会递归取消所有子任务
 */
export type InputCancel = {
  type: "cancel";
  timestamp: number;
  taskId: string;
  error: string;
};

/**
 * 追加消息到一个或多个任务
 */
export type InputAppend = {
  type: "append";
  timestamp: number;
  taskIds: string[];
  info: string;
};

/**
 * 完成任务（成功）
 */
export type InputComplete = {
  type: "complete";
  timestamp: number;
  taskId: string;
  result: string;
};

/**
 * 任务失败
 */
export type InputFail = {
  type: "fail";
  timestamp: number;
  taskId: string;
  error: string;
};

/**
 * 所有 Input 类型的联合
 */
export type Input =
  | InputCreate
  | InputCancel
  | InputAppend
  | InputComplete
  | InputFail;
