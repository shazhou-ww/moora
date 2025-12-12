/**
 * Perspectives 类型定义
 *
 * Perspective 是所有该 Actor 发出的 Observation 的并集（出边）
 */

import type { UserMessage, AssiMessage, TaskMonitorInfo, ToolCallRequest, ToolResult } from "./observations";

/**
 * User 的 Perspective
 *
 * User 输出的所有状态
 */
export type PerspectiveOfUser = {
  userMessages: UserMessage[];
  assiMessages: AssiMessage[];
  ongoingTopLevelTasks: TaskMonitorInfo[];
  toolResults: ToolResult[];
};

/**
 * Llm 的 Perspective
 *
 * Llm 输出的所有状态
 */
export type PerspectiveOfLlm = {
  userMessages: UserMessage[];
  assiMessages: AssiMessage[];
  cutOff: number;
  topLevelTasks: Record<string, TaskMonitorInfo>;
  toolCallRequests: ToolCallRequest[];
  toolResults: ToolResult[];
};

/**
 * Toolkit 的 Perspective
 *
 * Toolkit 输出的所有状态
 */
export type PerspectiveOfToolkit = {
  toolCallRequests: ToolCallRequest[];
  toolResults: ToolResult[];
  allTasks: Record<string, TaskMonitorInfo>;
};

/**
 * Workforce 的 Perspective
 *
 * Workforce 输出的所有状态
 */
export type PerspectiveOfWorkforce = {
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
