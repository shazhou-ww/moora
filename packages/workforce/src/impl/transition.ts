/**
 * Workforce 状态转换函数
 *
 * 纯函数，处理所有输入信号并返回新状态
 */

import { v4 as uuidv4 } from "uuid";

import { ROOT_TASK_ID } from "../types";
import {
  createTaskInState,
  updateTaskStatus,
  appendUserMessageToTask,
  // appendAssistantMessageToTask, // Currently not used
  // completeAssistantMessageInTask, // Currently not used
  // appendToolCallRequestToTask, // Currently not used
  // appendToolCallResponseToTask, // Currently not used
  checkAndUpdateParentStatus,
} from "./task-tree-helpers";

import type { WorkforceState, WorkforceInput } from "./types";

/**
 * Workforce 状态转换函数
 *
 * @param input - 输入信号
 * @returns 状态更新函数
 */
export function transition(
  input: WorkforceInput
): (state: WorkforceState) => WorkforceState {
  return (state: WorkforceState): WorkforceState => {
    // 如果已销毁，只处理 destroy 输入
    if (state.destroyed && input.type !== "destroy") {
      return state;
    }

    switch (input.type) {
      case "create-tasks": {
        let newState = state;
        for (const taskInput of input.tasks) {
          newState = createTaskInState(newState, {
            id: taskInput.id,
            title: taskInput.title,
            goal: taskInput.goal,
            parentId: taskInput.parentId ?? ROOT_TASK_ID,
          });
        }
        return newState;
      }

      case "append-message": {
        const { messageId, content, taskIds } = input.input;
        let newState = state;
        for (const taskId of taskIds) {
          newState = appendUserMessageToTask(newState, taskId, messageId, content);
        }
        return newState;
      }

      case "cancel-tasks": {
        let newState = state;
        for (const taskId of input.taskIds) {
          const task = newState.tasks[taskId];
          if (!task) continue;
          
          // 只能取消非完成状态的任务
          if (task.status === "succeeded" || task.status === "failed") {
            continue;
          }

          newState = updateTaskStatus(newState, taskId, "failed", {
            success: false,
            error: "Task cancelled",
          });

          // 检查父任务状态
          newState = checkAndUpdateParentStatus(newState, task.parentId);
        }
        return newState;
      }

      case "pseudo-tool-call": {
        const { taskId, call } = input;
        const task = state.tasks[taskId];
        if (!task) return state;

        let newState = state;

        switch (call.type) {
          case "succeed": {
            newState = updateTaskStatus(newState, taskId, "succeeded", {
              success: true,
              conclusion: call.params.conclusion,
            });
            // 移除 working agent 标记
            const { [taskId]: _, ...workingAgents } = newState.workingAgents;
            newState = { ...newState, workingAgents };
            // 检查父任务状态
            newState = checkAndUpdateParentStatus(newState, task.parentId);
            break;
          }

          case "fail": {
            newState = updateTaskStatus(newState, taskId, "failed", {
              success: false,
              error: call.params.error,
            });
            // 移除 working agent 标记
            const { [taskId]: __, ...workingAgents2 } = newState.workingAgents;
            newState = { ...newState, workingAgents: workingAgents2 };
            // 检查父任务状态
            newState = checkAndUpdateParentStatus(newState, task.parentId);
            break;
          }

          case "breakdown": {
            // 创建子任务
            for (const subtask of call.params.subtasks) {
              const subtaskId = uuidv4();
              newState = createTaskInState(newState, {
                id: subtaskId,
                title: subtask.title,
                goal: subtask.description,
                parentId: taskId,
              });
            }
            // 更新父任务状态为 pending
            const parentTask = newState.tasks[taskId];
            if (parentTask && parentTask.status === "processing") {
              newState = updateTaskStatus(newState, taskId, "pending");
            }
            // 移除 working agent 标记
            const { [taskId]: ___, ...workingAgents3 } = newState.workingAgents;
            newState = { ...newState, workingAgents: workingAgents3 };
            break;
          }
        }

        return newState;
      }

      case "schedule-agent": {
        const { taskId } = input;
        const task = state.tasks[taskId];
        if (!task) return state;

        // 只有 ready 状态可以开始处理
        if (task.status !== "ready") return state;

        // 检查是否超过最大 Agent 数
        const currentAgentCount = Object.keys(state.workingAgents).length;
        if (currentAgentCount >= state.config.maxAgents) return state;

        // 更新任务状态为 processing
        const newState = updateTaskStatus(state, taskId, "processing");
        
        // 添加 working agent 标记
        return {
          ...newState,
          workingAgents: {
            ...newState.workingAgents,
            [taskId]: true,
          },
        };
      }

      case "agent-completed": {
        const { taskId } = input;
        // 移除 working agent 标记
        const { [taskId]: _, ...workingAgents } = state.workingAgents;
        return {
          ...state,
          workingAgents,
        };
      }

      case "update-worldscape": {
        const { taskId, worldscape } = input;
        const task = state.tasks[taskId];
        if (!task) return state;

        const updatedTask = {
          ...task,
          worldscape,
        };

        return {
          ...state,
          tasks: {
            ...state.tasks,
            [taskId]: updatedTask,
          },
        };
      }

      case "destroy": {
        return {
          ...state,
          destroyed: true,
          workingAgents: {},
        };
      }

      default:
        return state;
    }
  };
}
