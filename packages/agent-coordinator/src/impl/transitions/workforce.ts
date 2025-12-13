/**
 * Workforce Actor 状态转换函数
 */

import type {
  PerspectiveOfWorkforce,
  ActionFromWorkforce,
  NotifyTaskCompletion,
  UpdateTaskStatus,
} from "@/decl";

/**
 * Workforce 的状态转换函数
 *
 * 处理 Workforce 的 Action，更新其 Perspective
 */
export function transitionWorkforce(
  perspective: PerspectiveOfWorkforce,
  action: ActionFromWorkforce
): Partial<PerspectiveOfWorkforce> {
  switch (action.type) {
    case "notify-task-completion":
      return handleNotifyTaskCompletion(perspective, action);
    case "update-task-status":
      return handleUpdateTaskStatus(perspective, action);
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unknown action type: ${(_exhaustive as unknown as { type: string }).type}`);
    }
  }
}

/**
 * 处理通知任务完成
 *
 * 注意：notifiedTaskCompletions 不在 WorkforcePerspective 中
 * 这个 action 目前只记录日志，实际状态由 workforce 实例管理
 */
function handleNotifyTaskCompletion(
  perspective: PerspectiveOfWorkforce,
  _action: NotifyTaskCompletion
): Partial<PerspectiveOfWorkforce> {
  // 保持不变，notification 的状态由 reaction 层处理
  return perspective;
}

/**
 * 处理更新任务状态
 */
function handleUpdateTaskStatus(
  perspective: PerspectiveOfWorkforce,
  action: UpdateTaskStatus
): Partial<PerspectiveOfWorkforce> {
  const { taskCache, topLevelTaskIds } = perspective;

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
    // WorkforceObLlm - 保持不变（任务请求列表）
    taskCreateRequests: perspective.taskCreateRequests,
    messageAppendRequests: perspective.messageAppendRequests,
    taskCancelRequests: perspective.taskCancelRequests,
    // WorkforceObWorkforce - 更新任务缓存和列表
    topLevelTaskIds: updatedTopLevelTaskIds,
    taskCache: updatedCache,
  };
}
