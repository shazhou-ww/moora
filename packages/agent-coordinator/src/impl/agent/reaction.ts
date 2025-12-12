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
 * 注意：实际提取的是 Appearance（输入），因为 reaction 需要基于输入触发副作用
 */
function extractLlmPerspective(worldscape: Worldscape): PerspectiveOfLlm {
  return {
    // UserObLlm - 从 User 接收的消息
    userMessages: worldscape.userMessages,
    // LlmObLlm - 自己维护的状态
    assiMessages: worldscape.assiMessages,
    cutOff: worldscape.cutOff,
    // ToolkitObLlm - 从 Toolkit 接收的结果
    toolResults: worldscape.toolResults,
    // WorkforceObLlm - 从 Workforce 接收的任务
    topLevelTasks: worldscape.topLevelTasks,
  } as unknown as PerspectiveOfLlm;
}

/**
 * 从 Worldscape 提取 Toolkit 的 Perspective
 * 注意：实际提取的是 Appearance（输入）
 */
function extractToolkitPerspective(
  worldscape: Worldscape
): PerspectiveOfToolkit {
  return {
    // LlmObToolkit - 从 Llm 接收的请求
    toolCallRequests: worldscape.toolCallRequests,
    // ToolkitObToolkit - 自己维护的结果
    toolResults: worldscape.toolResults,
  } as unknown as PerspectiveOfToolkit;
}

/**
 * 从 Worldscape 提取 Workforce 的 Perspective
 * 注意：实际提取的是 Appearance（输入）
 */
function extractWorkforcePerspective(
  worldscape: Worldscape
): PerspectiveOfWorkforce {
  return {
    // LlmObWorkforce - 从 Llm 接收的请求
    taskCreateRequests: worldscape.taskCreateRequests,
    messageAppendRequests: worldscape.messageAppendRequests,
    taskCancelRequests: worldscape.taskCancelRequests,
    // WorkforceObWorkforce - 自己维护的状态
    topLevelTaskIds: worldscape.topLevelTaskIds,
    taskCache: worldscape.taskCache,
  } as unknown as PerspectiveOfWorkforce;
}
