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
 *
 * PerspectiveOfUser = UserObUser & UserObLlm & UserObToolkit & UserObWorkforce
 */
export function extractUserPerspective(worldscape: Worldscape): PerspectiveOfUser {
  return {
    // UserObUser: 用户消息
    userMessages: worldscape.userMessages,
    // UserObLlm: Llm 发起的信息
    assiMessages: worldscape.assiMessages,
    toolCallRequests: worldscape.toolCallRequests,
    validTasks: worldscape.validTasks,
    messageAppendRequests: worldscape.messageAppendRequests,
    // UserObToolkit: 工具结果
    toolResults: worldscape.toolResults,
    // UserObWorkforce: 任务状态
    topLevelTasks: worldscape.topLevelTasks,
  };
}

/**
 * 从 Worldscape 提取 Llm 的 Perspective
 *
 * PerspectiveOfLlm = LlmObUser & LlmObLlm & LlmObToolkit & LlmObWorkforce
 */
function extractLlmPerspective(worldscape: Worldscape): PerspectiveOfLlm {
  return {
    // LlmObUser: 用户消息
    userMessages: worldscape.userMessages,
    // LlmObLlm: 自己维护的状态
    assiMessages: worldscape.assiMessages,
    llmProceedCutOff: worldscape.llmProceedCutOff,
    toolCallRequests: worldscape.toolCallRequests,
    validTasks: worldscape.validTasks,
    // LlmObToolkit: 工具结果
    toolResults: worldscape.toolResults,
    // LlmObWorkforce: 任务状态
    topLevelTasks: worldscape.topLevelTasks,
  };
}

/**
 * 从 Worldscape 提取 Toolkit 的 Perspective
 *
 * PerspectiveOfToolkit = ToolkitObLlm & ToolkitObToolkit
 */
function extractToolkitPerspective(
  worldscape: Worldscape
): PerspectiveOfToolkit {
  return {
    // ToolkitObLlm: 工具调用请求
    toolCallRequests: worldscape.toolCallRequests,
    // ToolkitObToolkit: 工具结果
    toolResults: worldscape.toolResults,
  };
}

/**
 * 从 Worldscape 提取 Workforce 的 Perspective
 *
 * PerspectiveOfWorkforce = WorkforceObLlm & WorkforceObWorkforce
 */
function extractWorkforcePerspective(
  worldscape: Worldscape
): PerspectiveOfWorkforce {
  return {
    // WorkforceObLlm: Llm 发起的任务和消息请求
    validTasks: worldscape.validTasks,
    messageAppendRequests: worldscape.messageAppendRequests,
    // WorkforceObWorkforce: 自己维护的状态
    appendMessageCutOff: worldscape.appendMessageCutOff,
  };
}
