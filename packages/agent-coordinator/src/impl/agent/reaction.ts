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
  TaskMonitorInfo,
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
 * User 能看到：自己的消息、Llm 的回复、工具结果、任务状态
 */
function extractUserPerspective(worldscape: Worldscape): PerspectiveOfUser {
  // 从 taskCache 计算 ongoingTopLevelTasks（筛选出 ongoing 状态的任务）
  const ongoingTopLevelTasks: TaskMonitorInfo[] = worldscape.topLevelTaskIds
    .map((id: string) => worldscape.taskCache[id])
    .filter((task): task is TaskMonitorInfo => 
      task !== undefined && 
      task.status !== "succeeded" && 
      task.status !== "failed"
    );

  return {
    // UserObUser: 自己维护的用户消息和已通知的任务完成事件
    userMessages: worldscape.userMessages,
    notifiedTaskCompletions: worldscape.notifiedTaskCompletions,
    // UserObLlm: Llm 的助手消息
    assiMessages: worldscape.assiMessages,
    // UserObToolkit: Toolkit 的工具结果
    toolResults: worldscape.toolResults,
    // UserObWorkforce: Workforce 的任务信息（计算得出）
    ongoingTopLevelTasks,
  };
}

/**
 * 从 Worldscape 提取 Llm 的 Perspective
 *
 * Llm 能看到：用户消息、自己的回复、工具结果、任务状态、工具调用请求、任务请求
 */
function extractLlmPerspective(worldscape: Worldscape): PerspectiveOfLlm {
  // 从 taskCache 构建 topLevelTasks Map
  const topLevelTasks: Record<string, TaskMonitorInfo> = {};
  for (const id of worldscape.topLevelTaskIds) {
    const task = worldscape.taskCache[id];
    if (task) {
      topLevelTasks[id] = task;
    }
  }

  return {
    // LlmObUser: User 的用户消息
    userMessages: worldscape.userMessages,
    // LlmObLlm: 自己维护的状态
    assiMessages: worldscape.assiMessages,
    cutOff: worldscape.cutOff,
    // LlmObToolkit: Toolkit 的工具结果
    toolResults: worldscape.toolResults,
    // LlmObWorkforce: Workforce 的任务详情（计算得出）
    topLevelTasks,
    // ToolkitObLlm: 工具调用请求
    toolCallRequests: worldscape.toolCallRequests,
    // WorkforceObLlm: 任务请求
    taskCreateRequests: worldscape.taskCreateRequests,
    messageAppendRequests: worldscape.messageAppendRequests,
    taskCancelRequests: worldscape.taskCancelRequests,
  };
}

/**
 * 从 Worldscape 提取 Toolkit 的 Perspective
 *
 * Toolkit 能看到：Llm 的工具调用请求、自己的工具结果缓存
 */
function extractToolkitPerspective(
  worldscape: Worldscape
): PerspectiveOfToolkit {
  return {
    // ToolkitObLlm: Llm 的工具调用请求
    toolCallRequests: worldscape.toolCallRequests,
    // ToolkitObToolkit: 自己维护的工具结果
    toolResults: worldscape.toolResults,
  };
}

/**
 * 从 Worldscape 提取 Workforce 的 Perspective
 *
 * Workforce 能看到：Llm 的任务请求、自己维护的任务状态
 */
function extractWorkforcePerspective(
  worldscape: Worldscape
): PerspectiveOfWorkforce {
  return {
    // WorkforceObLlm: Llm 的任务请求
    taskCreateRequests: worldscape.taskCreateRequests,
    messageAppendRequests: worldscape.messageAppendRequests,
    taskCancelRequests: worldscape.taskCancelRequests,
    // WorkforceObWorkforce: 自己维护的状态
    topLevelTaskIds: worldscape.topLevelTaskIds,
    taskCache: worldscape.taskCache,
  };
}

/**
 * 导出 extractUserPerspective 函数供外部使用
 */
export { extractUserPerspective };
