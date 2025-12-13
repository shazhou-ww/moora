/**
 * Workforce Reaction 工厂函数
 */

import { ROOT_TASK_ID } from "@moora/workforce";
import { stateful } from "@moora/effects";
import type { Dispatch } from "@moora/automata";

import type {
  WORKFORCE,
  ReactionFnOf,
  Workforce,
  NotifyUser,
  PerspectiveOfWorkforce,
  Actuation,
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
 * Workforce Reaction 的内部状态
 */
type WorkforceReactionState = {
  /** 已创建的任务 ID 集合 */
  createdTaskIds: Set<string>;
  /** 已通知完成的任务 ID 集合 */
  notifiedTaskIds: Set<string>;
};

/**
 * 创建 Workforce Reaction
 *
 * Workforce 负责：
 * 1. 根据 validTasks 创建任务
 * 2. 根据 messageAppendRequests 投递消息
 * 3. 监听任务状态变化，通知用户
 */
export function createWorkforceReaction(
  deps: WorkforceReactionDeps
): ReactionFnOf<typeof WORKFORCE> {
  const { workforce, notifyUser } = deps;

  return stateful<
    { perspective: PerspectiveOfWorkforce; dispatch: Dispatch<Actuation> },
    WorkforceReactionState
  >(
    { createdTaskIds: new Set(), notifiedTaskIds: new Set() },
    ({ context: ctx, state, setState }) => {
      const { perspective, dispatch } = ctx;
      const { validTasks, messageAppendRequests, appendMessageCutOff } = perspective;

      // 1. 处理新任务创建
      for (const task of validTasks) {
        if (state.createdTaskIds.has(task.id)) {
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

        // 记录已创建
        setState((prev) => ({
          ...prev,
          createdTaskIds: new Set([...prev.createdTaskIds, task.id]),
        }));

        // 更新任务状态
        dispatch({
          type: "update-task-status",
          taskId: task.id,
          status: "ready",
          timestamp: Date.now(),
        });
      }

      // 2. 处理消息追加请求（只处理新的）
      const newAppendRequests = messageAppendRequests.filter(
        (req) => req.timestamp > appendMessageCutOff
      );

      for (const request of newAppendRequests) {
        workforce.appendMessage({
          messageId: request.messageId,
          content: request.content,
          taskIds: request.taskIds,
        });
      }

      // 3. 检查任务状态并通知用户
      for (const task of validTasks) {
        if (state.notifiedTaskIds.has(task.id)) {
          continue;
        }

        const status = workforce.getTaskStatus(task.id);
        if (!status) continue;

        const taskData = workforce.getTask(task.id);
        if (!taskData || taskData.parentId !== ROOT_TASK_ID) continue;

        // 检查任务是否完成
        if (status.status === "succeeded" || status.status === "failed") {
          const resultMessage =
            status.status === "succeeded"
              ? status.result?.success
                ? status.result.conclusion
                : "Task completed"
              : status.result?.success === false
                ? status.result.error
                : "Task failed";

          const message = `Task "${task.title}" ${status.status === "succeeded" ? "completed successfully" : "failed"}: ${resultMessage}`;

          // 异步通知用户
          Promise.resolve(notifyUser(message)).catch(() => {
            // 忽略通知错误
          });

          // 记录已通知
          setState((prev) => ({
            ...prev,
            notifiedTaskIds: new Set([...prev.notifiedTaskIds, task.id]),
          }));

          // 更新任务状态
          dispatch({
            type: "update-task-status",
            taskId: task.id,
            status: status.status,
            result: status.result,
            timestamp: Date.now(),
          });
        }
      }

      // 4. 同步所有任务的状态变化
      const allTaskIds = workforce.getAllTaskIds();
      for (const taskId of allTaskIds) {
        const taskData = workforce.getTask(taskId);
        if (!taskData || taskData.parentId !== ROOT_TASK_ID) continue;

        const status = workforce.getTaskStatus(taskId);
        if (!status) continue;

        // 如果任务在 validTasks 中但状态发生变化，更新它
        const validTask = validTasks.find((t) => t.id === taskId);
        if (validTask) {
          dispatch({
            type: "update-task-status",
            taskId,
            status: status.status,
            result: status.result,
            timestamp: Date.now(),
          });
        }
      }
    }
  );
}
