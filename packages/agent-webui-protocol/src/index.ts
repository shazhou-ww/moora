// ============================================================================
// Agent Web UI Protocol 导出
// ============================================================================

/**
 * Agent Web UI Protocol
 * 
 * 定义 Agent Web UI 的协议类型，包括：
 * - AgentAppState: 用户可见的 Agent 状态
 * - AgentAppEvent: 用户可以通过 Web UI 触发的事件类型
 * - AgentController: 前端控制器接口
 * 
 * 所有类型都通过 Zod schema 定义，可以通过 schema 进行运行时验证。
 * 前端应用完全基于这些类型定义，通过依赖注入的方式接收 AgentController 实现。
 */

// ============================================================================
// 导出 Agent App State 相关 Schema
// ============================================================================
export {
  agentTaskStatusSchema,
  agentTaskSchema,
  userMessageSchema,
  assistantMessageSchema,
  agentMessageSchema,
  agentAppStateSchema,
} from "./agent-app-state";

// ============================================================================
// 导出 Agent App State 相关类型
// ============================================================================
export type {
  AgentTaskStatus,
  AgentTask,
  UserMessage,
  AssistantMessage,
  AgentMessage,
  AgentAppState,
} from "./agent-app-state";

// ============================================================================
// 导出 Agent App Event 相关 Schema
// ============================================================================
export {
  userMessageEventSchema,
  cancelTaskEventSchema,
  updateTaskSummaryEventSchema,
  agentAppEventSchema,
} from "./agent-app-event";

// ============================================================================
// 导出 Agent App Event 相关类型
// ============================================================================
export type {
  UserMessageEvent,
  CancelTaskEvent,
  UpdateTaskSummaryEvent,
  AgentAppEvent,
} from "./agent-app-event";

// ============================================================================
// 导出 Agent Controller 相关类型
// ============================================================================
export type { AgentController } from "./agent-controller";
