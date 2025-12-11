/**
 * Reaction Options 类型定义
 *
 * 定义各 Actor 的 reaction 工厂函数的配置参数类型。
 * 这些类型用于创建 reaction 函数，使 @moora/agent-worker 与具体实现解耦。
 */

import type { CallLlm, CallLlmToolDefinition } from "@moora/agent-common";
import type { ToolCallRequest } from "./observations";
import type { PerspectiveOfUser } from "./perspectives";

// Re-export CallLlm types from @moora/agent-common
export type {
  CallLlmMessage,
  CallLlmScenario,
  CallLlmToolDefinition,
  CallLlmToolCall,
  CallLlmContext,
  CallLlmCallbacks,
  CallLlm,
} from "@moora/agent-common";

// ============================================================================
// CallTool 相关类型
// ============================================================================

/**
 * callTool 函数类型
 *
 * 执行工具调用的抽象接口，由外部实现具体的工具执行逻辑。
 *
 * @param request - 工具调用请求
 * @returns Promise<string> - 工具执行结果（JSON string）
 */
export type CallTool = (request: ToolCallRequest) => Promise<string>;

// ============================================================================
// NotifyUser 相关类型
// ============================================================================

/**
 * notifyUser 函数类型
 *
 * 通知用户的抽象接口，由外部实现具体的通知逻辑（如发送 patch、更新 UI 等）。
 *
 * @param perspective - User 的 Perspective
 */
export type NotifyUser = (perspective: PerspectiveOfUser) => void;

// ============================================================================
// Actor Reaction Options
// ============================================================================

/**
 * LLM Actor 的 reaction 配置选项
 */
export type LlmReactionOptions = {
  callLlm: CallLlm;
  /**
   * 工具定义列表
   *
   * 传递给 LLM 的可用工具定义
   */
  tools?: CallLlmToolDefinition[];
  /**
   * 可选的流式开始回调
   *
   * 当 LLM 开始输出时调用，可用于初始化流
   *
   * @param messageId - 消息 ID
   */
  onStart?: (messageId: string) => void;
  /**
   * 可选的流式输出回调
   *
   * 当 LLM 输出 chunk 时调用，可用于实时推送到客户端
   *
   * @param messageId - 消息 ID
   * @param chunk - 输出的 chunk 内容
   */
  onChunk?: (messageId: string, chunk: string) => void;
  /**
   * 可选的流式完成回调
   *
   * 当 LLM 输出完成时调用，可用于关闭流
   *
   * @param messageId - 消息 ID
   * @param content - 完整的输出内容
   */
  onComplete?: (messageId: string, content: string) => void;
};

/**
 * Toolkit Actor 的 reaction 配置选项
 */
export type ToolkitReactionOptions = {
  callTool: CallTool;
};

/**
 * User Actor 的 reaction 配置选项
 */
export type UserReactionOptions = {
  notifyUser: NotifyUser;
};

// ============================================================================
// 统一 Reaction Options
// ============================================================================

/**
 * 统一的 Reaction 配置选项
 *
 * 包含所有 Actor 的 reaction 配置，用于 createReactions 工厂函数。
 */
export type ReactionOptions = LlmReactionOptions &
  ToolkitReactionOptions &
  UserReactionOptions;
