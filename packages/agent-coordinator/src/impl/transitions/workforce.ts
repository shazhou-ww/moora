/**
 * Workforce Actor 状态转换函数
 */

import type {
  AppearanceOfWorkforce,
  ActionFromWorkforce,
  PerspectiveOfWorkforce,
  NotifyTaskCompletion,
  UpdateTaskStatus,
} from "@/decl";

/**
 * Workforce 的状态转换函数
 *
 * 处理 Workforce 的 Action，更新其 Perspective
 */
export function transitionWorkforce(
  appearance: AppearanceOfWorkforce,
  action: ActionFromWorkforce
): PerspectiveOfWorkforce {
  switch (action.type) {
    case "notify-task-completion":
      return handleNotifyTaskCompletion(appearance, action);
    case "update-task-status":
      return handleUpdateTaskStatus(appearance, action);
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unknown action type: ${(_exhaustive as unknown as { type: string }).type}`);
    }
  }
}

/**
 * 处理通知任务完成
 */
function handleNotifyTaskCompletion(
  appearance: AppearanceOfWorkforce,
  action: NotifyTaskCompletion
): PerspectiveOfWorkforce {
  // 类型断言：Appearance 实际包含了完整的 Worldscape 状态
  const state = appearance as any;
  const { notifiedTaskCompletions } = state;

  return {
    // WorkforceObUser - 记录已通知的任务
    ongoingTopLevelTasks: state.ongoingTopLevelTasks,
    notifiedTaskCompletions: [...notifiedTaskCompletions, action.taskId],

    // WorkforceObLlm - 保持不变
    topLevelTasks: state.topLevelTasks,

    // WorkforceObToolkit - 保持不变
    allTasks: state.allTasks,

    // WorkforceObWorkforce - 保持不变
    topLevelTaskIds: state.topLevelTaskIds,
    taskCache: state.taskCache,
  };
}

/**
 * 处理更新任务状态
 */
function handleUpdateTaskStatus(
  appearance: AppearanceOfWorkforce,
  action: UpdateTaskStatus
): PerspectiveOfWorkforce {
  // 类型断言：Appearance 实际包含了完整的 Worldscape 状态
  const state = appearance as any;
  const { taskCache, topLevelTaskIds } = state;

  // 更新任务缓存
  const existingTask = taskCache[action.taskId];
  const updatedTask = existingTask
    ? {
        ...existingTask,
        status: action.status,
        result: action.result,
      }
    : {
        id: action.taskId,
        title: "Unknown Task",
        parentId: "00000000-0000-0000-0000-000000000000",
        status: action.status,
        result: action.result,
      };

  const updatedCache = {
    ...taskCache,
    [action.taskId]: updatedTask,
  };

  // 如果任务完成或失败，从顶层任务列表中移除
  const shouldRemove =
    action.status === "succeeded" || action.status === "failed";
  const updatedTopLevelTaskIds = shouldRemove
    ? topLevelTaskIds.filter((id) => id !== action.taskId)
    : topLevelTaskIds.includes(action.taskId)
      ? topLevelTaskIds
      : [...topLevelTaskIds, action.taskId];

  return {
    // WorkforceObUser - 保持不变
    ongoingTopLevelTasks: state.ongoingTopLevelTasks,
    notifiedTaskCompletions: state.notifiedTaskCompletions,

    // WorkforceObLlm - 保持不变
    topLevelTasks: state.topLevelTasks,

    // WorkforceObToolkit - 保持不变
    allTasks: state.allTasks,

    // WorkforceObWorkforce - 更新任务缓存和列表
    topLevelTaskIds: updatedTopLevelTaskIds,
    taskCache: updatedCache,
  };
}
