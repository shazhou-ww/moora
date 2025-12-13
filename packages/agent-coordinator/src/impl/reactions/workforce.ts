/**
 * Workforce Reaction 工厂函数
 */

import { ROOT_TASK_ID } from "@moora/workforce";
import type {
  WORKFORCE,
  ReactionFnOf,
  Workforce,
  NotifyUser,
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

/**
 * 创建 Workforce Reaction
 *
 * Workforce 负责：
 * 1. 处理 Llm 的任务创建、追加消息、取消请求
 * 2. 监听 workforce 的任务事件，更新状态
 * 3. 当顶层任务完成时，通知用户
 */
export function createWorkforceReaction(
  deps: WorkforceReactionDeps
): ReactionFnOf<typeof WORKFORCE> {
  const { workforce, notifyUser } = deps;

  // 订阅 workforce 任务事件
  workforce.subscribeTaskEvent((_event) => {
    // 这里我们需要在外部管理 dispatch 的引用
    // 暂时先实现基础逻辑
  });

  return async ({ perspective, dispatch }) => {
    const {
      taskCreateRequests,
      messageAppendRequests,
      taskCancelRequests,
      topLevelTaskIds,
      taskCache,
    } = perspective;

    // 处理任务创建请求
    for (const request of taskCreateRequests) {
      const task = workforce.getTask(request.taskId);
      if (!task) {
        // 任务不存在，创建它
        workforce.createTasks([
          {
            id: request.taskId,
            title: request.title,
            goal: request.goal,
          },
        ]);

        // 更新任务状态
        dispatch({
          type: "update-task-status",
          taskId: request.taskId,
          status: "ready",
          timestamp: Date.now(),
        });
      }
    }

    // 处理追加消息请求
    for (const request of messageAppendRequests) {
      workforce.appendMessage({
        messageId: request.messageId,
        content: request.content,
        taskIds: request.taskIds,
      });
    }

    // 处理取消任务请求
    for (const request of taskCancelRequests) {
      workforce.cancelTasks(request.taskIds);
    }

    // 检查任务完成并通知用户
    // 注意：notifiedTaskCompletions 现在不在 WorkforcePerspective 中
    // 需要通过其他方式跟踪（比如在 reaction 内部状态中）
    for (const taskId of topLevelTaskIds) {
      const task = workforce.getTask(taskId);
      if (!task) continue;

      // 只处理顶层任务（parentId 为 ROOT_TASK_ID）
      if (task.parentId !== ROOT_TASK_ID) continue;

      const status = workforce.getTaskStatus(taskId);
      if (!status) continue;

      // 检查任务是否完成（成功或失败）
      if (status.status === "succeeded" || status.status === "failed") {
        // 通知用户
        const result =
          status.status === "succeeded"
            ? status.result?.success
              ? status.result.conclusion
              : "Task completed"
            : status.result?.success === false
              ? status.result.error
              : "Task failed";

        const message = `Task "${task.title}" ${status.status === "succeeded" ? "completed successfully" : "failed"}: ${result}`;

        await notifyUser(message);

        // 记录已通知
        dispatch({
          type: "notify-task-completion",
          taskId,
          title: task.title,
          success: status.status === "succeeded",
          result,
          timestamp: Date.now(),
        });

        // 更新任务状态（移除已完成的任务）
        dispatch({
          type: "update-task-status",
          taskId,
          status: status.status,
          result: status.result,
          timestamp: Date.now(),
        });
      }
    }

    // 同步 workforce 中的所有顶层任务状态
    const allTaskIds = workforce.getAllTaskIds();
    for (const taskId of allTaskIds) {
      const task = workforce.getTask(taskId);
      if (!task || task.parentId !== ROOT_TASK_ID) continue;

      const status = workforce.getTaskStatus(taskId);
      if (!status) continue;

      // 如果任务不在缓存中，或状态发生变化，更新它
      const cached = taskCache[taskId];
      if (!cached || cached.status !== status.status) {
        dispatch({
          type: "update-task-status",
          taskId,
          status: status.status,
          result: status.result,
          timestamp: Date.now(),
        });
      }
    }
  };
}
