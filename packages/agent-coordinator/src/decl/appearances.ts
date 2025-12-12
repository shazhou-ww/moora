/**
 * Appearances 类型定义
 *
 * Appearance 是所有指向该 Actor 的 Observation 的并集（入边）
 */

import type { UserMessage, AssiMessage, TaskMonitorInfo, ToolCallRequest, ToolResult } from "./observations";

/**
 * User 的 Appearance
 *
 * User 能看到的所有状态
 */
export type AppearanceOfUser = {
  userMessages: UserMessage[];
  assiMessages: AssiMessage[];
  ongoingTopLevelTasks: TaskMonitorInfo[];
  toolResults: ToolResult[];
};

/**
 * Llm 的 Appearance
 *
 * Llm 能看到的所有状态
 */
export type AppearanceOfLlm = {
  userMessages: UserMessage[];
  assiMessages: AssiMessage[];
  cutOff: number;
  topLevelTasks: Record<string, TaskMonitorInfo>;
  toolResults: ToolResult[];
};

/**
 * Toolkit 的 Appearance
 *
 * Toolkit 能看到的所有状态
 */
export type AppearanceOfToolkit = {
  toolCallRequests: ToolCallRequest[];
  toolResults: ToolResult[];
  allTasks: Record<string, TaskMonitorInfo>;
};

/**
 * Workforce 的 Appearance
 *
 * Workforce 能看到的所有状态
 */
export type AppearanceOfWorkforce = {
  notifiedTaskCompletions: string[];
  taskCreateRequests: Array<{
    requestId: string;
    taskId: string;
    title: string;
    goal: string;
    timestamp: number;
  }>;
  messageAppendRequests: Array<{
    requestId: string;
    messageId: string;
    content: string;
    taskIds: string[];
    timestamp: number;
  }>;
  taskCancelRequests: Array<{
    requestId: string;
    taskIds: string[];
    timestamp: number;
  }>;
  topLevelTaskIds: string[];
  taskCache: Record<string, TaskMonitorInfo>;
};
