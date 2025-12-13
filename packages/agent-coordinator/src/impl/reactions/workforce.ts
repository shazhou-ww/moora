/**
 * Workforce Reaction 工厂函数
 */

import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";
import { ROOT_TASK_ID } from "@moora/workforce";
import type {
  WORKFORCE,
  ReactionFnOf,
  Workforce,
  NotifyUser,
  PerspectiveOfWorkforce,
  Actuation,
  TaskMonitorInfo,
} from "@/decl";

/**
 * Workforce Reaction 依赖
 */
export type WorkforceReactionDeps = {
  /** Workforce 实例 */
  workforce: Workforce;
  /** 通知用户的回调函数 */
  notifyUser: NotifyUser;
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 处理新任务创建
 *
 * 检查 validTasks 中的任务是否已在 workforce 中创建，未创建则创建
 */
function processTaskCreation(
  perspective: PerspectiveOfWorkforce,
  workforce: Workforce
): void {
  const { validTasks } = perspective;

  for (const task of validTasks) {
    // 检查任务是否已存在
    const existingTask = workforce.getTask(task.id);
    if (existingTask) {
      continue;
    }

    // 创建任务
    workforce.createTasks([
      {
        id: task.id,
        title: task.title,
        goal: task.goal,
      },
    ]);
  }
}

/**
 * 处理消息追加请求
 *
 * 只处理 timestamp > appendMessageCutOff 的新请求
 */
function processMessageAppend(
  perspective: PerspectiveOfWorkforce,
  workforce: Workforce
): void {
  const { messageAppendRequests, appendMessageCutOff } = perspective;

  const newRequests = messageAppendRequests.filter(
    (req) => req.timestamp > appendMessageCutOff
  );

  for (const request of newRequests) {
    workforce.appendMessage({
      messageId: request.messageId,
      content: request.content,
      taskIds: request.taskIds,
    });
  }
}

/**
 * 获取所有顶层任务的状态
 */
function getTopLevelTaskStatuses(
  workforce: Workforce
): TaskMonitorInfo[] {
  const topLevelTaskIds = workforce.getChildTaskIds(ROOT_TASK_ID);
  const statuses: TaskMonitorInfo[] = [];

  for (const taskId of topLevelTaskIds) {
    const task = workforce.getTask(taskId);
    const status = workforce.getTaskStatus(taskId);

    if (!task || !status) continue;

    statuses.push({
      id: taskId,
      title: task.title,
      status: status.status,
      result: status.result,
    });
  }

  return statuses;
}

/**
 * 同步任务状态到 coordinator
 *
 * 比较 workforce 中的实际状态与 perspective 中的状态，dispatch 更新
 */
function syncTaskStatuses(
  perspective: PerspectiveOfWorkforce,
  workforce: Workforce,
  dispatch: Dispatch<Actuation>,
  notifyUser: NotifyUser
): void {
  const { validTasks } = perspective;
  const currentStatuses = getTopLevelTaskStatuses(workforce);

  for (const status of currentStatuses) {
    // 找到对应的 validTask
    const validTask = validTasks.find((t) => t.id === status.id);
    if (!validTask) continue;

    // Dispatch 状态更新
    dispatch({
      type: "update-task-status",
      taskId: status.id,
      status: status.status,
      result: status.result,
      timestamp: Date.now(),
    });

    // 如果任务完成，通知用户
    if (status.status === "succeeded" || status.status === "failed") {
      const resultMessage =
        status.status === "succeeded"
          ? status.result?.success
            ? status.result.conclusion
            : "Task completed"
          : status.result?.success === false
            ? status.result.error
            : "Task failed";

      const message = `Task "${status.title}" ${status.status === "succeeded" ? "completed successfully" : "failed"}: ${resultMessage}`;

      Promise.resolve(notifyUser(message)).catch(() => {
        // 忽略通知错误
      });
    }
  }
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 创建 Workforce Reaction
 *
 * Workforce 负责：
 * 1. 根据 validTasks 创建任务
 * 2. 根据 messageAppendRequests 投递消息
 * 3. 同步任务状态到 coordinator
 */
export function createWorkforceReaction(
  deps: WorkforceReactionDeps
): ReactionFnOf<typeof WORKFORCE> {
  const { workforce, notifyUser } = deps;

  const reaction: Eff<{
    perspective: PerspectiveOfWorkforce;
    dispatch: Dispatch<Actuation>;
  }> = (ctx) => {
    const { perspective, dispatch } = ctx;

    // 1. 处理新任务创建
    processTaskCreation(perspective, workforce);

    // 2. 处理消息追加请求
    processMessageAppend(perspective, workforce);

    // 3. 同步任务状态
    syncTaskStatuses(perspective, workforce, dispatch, notifyUser);
  };

  return reaction;
}
