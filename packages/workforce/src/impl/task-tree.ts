/**
 * Task Tree 管理
 *
 * 管理 Task 树结构、状态跟踪和调度
 */

import { createPubSub } from "@moora/pub-sub";
import type { PubSub } from "@moora/pub-sub";
import type { Worldscape } from "@moora/agent-worker";
import type { UserMessage, AssiMessage } from "@moora/agent-common";
import {
  ROOT_TASK_ID,
  type TaskId,
  type MessageId,
  type TaskInput,
  type Task,
  type TaskRuntimeData,
  type TaskRuntimeStatus,
  type TaskEvent,
  type TaskDetailEvent,
} from "../types";

// ============================================================================
// TaskTree 类型
// ============================================================================

/**
 * TaskTree 接口
 */
export interface TaskTree {
  /**
   * 创建新的 Task
   */
  createTask(input: TaskInput): void;

  /**
   * 获取 Task 完整信息
   */
  getTask(taskId: TaskId): Task | undefined;

  /**
   * 获取 Task 运行时状态
   */
  getTaskStatus(taskId: TaskId): TaskRuntimeStatus | undefined;

  /**
   * 获取 Task 运行时数据
   */
  getTaskData(taskId: TaskId): TaskRuntimeData | undefined;

  /**
   * 获取所有 Task ID
   */
  getAllTaskIds(): TaskId[];

  /**
   * 获取子任务 ID 列表
   */
  getChildTaskIds(parentId: TaskId): TaskId[];

  /**
   * 获取下一个就绪的 Task（按 updatedAt FIFO 排序）
   */
  getNextReadyTask(): TaskId | undefined;

  /**
   * 更新 Task 状态为 processing
   */
  startProcessing(taskId: TaskId): void;

  /**
   * 追加用户消息
   */
  appendUserMessage(taskId: TaskId, messageId: MessageId, content: string): void;

  /**
   * 追加助手消息（开始流式输出）
   */
  appendAssistantMessage(taskId: TaskId, messageId: MessageId): void;

  /**
   * 更新助手消息（流式输出完成）
   */
  completeAssistantMessage(taskId: TaskId, messageId: MessageId, content: string): void;

  /**
   * 追加工具调用请求
   */
  appendToolCallRequest(
    taskId: TaskId,
    toolCallId: string,
    name: string,
    args: string
  ): void;

  /**
   * 追加工具调用响应
   */
  appendToolCallResponse(taskId: TaskId, toolCallId: string, result: string): void;

  /**
   * 完成 Task（成功）
   */
  succeedTask(taskId: TaskId, conclusion: string): void;

  /**
   * 完成 Task（失败）
   */
  failTask(taskId: TaskId, error: string): void;

  /**
   * 取消 Task
   */
  cancelTask(taskId: TaskId): void;

  /**
   * 创建子任务后，更新父任务状态为 pending
   */
  setPending(taskId: TaskId): void;

  /**
   * 检查并更新父任务状态（当子任务完成时）
   */
  checkAndUpdateParentStatus(taskId: TaskId): void;

  /**
   * Task 事件 PubSub
   */
  readonly taskEventPubSub: PubSub<TaskEvent>;

