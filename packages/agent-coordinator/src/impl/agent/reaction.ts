/**
 * Agent Reaction 函数
 *
 * 将各个 Actor 的 ReactionFn 组合为 AgentReaction
 */

import type {
  Worldscape,
  ReactionFns,
  AgentReaction,
  PerspectiveOfUser,
  PerspectiveOfLlm,
  PerspectiveOfWorkforce,
} from "@/decl";
import { USER, LLM, WORKFORCE } from "@/decl";

/**
 * 创建 Agent Reaction
 *
 * @param reactions - 各个 Actor 的 reaction 函数集合
 * @returns AgentReaction 函数
 */
export function createReaction(reactions: ReactionFns): AgentReaction {
  return (worldscape: Worldscape) => {
    return (dispatch) => {
      // 提取各个 Actor 的 Perspective
      const userPerspective = extractUserPerspective(worldscape);
      const llmPerspective = extractLlmPerspective(worldscape);
      const workforcePerspective = extractWorkforcePerspective(worldscape);

      // 并行执行各个 Actor 的 reaction
      reactions[USER]({ perspective: userPerspective, dispatch });
      reactions[LLM]({ perspective: llmPerspective, dispatch });
      reactions[WORKFORCE]({
        perspective: workforcePerspective,
        dispatch,
      });
    };
  };
}

/**
 * 从 Worldscape 提取 User 的 Perspective
 */
function extractUserPerspective(worldscape: Worldscape): PerspectiveOfUser {
  return {
    // UserObUser
    userMessages: worldscape.userMessages,
    // UserObLlm
    assiMessages: worldscape.assiMessages,
    // UserObWorkforce
    ongoingTopLevelTasks: worldscape.ongoingTopLevelTasks,
  };
}

/**
 * 从 Worldscape 提取 Llm 的 Perspective
 */
function extractLlmPerspective(worldscape: Worldscape): PerspectiveOfLlm {
  return {
    // LlmObUser
    userMessages: worldscape.userMessages,
    // LlmObLlm
    assiMessages: worldscape.assiMessages,
    cutOff: worldscape.cutOff,
    // LlmObWorkforce
    topLevelTasks: worldscape.topLevelTasks,
  };
}

/**
 * 从 Worldscape 提取 Workforce 的 Perspective
 */
function extractWorkforcePerspective(
  worldscape: Worldscape
): PerspectiveOfWorkforce {
  return {
    // WorkforceObUser
    notifiedTaskCompletions: worldscape.notifiedTaskCompletions,
    // WorkforceObLlm
    taskCreateRequests: worldscape.taskCreateRequests,
    messageAppendRequests: worldscape.messageAppendRequests,
    taskCancelRequests: worldscape.taskCancelRequests,
    // WorkforceObWorkforce
    topLevelTaskIds: worldscape.topLevelTaskIds,
    taskCache: worldscape.taskCache,
  };
}
