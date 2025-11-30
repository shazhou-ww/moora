// ============================================================================
// 乐观渲染状态管理
// ============================================================================

import type { ReflexorState } from "@moora/reflexor-state-machine";
import { getAllMessageIds } from "@moora/reflexor-state-machine";
import type { OptimisticState, PendingMessage, Unsubscribe } from "./types";

/**
 * 创建乐观渲染状态管理器的选项
 */
export type CreateOptimisticStateOptions = {
  /**
   * 获取当前确认状态的函数
   */
  getCurrentState: () => ReflexorState | null;
};

/**
 * 乐观渲染状态管理器
 */
export type OptimisticStateManager = {
  /**
   * 获取当前乐观状态
   */
  current: () => OptimisticState;

  /**
   * 添加待确认消息
   *
   * @param messageId - 消息 ID
   * @param content - 消息内容
   */
  addPendingMessage: (messageId: string, content: string) => void;

  /**
   * 确认消息
   *
   * 当收到服务端确认后调用。
   *
   * @param messageId - 消息 ID
   */
  confirmMessage: (messageId: string) => void;

  /**
   * 移除消息
   *
   * 当消息已在 ReflexorState 中时调用。
   *
   * @param messageId - 消息 ID
   */
  removeMessage: (messageId: string) => void;

  /**
   * 同步状态
   *
   * 根据 ReflexorState 同步乐观状态，移除已确认的消息。
   *
   * @param state - 当前 Reflexor 状态
   */
  syncWithState: (state: ReflexorState) => void;

  /**
   * 订阅状态变化
   *
   * @param handler - 状态变化处理函数
   * @returns 取消订阅函数
   */
  subscribe: (handler: (state: OptimisticState) => void) => Unsubscribe;
};

/**
 * 创建乐观渲染状态管理器
 *
 * @returns 乐观渲染状态管理器
 *
 * @example
 * ```typescript
 * const manager = createOptimisticStateManager({
 *   getCurrentState: () => client.current(),
 * });
 *
 * // 添加待确认消息（乐观渲染）
 * manager.addPendingMessage("msg-1", "Hello");
 *
 * // 订阅状态变化
 * manager.subscribe((state) => {
 *   console.log("Pending messages:", state.pendingMessages);
 * });
 *
 * // 当收到服务端确认后
 * manager.confirmMessage("msg-1");
 *
 * // 当状态更新后，同步移除已在状态中的消息
 * manager.syncWithState(currentState);
 * ```
 */
export const createOptimisticStateManager = (
  options: CreateOptimisticStateOptions
): OptimisticStateManager => {
  const { getCurrentState } = options;

  let state: OptimisticState = {
    pendingMessages: [],
  };

  const subscribers = new Set<(state: OptimisticState) => void>();

  /**
   * 通知所有订阅者状态变化
   */
  const notifySubscribers = (): void => {
    for (const handler of subscribers) {
      handler(state);
    }
  };

  /**
   * 获取当前乐观状态
   */
  const current = (): OptimisticState => {
    return state;
  };

  /**
   * 添加待确认消息
   */
  const addPendingMessage = (messageId: string, content: string): void => {
    const pendingMessage: PendingMessage = {
      messageId,
      content,
      localTimestamp: Date.now(),
      isConfirmed: false,
    };

    state = {
      ...state,
      pendingMessages: [...state.pendingMessages, pendingMessage],
    };

    notifySubscribers();
  };

  /**
   * 确认消息
   */
  const confirmMessage = (messageId: string): void => {
    state = {
      ...state,
      pendingMessages: state.pendingMessages.map((msg) =>
        msg.messageId === messageId ? { ...msg, isConfirmed: true } : msg
      ),
    };

    notifySubscribers();
  };

  /**
   * 移除消息
   */
  const removeMessage = (messageId: string): void => {
    state = {
      ...state,
      pendingMessages: state.pendingMessages.filter(
        (msg) => msg.messageId !== messageId
      ),
    };

    notifySubscribers();
  };

  /**
   * 同步状态
   *
   * 根据 ReflexorState 同步乐观状态，移除已在状态中的消息。
   */
  const syncWithState = (reflexorState: ReflexorState): void => {
    const messageIds = getAllMessageIds(reflexorState);

    // 移除已在状态中的消息
    const newPendingMessages = state.pendingMessages.filter(
      (msg) => !messageIds.has(msg.messageId)
    );

    if (newPendingMessages.length !== state.pendingMessages.length) {
      state = {
        ...state,
        pendingMessages: newPendingMessages,
      };

      notifySubscribers();
    }
  };

  /**
   * 订阅状态变化
   */
  const subscribe = (
    handler: (state: OptimisticState) => void
  ): Unsubscribe => {
    subscribers.add(handler);

    // 立即通知当前状态
    handler(state);

    return () => {
      subscribers.delete(handler);
    };
  };

  return {
    current,
    addPendingMessage,
    confirmMessage,
    removeMessage,
    syncWithState,
    subscribe,
  };
};