  /**
   * Task 详情事件 PubSub
   */
  readonly taskDetailEventPubSub: PubSub<TaskDetailEvent>;
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建空的 Worldscape
 */
function createEmptyWorldscape(): Worldscape {
  return {
    userMessages: [],
    assiMessages: [],
    toolCallRequests: [],
    toolResults: [],
    cutOff: 0,
  };
}

// ============================================================================
// TaskTree 实现
// ============================================================================

/**
 * 创建 TaskTree
 */
export function createTaskTree(): TaskTree {
  // 存储所有 Task 的运行时数据
  const taskDataMap = new Map<TaskId, TaskRuntimeData>();

  // 存储所有 Task 的运行时状态
  const taskStatusMap = new Map<TaskId, TaskRuntimeStatus>();

  // 存储父子关系（parentId -> childIds）
  const childrenMap = new Map<TaskId, Set<TaskId>>();

  // 事件发布订阅
  const taskEventPubSub = createPubSub<TaskEvent>();
  const taskDetailEventPubSub = createPubSub<TaskDetailEvent>();

  // 初始化根任务的 children set
  childrenMap.set(ROOT_TASK_ID, new Set());

  /**
   * 创建新的 Task
   */
  function createTask(input: TaskInput): void {
    const now = Date.now();
    const goalMessageId = `msg-${input.id}-goal`;

    // 创建初始 Worldscape，包含目标作为第一条用户消息
    const worldscape = createEmptyWorldscape();
    worldscape.userMessages.push({
      id: goalMessageId,
      role: "user",
      content: input.goal,
      timestamp: now,
    });

    // 创建运行时数据
    const data: TaskRuntimeData = {
      id: input.id,
      title: input.title,
      goal: input.goal,
      parentId: input.parentId,
      worldscape,
    };

    // 创建运行时状态
    const status: TaskRuntimeStatus = {
      id: input.id,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    };

    // 存储
    taskDataMap.set(input.id, data);
    taskStatusMap.set(input.id, status);

    // 更新父子关系
    if (!childrenMap.has(input.parentId)) {
      childrenMap.set(input.parentId, new Set());
    }
    childrenMap.get(input.parentId)!.add(input.id);

    // 初始化该任务的 children set
    childrenMap.set(input.id, new Set());

    // 发布事件
    taskEventPubSub.pub({
      type: "task-created",
      task: input,
      timestamp: now,
    });

    // 发布用户消息详情事件
    taskDetailEventPubSub.pub({
      type: "task-detail-user-message",
      taskId: input.id,
      messageId: goalMessageId,
      content: input.goal,
      timestamp: now,
    });
  }

  /**
   * 获取 Task 完整信息
   */
  function getTask(taskId: TaskId): Task | undefined {
    const data = taskDataMap.get(taskId);
    const status = taskStatusMap.get(taskId);
    if (!data || !status) return undefined;
    return { ...data, ...status };
  }

  /**
   * 获取 Task 运行时状态
   */
  function getTaskStatus(taskId: TaskId): TaskRuntimeStatus | undefined {
    return taskStatusMap.get(taskId);
  }

  /**
   * 获取 Task 运行时数据
   */
  function getTaskData(taskId: TaskId): TaskRuntimeData | undefined {
    return taskDataMap.get(taskId);
  }

  /**
   * 获取所有 Task ID（不包括根任务）
   */
  function getAllTaskIds(): TaskId[] {
    return Array.from(taskDataMap.keys());
  }

  /**
   * 获取子任务 ID 列表
   */
  function getChildTaskIds(parentId: TaskId): TaskId[] {
    return Array.from(childrenMap.get(parentId) || []);
  }

  /**
   * 获取下一个就绪的 Task（按 updatedAt FIFO 排序）
   */
  function getNextReadyTask(): TaskId | undefined {
    const readyTasks: { id: TaskId; updatedAt: number }[] = [];

    for (const [taskId, status] of taskStatusMap) {
      if (status.status === "ready") {
        readyTasks.push({ id: taskId, updatedAt: status.updatedAt });
      }
    }

    if (readyTasks.length === 0) return undefined;

    // 按 updatedAt 升序排序，返回最早的
    readyTasks.sort((a, b) => a.updatedAt - b.updatedAt);
    const first = readyTasks[0];
    return first?.id;
  }

  /**
   * 更新 Task 状态为 processing
   */
  function startProcessing(taskId: TaskId): void {
    const status = taskStatusMap.get(taskId);
    if (!status) return;

    const now = Date.now();
    status.status = "processing";
    status.updatedAt = now;

    taskEventPubSub.pub({
      type: "task-started",
      taskId,
      timestamp: now,
    });
  }

  /**
   * 追加用户消息
   */
  function appendUserMessage(taskId: TaskId, messageId: MessageId, content: string): void {
    const data = taskDataMap.get(taskId);
    if (!data) return;

    const now = Date.now();
    const message: UserMessage = {
      id: messageId,
      role: "user",
      content,
      timestamp: now,
    };
    data.worldscape.userMessages.push(message);

    taskEventPubSub.pub({
      type: "task-message-appended",
      taskId,
      messageId,
      content,
      timestamp: now,
    });

    taskDetailEventPubSub.pub({
      type: "task-detail-user-message",
      taskId,
      messageId,
      content,
      timestamp: now,
    });
  }

  /**
   * 追加助手消息（开始流式输出）
   */
  function appendAssistantMessage(taskId: TaskId, messageId: MessageId): void {
    const data = taskDataMap.get(taskId);
    if (!data) return;

    const now = Date.now();
    const message: AssiMessage = {
      id: messageId,
      role: "assistant",
      streaming: true,
      timestamp: now,
    };
    data.worldscape.assiMessages.push(message);
  }

  /**
   * 更新助手消息（流式输出完成）
   */
  function completeAssistantMessage(taskId: TaskId, messageId: MessageId, content: string): void {
    const data = taskDataMap.get(taskId);
    if (!data) return;

    const messageIndex = data.worldscape.assiMessages.findIndex(
      (m: AssiMessage) => m.id === messageId
    );
    if (messageIndex === -1) return;

    const now = Date.now();
    // 替换为完成的消息
    data.worldscape.assiMessages[messageIndex] = {
      id: messageId,
      role: "assistant",
      streaming: false,
      content,
      timestamp: now,
    };

    taskDetailEventPubSub.pub({
      type: "task-detail-stream-complete",
      taskId,
      messageId,
      content,
      timestamp: now,
    });
  }

  /**
   * 追加工具调用请求
   */
  function appendToolCallRequest(
    taskId: TaskId,
    toolCallId: string,
    name: string,
    args: string
  ): void {
    const data = taskDataMap.get(taskId);
    if (!data) return;

    const now = Date.now();
    data.worldscape.toolCallRequests.push({
      toolCallId,
      name,
      arguments: args,
      timestamp: now,
    });

    taskDetailEventPubSub.pub({
      type: "task-detail-tool-call-request",
      taskId,
      toolCallId,
      name,
      arguments: args,
      timestamp: now,
    });
  }

  /**
   * 追加工具调用响应
   */
  function appendToolCallResponse(taskId: TaskId, toolCallId: string, result: string): void {
    const data = taskDataMap.get(taskId);
    if (!data) return;

    const now = Date.now();
    data.worldscape.toolResults.push({
      toolCallId,
      result,
      timestamp: now,
    });

    taskDetailEventPubSub.pub({
      type: "task-detail-tool-call-response",
      taskId,
      toolCallId,
      result,
      timestamp: now,
    });
  }

  /**
   * 完成 Task（成功）
   */
  function succeedTask(taskId: TaskId, conclusion: string): void {
    const status = taskStatusMap.get(taskId);
    if (!status) return;

    const now = Date.now();
    status.status = "succeeded";
    status.result = { success: true, conclusion };
    status.updatedAt = now;

    taskEventPubSub.pub({
      type: "task-succeeded",
      taskId,
      conclusion,
      timestamp: now,
    });

    // 检查父任务状态
    const data = taskDataMap.get(taskId);
    if (data) {
      checkAndUpdateParentStatus(data.parentId);
    }
  }

  /**
   * 完成 Task（失败）
   */
  function failTask(taskId: TaskId, error: string): void {
    const status = taskStatusMap.get(taskId);
    if (!status) return;

    const now = Date.now();
    status.status = "failed";
    status.result = { success: false, error };
    status.updatedAt = now;

    taskEventPubSub.pub({
      type: "task-failed",
      taskId,
      error,
      timestamp: now,
    });

    // 检查父任务状态
    const data = taskDataMap.get(taskId);
    if (data) {
      checkAndUpdateParentStatus(data.parentId);
    }
  }

  /**
   * 取消 Task
   */
  function cancelTask(taskId: TaskId): void {
    const status = taskStatusMap.get(taskId);
    if (!status) return;

    // 只能取消非完成状态的任务
    if (status.status === "succeeded" || status.status === "failed") return;

    const now = Date.now();
    status.status = "failed";
    status.result = { success: false, error: "Task cancelled" };
    status.updatedAt = now;

    taskEventPubSub.pub({
      type: "task-cancelled",
      taskId,
      timestamp: now,
    });

    // 检查父任务状态
    const data = taskDataMap.get(taskId);
    if (data) {
      checkAndUpdateParentStatus(data.parentId);
    }
  }

  /**
   * 创建子任务后，更新父任务状态为 pending
   */
  function setPending(taskId: TaskId): void {
    const status = taskStatusMap.get(taskId);
    if (!status) return;

    // 只有 processing 状态可以转为 pending
    if (status.status !== "processing") return;

    status.status = "pending";
    status.updatedAt = Date.now();
  }

  /**
   * 检查并更新父任务状态（当子任务完成时）
   */
  function checkAndUpdateParentStatus(parentId: TaskId): void {
    // 根任务不需要更新状态
    if (parentId === ROOT_TASK_ID) return;

    const parentStatus = taskStatusMap.get(parentId);
    if (!parentStatus) return;

    // 只有 pending 状态需要检查
    if (parentStatus.status !== "pending") return;

    const children = childrenMap.get(parentId);
    if (!children || children.size === 0) return;

    // 检查所有子任务是否完成
    let allCompleted = true;
    for (const childId of children) {
      const childStatus = taskStatusMap.get(childId);
      if (!childStatus) continue;
      if (childStatus.status !== "succeeded" && childStatus.status !== "failed") {
        allCompleted = false;
        break;
      }
    }

    if (allCompleted) {
      // 所有子任务完成，父任务切回 ready 状态
      parentStatus.status = "ready";
      parentStatus.updatedAt = Date.now();
    }
  }

  return {
    createTask,
    getTask,
    getTaskStatus,
    getTaskData,
    getAllTaskIds,
    getChildTaskIds,
    getNextReadyTask,
    startProcessing,
    appendUserMessage,
    appendAssistantMessage,
    completeAssistantMessage,
    appendToolCallRequest,
    appendToolCallResponse,
    succeedTask,
    failTask,
    cancelTask,
    setPending,
    checkAndUpdateParentStatus,
    taskEventPubSub,
    taskDetailEventPubSub,
  };
}
