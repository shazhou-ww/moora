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
  PerspectiveOfToolkit,
  PerspectiveOfWorkforce,
} from "@/decl";
import { USER, LLM, TOOLKIT, WORKFORCE } from "@/decl";

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
      const toolkitPerspective = extractToolkitPerspective(worldscape);
      const workforcePerspective = extractWorkforcePerspective(worldscape);

      // 并行执行各个 Actor 的 reaction
      reactions[USER]({ perspective: userPerspective, dispatch });
      reactions[LLM]({ perspective: llmPerspective, dispatch });
      reactions[TOOLKIT]({ perspective: toolkitPerspective, dispatch });
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
    // UserObUser & UserObLlm
    userMessages: worldscape.userMessages,
  };
}

/**
 * 从 Worldscape 提取 Llm 的 Perspective
 */
function extractLlmPerspective(worldscape: Worldscape): PerspectiveOfLlm {
  return {
    // UserObLlm
    userMessages: worldscape.userMessages,
    // LlmObUser & LlmObLlm
    assiMessages: worldscape.assiMessages,
    cutOff: worldscape.cutOff,
    // LlmObToolkit
    toolCallRequests: worldscape.toolCallRequests,
    // ToolkitObLlm
    toolResults: worldscape.toolResults,
    // LlmObWorkforce
    taskCreateRequests: worldscape.taskCreateRequests,
    messageAppendRequests: worldscape.messageAppendRequests,
    taskCancelRequests: worldscape.taskCancelRequests,
    // WorkforceObLlm
    topLevelTasks: worldscape.topLevelTasks,
  };
}

/**
 * 从 Worldscape 提取 Toolkit 的 Perspective
 */
function extractToolkitPerspective(
  worldscape: Worldscape
): PerspectiveOfToolkit {
  return {
    // ToolkitObLlm
    toolCallRequests: worldscape.toolCallRequests,
    // ToolkitObToolkit
    toolResults: worldscape.toolResults,
    // ToolkitObWorkforce
    allTasks: worldscape.allTasks,
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
    ongoingTopLevelTasks: worldscape.ongoingTopLevelTasks,
    notifiedTaskCompletions: worldscape.notifiedTaskCompletions,
    // WorkforceObLlm
    topLevelTasks: worldscape.topLevelTasks,
    // WorkforceObToolkit
    allTasks: worldscape.allTasks,
    // LlmObWorkforce
    taskCreateRequests: worldscape.taskCreateRequests,
    messageAppendRequests: worldscape.messageAppendRequests,
    taskCancelRequests: worldscape.taskCancelRequests,
    // WorkforceObWorkforce
    topLevelTaskIds: worldscape.topLevelTaskIds,
    taskCache: worldscape.taskCache,
  };
}
