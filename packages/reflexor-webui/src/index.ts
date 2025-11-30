// ============================================================================
// Reflexor WebUI 导出
// ============================================================================

/**
 * Reflexor WebUI
 *
 * 提供基于 reflexor-state-machine 的前端应用支持，包括：
 * - React 组件（使用 MUI）
 * - React Hooks
 * - 客户端与服务端通信
 * - SSE 事件处理
 * - 乐观渲染状态管理
 */

// ============================================================================
// 导出所有类型
// ============================================================================

export type {
  InputReceivedEvent,
  StateUpdatedEvent,
  SSEEvent,
  Unsubscribe,
  ReflexorClientConfig,
  ReflexorClient,
  PendingMessage,
  OptimisticState,
} from "./types";

export {
  inputReceivedEventSchema,
  stateUpdatedEventSchema,
  sseEventSchema,
} from "./types";

export type {
  CreateOptimisticStateOptions,
  OptimisticStateManager,
} from "./optimistic-state";

// ============================================================================
// 导出函数
// ============================================================================

export { createReflexorClient } from "./create-reflexor-client";
export { createTimestampGenerator, generateMessageId } from "./create-timestamp";
export { createOptimisticStateManager } from "./optimistic-state";

// ============================================================================
// 导出 React Hooks
// ============================================================================

export { useReflexor } from "./hooks";
export type { UseReflexorConfig, UseReflexorResult } from "./hooks";

// ============================================================================
// 导出 React 组件
// ============================================================================

export {
  MessageBubble,
  PendingMessageBubble,
  MessageList,
  MessageInput,
  ChatHeader,
  ReflexorChat,
} from "./components";

export type {
  MessageBubbleProps,
  PendingMessageBubbleProps,
  MessageListProps,
  MessageInputProps,
  ChatHeaderProps,
  ReflexorChatProps,
} from "./components";
