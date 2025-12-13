/**
 * Workforce 输出函数
 *
 * 根据状态转换信息计算输出，返回副作用函数
 */

import { ROOT_TASK_ID } from "../types";
import { getNextReadyTask } from "./task-tree-helpers";

import type {
  WorkforceState,
  WorkforceInput,
  OutputContext,
} from "./types";
import type { TaskEvent, TaskDetailEvent, TaskInput, TaskId } from "../types";
import type { Dispatch } from "@moora/automata";
import type { UpdatePack } from "@moora/automata";
import type { Eff } from "@moora/effects";
/**
 * Nullable 工具类型
 */
type Nullable<T> = T | null;

/**
 * 从输入信号中提取 TaskId
 */
function getTaskIdFromInput(input: WorkforceInput): Nullable<TaskId> {
  switch (input.type) {
    case "pseudo-tool-call":
    case "agent-completed":
    case "schedule-agent":
    case "update-worldscape":
      return input.taskId;
    case "create-tasks": {
      const firstTask = input.tasks[0];
      return firstTask !== undefined ? firstTask.id : null;
    }
    case "append-message": {
      const firstTaskId = input.input.taskIds[0];
      return firstTaskId !== undefined ? firstTaskId : null;
    }
    case "cancel-tasks": {
      const firstCancelId = input.taskIds[0];
      return firstCancelId !== undefined ? firstCancelId : null;
    }
    case "destroy":
      return null;
    default:
      return null;
  }
}

/**
 * 从事件中提取 TaskId
 */
function getTaskIdFromEvent(event: TaskEvent): Nullable<TaskId> {
  switch (event.type) {
    case "task-created":
      return event.task.id;
    case "task-started":
    case "task-message-appended":
    case "task-cancelled":
    case "task-succeeded":
    case "task-failed":
      return event.taskId;
    default:
      return null;
  }
}

/**
 * 计算状态变化产生的事件
 */
function computeEvents(
  prev: { state: WorkforceState; input: WorkforceInput } | null,
  current: WorkforceState
): { taskEvents: TaskEvent[]; taskDetailEvents: TaskDetailEvent[] } {
  const taskEvents: TaskEvent[] = [];
  const taskDetailEvents: TaskDetailEvent[] = [];

  if (!prev) {
    // 初始状态，不产生事件
    return { taskEvents, taskDetailEvents };
  }

  const prevState = prev.state;
  const input = prev.input;

  // 处理 create-tasks 输入
  if (input.type === "create-tasks") {
    for (const taskInput of input.tasks) {
      const task = current.tasks[taskInput.id];
      if (task) {
        // 将 CreateTaskInput 转换为 TaskInput（处理 parentId 的默认值）
        const taskInputForEvent: TaskInput = {
          id: taskInput.id,
          title: taskInput.title,
          goal: taskInput.goal,
          parentId: taskInput.parentId ?? ROOT_TASK_ID,
        };
        taskEvents.push({
          type: "task-created",
          task: taskInputForEvent,
          timestamp: task.createdAt,
        });

        // 发布用户消息详情事件
        const goalMessageId = `msg-${taskInput.id}-goal`;
        taskDetailEvents.push({
          type: "task-detail-user-message",
          taskId: taskInput.id,
          messageId: goalMessageId,
          content: taskInput.goal,
          timestamp: task.createdAt,
        });
      }
    }
  }

  // 处理 append-message 输入
  if (input.type === "append-message") {
    const { messageId, content, taskIds } = input.input;
    for (const taskId of taskIds) {
      const task = current.tasks[taskId];
      if (task) {
        taskEvents.push({
          type: "task-message-appended",
          taskId,
          messageId,
          content,
          timestamp: Date.now(),
        });

        taskDetailEvents.push({
          type: "task-detail-user-message",
          taskId,
          messageId,
          content,
          timestamp: Date.now(),
        });
      }
    }
  }

  // 处理状态变化
  for (const [taskId, currentTask] of Object.entries(current.tasks)) {
    const prevTask = prevState.tasks[taskId];
    if (!prevTask) continue;

    // 检查状态变化
    if (prevTask.status !== currentTask.status) {
      switch (currentTask.status) {
        case "processing":
          taskEvents.push({
            type: "task-started",
            taskId,
            timestamp: currentTask.updatedAt,
          });
          break;

        case "succeeded":
          if (currentTask.result && currentTask.result.success) {
            taskEvents.push({
              type: "task-succeeded",
              taskId,
              conclusion: currentTask.result.conclusion,
              timestamp: currentTask.updatedAt,
            });
          }
          break;

        case "failed":
          if (currentTask.result && !currentTask.result.success) {
            if (input.type === "cancel-tasks" && input.taskIds.includes(taskId)) {
              taskEvents.push({
                type: "task-cancelled",
                taskId,
                timestamp: currentTask.updatedAt,
              });
            } else {
              taskEvents.push({
                type: "task-failed",
                taskId,
                error: currentTask.result.error,
                timestamp: currentTask.updatedAt,
              });
            }
          }
          break;
      }
    }
  }

  return { taskEvents, taskDetailEvents };
}

/**
 * Workforce 输出函数
 *
 * 返回副作用函数，接收 dispatch 作为参数
 */
export function output(
  context: OutputContext
): (update: UpdatePack<WorkforceInput, WorkforceState>) => Eff<Dispatch<WorkforceInput>> | null {
  return (update: UpdatePack<WorkforceInput, WorkforceState>): Eff<Dispatch<WorkforceInput>> | null => {
    const { prev, state } = update;

    // 如果已销毁，不产生输出
    if (state.destroyed) {
      return null;
    }

    // 返回副作用函数
    return (dispatch: Dispatch<WorkforceInput>) => {
      const { log } = context;

      // 记录输入信号
      if (prev) {
        const input = prev.input;
        console.log("[Workforce DEBUG] Processing input", input.type);
        log("debug", `处理输入信号: ${input.type}`, getTaskIdFromInput(input), {
          inputType: input.type,
        });
      }

      // 1. 发布事件
      const { taskEvents, taskDetailEvents } = computeEvents(prev, state);
      for (const event of taskEvents) {
        log("info", `发布事件: ${event.type}`, getTaskIdFromEvent(event), {
          eventType: event.type,
        });
        context.taskEventPubSub.pub(event);
      }
      for (const event of taskDetailEvents) {
        context.taskDetailEventPubSub.pub(event);
      }

      // 2. 检测需要调度的情况
      const currentAgentCount = Object.keys(state.workingAgents).length;
      const nextTaskId = getNextReadyTask(state);
      console.log("[Workforce DEBUG] Scheduling check", {
        currentAgentCount,
        maxAgents: state.config.maxAgents,
        nextTaskId,
        taskCount: Object.keys(state.tasks).length,
      });
      if (currentAgentCount < state.config.maxAgents) {
        if (nextTaskId) {
          log("info", "调度新的 Agent", nextTaskId, {
            currentAgentCount,
            maxAgents: state.config.maxAgents,
          });
          dispatch({ type: "schedule-agent", taskId: nextTaskId });
        }
      }

      // 3. 处理 Agent 操作（在 workforce.ts 的 subscribe 中处理）
      // 这里只负责调度逻辑，Agent 的创建和销毁在 subscribe 中处理
    };
  };
}
