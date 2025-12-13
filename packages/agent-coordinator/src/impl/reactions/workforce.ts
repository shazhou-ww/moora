/**
 * Workforce Reaction 工厂函数
 */

import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";
import type {
  WORKFORCE,
  ReactionFnOf,
  Workforce,
  NotifyUser,
  PerspectiveOfWorkforce,
  Actuation,
} from "@/decl";

/**
 * Nullable 工具类型
 */
type Nullable<T> = T | null;

/**
 * Logger 接口
 */
type Logger = {
  info: (message: string, data?: Record<string, unknown>) => void;
};

/**
 * Workforce Reaction 依赖
 */
export type WorkforceReactionDeps = {
  /** Workforce 实例 */
  workforce: Workforce;
  /** 通知用户的回调函数 */
  notifyUser: NotifyUser;
  /** 可选的 Logger */
  logger: Nullable<Logger>;
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 处理新任务创建
 *
 * 检查 validTasks 中的任务是否已在 workforce 中创建，未创建则创建
 *
 * 注意：workforce.createTasks() 内部使用异步 dispatch，
 * 所以同步检查 getTask() 可能返回 undefined。
 * 任务状态的同步通过事件订阅来处理。
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

    // 创建任务（异步，状态通过事件同步）
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

// ============================================================================
// 主函数
// ============================================================================

/**
 * 创建 Workforce Reaction
 *
 * Workforce 负责：
 * 1. 根据 validTasks 创建任务
 * 2. 根据 messageAppendRequests 投递消息
 * 3. 通过订阅 workforce 事件同步任务状态到 coordinator
 */
export function createWorkforceReaction(
  deps: WorkforceReactionDeps
): ReactionFnOf<typeof WORKFORCE> {
  const { workforce, notifyUser, logger } = deps;

  // 保存 dispatch 引用，在事件回调中使用
  let currentDispatch: Nullable<Dispatch<Actuation>> = null;

  // 订阅 workforce 任务事件，通过事件驱动更新任务状态
  workforce.subscribeTaskEvent((event) => {
    if (!currentDispatch) return;

    logger?.info("[WorkforceReaction] Task event received", {
      eventType: event.type,
      taskId: "taskId" in event ? event.taskId : "task" in event ? event.task.id : "unknown",
    });

    switch (event.type) {
      case "task-created": {
        currentDispatch({
          type: "update-task-status",
          taskId: event.task.id,
          status: "ready",
          timestamp: event.timestamp,
        });
        break;
      }
      case "task-started": {
        currentDispatch({
          type: "update-task-status",
          taskId: event.taskId,
          status: "processing",
          timestamp: event.timestamp,
        });
        break;
      }
      case "task-succeeded": {
        currentDispatch({
          type: "update-task-status",
          taskId: event.taskId,
          status: "succeeded",
          result: { success: true, conclusion: event.conclusion },
          timestamp: event.timestamp,
        });
        notifyTaskCompletion(event.taskId, "succeeded", event.conclusion, workforce, notifyUser);
        break;
      }
      case "task-failed": {
        currentDispatch({
          type: "update-task-status",
          taskId: event.taskId,
          status: "failed",
          result: { success: false, error: event.error },
          timestamp: event.timestamp,
        });
        notifyTaskCompletion(event.taskId, "failed", event.error, workforce, notifyUser);
        break;
      }
      case "task-cancelled": {
        currentDispatch({
          type: "update-task-status",
          taskId: event.taskId,
          status: "failed",
          result: { success: false, error: "Task cancelled" },
          timestamp: event.timestamp,
        });
        break;
      }
    }
  });

  const reaction: Eff<{
    perspective: PerspectiveOfWorkforce;
    dispatch: Dispatch<Actuation>;
  }> = (ctx) => {
    const { perspective, dispatch } = ctx;

    // 更新 dispatch 引用
    currentDispatch = dispatch;

    // 1. 处理新任务创建
    processTaskCreation(perspective, workforce);

    // 2. 处理消息追加请求
    processMessageAppend(perspective, workforce);
  };

  return reaction;
}

// ============================================================================
// 辅助函数：通知任务完成
// ============================================================================

/**
 * 通知用户任务完成
 */
function notifyTaskCompletion(
  taskId: string,
  status: "succeeded" | "failed",
  message: string,
  workforce: Workforce,
  notifyUser: NotifyUser
): void {
  const task = workforce.getTask(taskId);
  const title = task?.title ?? "Unknown task";

  const notification =
    status === "succeeded"
      ? `Task "${title}" completed successfully: ${message}`
      : `Task "${title}" failed: ${message}`;

  Promise.resolve(notifyUser(notification)).catch(() => {
    // 忽略通知错误
  });
}
