/**
 * Task Manager 类型定义
 *
 * 定义任务管理的核心类型
 */

// ============================================================================
// Task Status 类型
// ============================================================================

/**
 * 任务就绪状态 - 无未完成的依赖
 */
export type TaskStatusReady = {
  type: "ready";
};

/**
 * 任务等待状态 - 有未完成的依赖
 */
export type TaskStatusPending = {
  type: "pending";
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
 */
export type TaskStatus =
  | TaskStatusReady
  | TaskStatusPending
  | TaskStatusSucceeded
  | TaskStatusFailed;

// ============================================================================
// Task 类型
// ============================================================================

/**
 * 任务定义 - 用于 schedule 输入
 */
export type TaskDefinition = {
  /** 任务 ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务目标/描述 */
  goal: string;
  /** 父任务 ID（可选，用于子任务） */
  parentId?: string;
  /** 依赖的任务 ID 列表 */
  dependencies?: string[];
};

/**
 * 任务内部状态
 */
export type Task = {
  /** 任务 ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务目标/描述 */
  goal: string;
  /** 父任务 ID（顶层任务为 null） */
  parentId: string | null;
  /** 依赖的任务 ID 列表 */
  dependencies: string[];
  /** 子任务 ID 列表 */
  childIds: string[];
  /** 附加信息列表 */
  appendedInfos: string[];
  /** 任务状态 */
  status: TaskStatus;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后更新时间戳 */
  updatedAt: number;
};

/**
 * 任务信息 - 对外查询返回的类型
 */
export type TaskInfo = {
  /** 任务 ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务目标/描述 */
  goal: string;
  /** 父任务 ID */
  parentId: string | null;
  /** 依赖的任务 ID 列表 */
  dependencies: string[];
  /** 子任务 ID 列表 */
  childIds: string[];
  /** 附加信息列表 */
  appendedInfos: string[];
  /** 任务状态 */
  status: TaskStatus;
};

// ============================================================================
// Break Down 类型
// ============================================================================

/**
 * 子任务定义 - 用于 break-down 输入
 */
export type SubTaskDefinition = {
  /** 子任务 ID */
  id: string;
  /** 子任务标题 */
  title: string;
  /** 子任务目标/描述 */
  goal: string;
  /** 依赖的兄弟任务 ID 列表（相对于同一父任务下的子任务） */
  dependencies?: string[];
};

// ============================================================================
// State 类型
// ============================================================================

/**
 * Task Manager 的状态
 */
export type TaskManagerState = {
  /** 所有任务的映射 */
  tasks: Record<string, Task>;
  /** 顶层任务 ID 列表（按创建顺序） */
  topLevelTaskIds: string[];
};

// ============================================================================
// Actuation (输入) 类型
// ============================================================================

/**
 * Schedule 一批任务
 */
export type ActuationSchedule = {
  type: "schedule";
  tasks: TaskDefinition[];
  timestamp: number;
};

/**
 * Cancel 一批任务
 */
export type ActuationCancel = {
  type: "cancel";
  taskIds: string[];
  error?: string;
  timestamp: number;
};

/**
 * 向一批任务追加信息
 */
export type ActuationAppendInfo = {
  type: "append-info";
  taskIds: string[];
  info: string;
  timestamp: number;
};

/**
 * 分解一个任务为子任务
 */
export type ActuationBreakDown = {
  type: "break-down";
  taskId: string;
  subTasks: SubTaskDefinition[];
  timestamp: number;
};

/**
 * 完成一个任务（成功）
 */
export type ActuationComplete = {
  type: "complete";
  taskId: string;
  result: string;
  timestamp: number;
};

/**
 * 任务失败
 */
export type ActuationFail = {
  type: "fail";
  taskId: string;
  error: string;
  timestamp: number;
};

/**
 * 所有 Actuation 类型的联合
 */
export type Actuation =
  | ActuationSchedule
  | ActuationCancel
  | ActuationAppendInfo
  | ActuationBreakDown
  | ActuationComplete
  | ActuationFail;

// ============================================================================
// 辅助函数类型
// ============================================================================

/**
 * 检查任务是否已完成（成功或失败）
 */
export const isCompleted = (status: TaskStatus): boolean =>
  status.type === "succeeded" || status.type === "failed";

/**
 * 检查任务是否活跃（未完成）
 */
export const isActive = (status: TaskStatus): boolean => !isCompleted(status);
