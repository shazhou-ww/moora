/**
 * Reaction Options 类型定义
 *
 * 定义各 Actor 的 reaction 工厂函数的配置参数类型。
 * 这些类型用于创建 reaction 函数，使 @moora/agent-starter 与具体实现解耦。
 */

import type { PerspectiveOfUser } from "./perspectives";
import type { CallLlm } from "@moora/agent-common";

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
 * User Actor 的 reaction 配置选项
 */
export type UserReactionOptions = {
  notifyUser: NotifyUser;
};
