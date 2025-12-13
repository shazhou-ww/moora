/**
 * Workforce Actor 状态转换函数
 */

import type {
  AppearanceOfWorkforce,
  ActionFromWorkforce,
  UpdateTaskStatus,
} from "@/decl";

/**
 * Workforce 的状态转换函数
 *
 * 处理 Workforce 的 Action，更新其 Appearance
 */
export function transitionWorkforce(
  appearance: AppearanceOfWorkforce,
  action: ActionFromWorkforce
): Partial<AppearanceOfWorkforce> {
  // ActionFromWorkforce 目前只有 UpdateTaskStatus 一种类型
  return handleUpdateTaskStatus(appearance, action);
}

/**
 * 处理更新任务状态
 *
 * 更新 topLevelTasks 列表中对应任务的状态
 */
function handleUpdateTaskStatus(
  appearance: AppearanceOfWorkforce,
  action: UpdateTaskStatus
): Partial<AppearanceOfWorkforce> {
  const { topLevelTasks } = appearance;

  // 查找是否已存在该任务
  const existingIndex = topLevelTasks.findIndex(
    (task) => task.id === action.taskId
  );

  let updatedTasks;

  if (existingIndex >= 0) {
    // 更新现有任务
    updatedTasks = topLevelTasks.map((task) =>
      task.id === action.taskId
        ? {
            ...task,
            status: action.status,
            result: action.result,
          }
        : task
    );
  } else {
    // 新任务：这种情况不应该发生，因为任务应该先通过 validTasks 创建
    // 但为了健壮性，我们还是处理这种情况
    updatedTasks = [
      ...topLevelTasks,
      {
        id: action.taskId,
        title: "Unknown Task",
        status: action.status,
        result: action.result,
      },
    ];
  }

  return {
    topLevelTasks: updatedTasks,
  };
}
