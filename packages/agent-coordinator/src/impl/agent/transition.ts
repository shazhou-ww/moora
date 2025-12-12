/**
 * Agent 状态转换函数
 */

import type { Worldscape, Actuation } from "@/decl";
import {
  USER,
  LLM,
  TOOLKIT,
  WORKFORCE,
  type AppearanceOfUser,
  type AppearanceOfLlm,
  type AppearanceOfToolkit,
  type AppearanceOfWorkforce,
  type ActionFromUser,
  type ActionFromLlm,
  type ActionFromToolkit,
  type ActionFromWorkforce,
} from "@/decl";
import {
  transitionUser,
  transitionLlm,
  transitionToolkit,
  transitionWorkforce,
} from "@/impl/transitions";

/**
 * Agent 的状态转换函数
 *
 * 根据 Action 类型分发到对应 Actor 的 transition 函数
 */
export function transitionAgent(
  action: Actuation
): (worldscape: Worldscape) => Worldscape {
  return (worldscape: Worldscape): Worldscape => {
    // 根据 action type 判断是哪个 Actor 的 Action
    if (action.type === "send-user-message") {
      return transitionForActor(
        worldscape,
        USER,
        action as ActionFromUser,
        transitionUser
      );
    }

    if (
      action.type === "start-assi-message-stream" ||
      action.type === "end-assi-message-stream" ||
      action.type === "request-create-task" ||
      action.type === "request-append-message" ||
      action.type === "request-cancel-tasks" ||
      action.type === "call-tool"
    ) {
      return transitionForActor(
        worldscape,
        LLM,
        action as ActionFromLlm,
        transitionLlm
      );
    }

    if (action.type === "return-tool-result") {
      return transitionForActor(
        worldscape,
        TOOLKIT,
        action as ActionFromToolkit,
        transitionToolkit
      );
    }

    if (
      action.type === "notify-task-completion" ||
      action.type === "update-task-status"
    ) {
      return transitionForActor(
        worldscape,
        WORKFORCE,
        action as ActionFromWorkforce,
        transitionWorkforce
      );
    }

    throw new Error(`Unknown action type: ${(action as unknown as { type: string }).type}`);
  };
}

/**
 * 为特定 Actor 执行状态转换
 */
function transitionForActor<
  Actor extends typeof USER | typeof LLM | typeof TOOLKIT | typeof WORKFORCE,
>(
  worldscape: Worldscape,
  actor: Actor,
  action:
    | ActionFromUser
    | ActionFromLlm
    | ActionFromToolkit
    | ActionFromWorkforce,
  transitionFn:
    | typeof transitionUser
    | typeof transitionLlm
    | typeof transitionToolkit
    | typeof transitionWorkforce
): Worldscape {
  // 提取该 Actor 的 Appearance
  const appearance = extractAppearance(worldscape, actor);

  // 执行状态转换
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newPerspective = transitionFn(appearance as any, action as any);

  // 将新的 Perspective 合并回 Worldscape
  return {
    ...worldscape,
    ...newPerspective,
  };
}

/**
 * 从 Worldscape 提取特定 Actor 的 Appearance
 */
function extractAppearance(
  worldscape: Worldscape,
  actor: typeof USER | typeof LLM | typeof TOOLKIT | typeof WORKFORCE
): AppearanceOfUser | AppearanceOfLlm | AppearanceOfToolkit | AppearanceOfWorkforce {
  if (actor === USER) {
    return {
      userMessages: worldscape.userMessages,
      notifiedTaskCompletions: worldscape.notifiedTaskCompletions,
    } as AppearanceOfUser;
  }

  if (actor === LLM) {
    return {
      userMessages: worldscape.userMessages,
      assiMessages: worldscape.assiMessages,
      cutOff: worldscape.cutOff,
      topLevelTasks: worldscape.topLevelTasks,
      toolResults: worldscape.toolResults,
    } as AppearanceOfLlm;
  }

  if (actor === TOOLKIT) {
    return {
      toolCallRequests: worldscape.toolCallRequests,
      toolResults: worldscape.toolResults,
      allTasks: worldscape.allTasks,
    } as AppearanceOfToolkit;
  }

  if (actor === WORKFORCE) {
    return {
      notifiedTaskCompletions: worldscape.notifiedTaskCompletions,
      taskCreateRequests: worldscape.taskCreateRequests,
      messageAppendRequests: worldscape.messageAppendRequests,
      taskCancelRequests: worldscape.taskCancelRequests,
      topLevelTaskIds: worldscape.topLevelTaskIds,
      taskCache: worldscape.taskCache,
    } as AppearanceOfWorkforce;
  }

  throw new Error(`Unknown actor: ${actor}`);
}
