/**
 * Task Tree 操作辅助函数
 *
 * 纯函数，用于操作任务树状态
 */

import { ROOT_TASK_ID } from "../types";

import type {
  TaskId,
  Task,
  TaskStatus,
  TaskResult,
  TaskInput,
  MessageId,
} from "../types";
import type { WorkforceState } from "./types";
import type { UserMessage, AssiMessage } from "@moora/agent-common";
import type { Worldscape } from "@moora/agent-worker";

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建空的 Worldscape
 */
export function createEmptyWorldscape(): Worldscape {
  return {
    userMessages: [],
    assiMessages: [],
    toolCallRequests: [],
    toolResults: [],
    cutOff: 0,
  };
}

/**
 * 创建新的 Task
 */
export function createTaskInState(
  state: WorkforceState,
  input: TaskInput
): WorkforceState {
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

  // 创建 Task
  const task: Task = {
    id: input.id,
    title: input.title,
    goal: input.goal,
    parentId: input.parentId,
    worldscape,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  };

  // 更新状态
  const newTasks = { ...state.tasks, [input.id]: task };
  const parentId = input.parentId;
  const newChildren = { ...state.children };
  
  // 确保父任务的 children 数组存在
  if (!newChildren[parentId]) {
    newChildren[parentId] = [];
  }
  
  // 添加子任务 ID
  newChildren[parentId] = [...newChildren[parentId], input.id];
  
  // 初始化该任务的 children 数组
  newChildren[input.id] = [];

  return {
    ...state,
    tasks: newTasks,
    children: newChildren,
  };
}

/**
 * 更新 Task 状态
 */
export function updateTaskStatus(
  state: WorkforceState,
  taskId: TaskId,
  status: TaskStatus,
  result?: TaskResult
): WorkforceState {
  const task = state.tasks[taskId];
  if (!task) return state;

  const updatedTask: Task = {
    ...task,
    status,
    result,
    updatedAt: Date.now(),
  };

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: updatedTask,
    },
  };
}

/**
 * 追加用户消息到 Task
 */
export function appendUserMessageToTask(
  state: WorkforceState,
  taskId: TaskId,
  messageId: MessageId,
  content: string
): WorkforceState {
  const task = state.tasks[taskId];
  if (!task) return state;

  const now = Date.now();
  const message: UserMessage = {
    id: messageId,
    role: "user",
    content,
    timestamp: now,
  };

  const updatedWorldscape: Worldscape = {
    ...task.worldscape,
    userMessages: [...task.worldscape.userMessages, message],
  };

  const updatedTask: Task = {
    ...task,
    worldscape: updatedWorldscape,
  };

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: updatedTask,
    },
  };
}

/**
 * 追加助手消息（开始流式输出）
 */
export function appendAssistantMessageToTask(
  state: WorkforceState,
  taskId: TaskId,
  messageId: MessageId
): WorkforceState {
  const task = state.tasks[taskId];
  if (!task) return state;

  const now = Date.now();
  const message: AssiMessage = {
    id: messageId,
    role: "assistant",
    streaming: true,
    timestamp: now,
  };

  const updatedWorldscape: Worldscape = {
    ...task.worldscape,
    assiMessages: [...task.worldscape.assiMessages, message],
  };

  const updatedTask: Task = {
    ...task,
    worldscape: updatedWorldscape,
  };

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: updatedTask,
    },
  };
}

/**
 * 完成助手消息（流式输出完成）
 */
export function completeAssistantMessageInTask(
  state: WorkforceState,
  taskId: TaskId,
  messageId: MessageId,
  content: string
): WorkforceState {
  const task = state.tasks[taskId];
  if (!task) return state;

  const messageIndex = task.worldscape.assiMessages.findIndex(
    (m) => m.id === messageId
  );
  if (messageIndex === -1) return state;

  const now = Date.now();
  const updatedMessages = [...task.worldscape.assiMessages];
  updatedMessages[messageIndex] = {
    id: messageId,
    role: "assistant",
    streaming: false,
    content,
    timestamp: now,
  };

  const updatedWorldscape: Worldscape = {
    ...task.worldscape,
    assiMessages: updatedMessages,
  };

  const updatedTask: Task = {
    ...task,
    worldscape: updatedWorldscape,
  };

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: updatedTask,
    },
  };
}

/**
 * 追加工具调用请求
 */
export function appendToolCallRequestToTask(
  state: WorkforceState,
  taskId: TaskId,
  toolCallId: string,
  name: string,
  args: string
): WorkforceState {
  const task = state.tasks[taskId];
  if (!task) return state;

  const now = Date.now();
  const updatedWorldscape: Worldscape = {
    ...task.worldscape,
    toolCallRequests: [
      ...task.worldscape.toolCallRequests,
      {
        toolCallId,
        name,
        arguments: args,
        timestamp: now,
      },
    ],
  };

  const updatedTask: Task = {
    ...task,
    worldscape: updatedWorldscape,
  };

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: updatedTask,
    },
  };
}

/**
 * 追加工具调用响应
 */
export function appendToolCallResponseToTask(
  state: WorkforceState,
  taskId: TaskId,
  toolCallId: string,
  result: string
): WorkforceState {
  const task = state.tasks[taskId];
  if (!task) return state;

  const now = Date.now();
  const updatedWorldscape: Worldscape = {
    ...task.worldscape,
    toolResults: [
      ...task.worldscape.toolResults,
      {
        toolCallId,
        result,
        timestamp: now,
      },
    ],
  };

  const updatedTask: Task = {
    ...task,
    worldscape: updatedWorldscape,
  };

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: updatedTask,
    },
  };
}

/**
 * 检查并更新父任务状态（当子任务完成时）
 */
export function checkAndUpdateParentStatus(
  state: WorkforceState,
  parentId: TaskId
): WorkforceState {
  // 根任务不需要更新状态
  if (parentId === ROOT_TASK_ID) return state;

  const parentTask = state.tasks[parentId];
  if (!parentTask) return state;

  // 只有 pending 状态需要检查
  if (parentTask.status !== "pending") return state;

  const childIds = state.children[parentId] || [];
  if (childIds.length === 0) return state;

  // 检查所有子任务是否完成
  let allCompleted = true;
  for (const childId of childIds) {
    const childTask = state.tasks[childId];
    if (!childTask) continue;
    if (childTask.status !== "succeeded" && childTask.status !== "failed") {
      allCompleted = false;
      break;
    }
  }

  if (allCompleted) {
    // 所有子任务完成，父任务切回 ready 状态
    return updateTaskStatus(state, parentId, "ready");
  }

  return state;
}

/**
 * 获取下一个就绪的 Task（按 updatedAt FIFO 排序）
 */
export function getNextReadyTask(state: WorkforceState): TaskId | undefined {
  const readyTasks: { id: TaskId; updatedAt: number }[] = [];

  for (const [taskId, task] of Object.entries(state.tasks)) {
    if (task.status === "ready") {
      readyTasks.push({ id: taskId, updatedAt: task.updatedAt });
    }
  }

  if (readyTasks.length === 0) return undefined;

  // 按 updatedAt 升序排序，返回最早的
  readyTasks.sort((a, b) => a.updatedAt - b.updatedAt);
  return readyTasks[0]?.id;
}
