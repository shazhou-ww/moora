/**
 * LLM Context 构建函数
 *
 * 负责构建 CallLlmContext，包括消息列表、工具定义、任务查询结果等
 */

import type {
  CallLlmContext,
  CallLlmMessage,
  CallLlmToolDefinition,
} from "@moora/agent-common";

import type { PerspectiveOfLlm, TaskMonitorInfo } from "../../../decl";
import { coordinatorPseudoToolInfos, WF_QUERY_TASKS } from "./pseudo-tools";

// ============================================================================
// 辅助函数：消息构建
// ============================================================================

/**
 * 将 userMessages 和 assiMessages 合并为 CallLlmMessage 列表
 */
function buildConversationMessages(
  perspective: PerspectiveOfLlm
): CallLlmMessage[] {
  const { userMessages, assiMessages } = perspective;

  const userMsgs: CallLlmMessage[] = userMessages.map((m) => ({
    role: "user" as const,
    id: m.id,
    content: m.content,
    timestamp: m.timestamp,
  }));

  const assiMsgs: CallLlmMessage[] = assiMessages
    .filter((m) => !m.streaming)
    .map((m) => ({
      role: "assistant" as const,
      id: m.id,
      streaming: false as const,
      content: !m.streaming ? m.content : "",
      timestamp: m.timestamp,
    }));

  return [...userMsgs, ...assiMsgs];
}

/**
 * 构建 wf-query-tasks 的 tool result 内容
 */
function buildQueryTasksResult(tasks: TaskMonitorInfo[]): string {
  if (tasks.length === 0) {
    return JSON.stringify({ tasks: [], message: "No active tasks" });
  }

  const taskList = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    result: task.result ?? null,
  }));

  return JSON.stringify({ tasks: taskList });
}

// ============================================================================
// 辅助函数：系统提示和工具
// ============================================================================

/**
 * 构建系统提示
 */
function buildSystemPrompt(): string {
  return `You are a coordinator agent that manages tasks in a workforce system.

You have access to the following tools to manage tasks:
- wf-create-tasks: Create new tasks for workers to execute
- wf-append-message: Send additional information to running tasks
- wf-cancel-tasks: Cancel tasks that are no longer needed

The current status of all tasks is provided via the wf-query-tasks tool result.

When responding to user requests:
1. Review the current task status from wf-query-tasks
2. Use the appropriate tools to create, update, or cancel tasks
3. Provide clear responses about what actions you're taking`;
}

/**
 * 构建伪工具的 ToolDefinition 列表
 */
function buildToolDefinitions(): CallLlmToolDefinition[] {
  return coordinatorPseudoToolInfos.map((info) => ({
    name: info.name,
    description: info.description,
    parameters: JSON.stringify(info.parameterSchema),
  }));
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 构建完整的 CallLlmContext
 *
 * 在消息列表末尾追加 wf-query-tasks 的伪 tool call 和 tool result
 */
export function buildLlmContext(perspective: PerspectiveOfLlm): CallLlmContext {
  const conversationMessages = buildConversationMessages(perspective);
  const systemPrompt = buildSystemPrompt();
  const queryTasksResult = buildQueryTasksResult(perspective.topLevelTasks);

  // 按时间戳排序消息
  conversationMessages.sort((a, b) => a.timestamp - b.timestamp);

  // 系统消息作为第一条用户消息
  const systemMessage: CallLlmMessage = {
    role: "user" as const,
    id: "system",
    content: systemPrompt,
    timestamp: 0,
  };

  // wf-query-tasks 作为最后的 tool call 记录
  const queryTasksToolCall = {
    toolCallId: "query-tasks-auto",
    name: WF_QUERY_TASKS,
    parameter: "{}",
    result: queryTasksResult,
    requestedAt: Date.now(),
    respondedAt: Date.now(),
  };

  return {
    messages: [systemMessage, ...conversationMessages],
    scenario: "re-act-loop",
    tools: buildToolDefinitions(),
    toolCalls: [queryTasksToolCall],
    toolChoice: "auto",
  };
}
