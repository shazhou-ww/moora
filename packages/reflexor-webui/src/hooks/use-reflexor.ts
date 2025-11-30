// ============================================================================
// useReflexor Hook
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ReflexorState } from "@moora/reflexor-state-machine";
import { createReflexorClient } from "../create-reflexor-client";
import { createOptimisticStateManager } from "../optimistic-state";
import { generateMessageId } from "../create-timestamp";
import type { ReflexorClient, OptimisticState } from "../types";

/**
 * useReflexor Hook 配置
 */
export type UseReflexorConfig = {
  /**
   * 服务端 API 基础 URL
   */
  baseUrl: string;

  /**
   * 是否自动连接
   * @default true
   */
  autoConnect?: boolean;
};

/**
 * useReflexor Hook 返回值
 */
export type UseReflexorResult = {
  /**
   * 当前 Reflexor 状态
   */
  state: ReflexorState | null;

  /**
   * 乐观渲染状态
   */
  optimisticState: OptimisticState;

  /**
   * 是否已连接
   */
  isConnected: boolean;

  /**
   * 是否正在发送消息
   */
  isSending: boolean;

  /**
   * 发送用户消息
   *
   * @param content - 消息内容
   */
  sendMessage: (content: string) => Promise<void>;

  /**
   * 取消当前操作
   */
  cancel: () => Promise<void>;

  /**
   * 重试
   */
  retry: () => Promise<void>;

  /**
   * 清空对话
   */
  clear: () => Promise<void>;

  /**
   * 连接到服务端
   */
  connect: () => void;

  /**
   * 断开连接
   */
  disconnect: () => void;

  /**
   * 客户端实例
   */
  client: ReflexorClient;
};

/**
 * useReflexor Hook
 *
 * 用于在 React 组件中使用 Reflexor 客户端。
 *
 * @param config - 配置
 * @returns Hook 返回值
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   optimisticState,
 *   isConnected,
 *   sendMessage,
 * } = useReflexor({
 *   baseUrl: "http://localhost:3000/api/reflexor",
 * });
 *
 * // 发送消息
 * await sendMessage("Hello!");
 * ```
 */
export const useReflexor = (config: UseReflexorConfig): UseReflexorResult => {
  const { baseUrl, autoConnect = true } = config;

  // 创建客户端（只创建一次）
  const client = useMemo(() => createReflexorClient({ baseUrl }), [baseUrl]);

  // 创建乐观状态管理器
  const optimisticManager = useMemo(
    () =>
      createOptimisticStateManager({
        getCurrentState: () => client.current(),
      }),
    [client]
  );

  // 状态
  const [state, setState] = useState<ReflexorState | null>(null);
  const [optimisticState, setOptimisticState] = useState<OptimisticState>({
    pendingMessages: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 订阅状态变化
  useEffect(() => {
    const unsubscribeState = client.subscribe((newState) => {
      setState(newState);
      optimisticManager.syncWithState(newState);
    });

    const unsubscribeOptimistic = optimisticManager.subscribe((newState) => {
      setOptimisticState(newState);
    });

    return () => {
      unsubscribeState();
      unsubscribeOptimistic();
    };
  }, [client, optimisticManager]);

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      client.connect();
      setIsConnected(true);
    }

    return () => {
      client.disconnect();
      setIsConnected(false);
    };
  }, [client, autoConnect]);

  // 检查连接状态
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setIsConnected(client.isConnected());
    }, 1000);

    return () => clearInterval(checkConnection);
  }, [client]);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) {
        return;
      }

      setIsSending(true);
      const messageId = generateMessageId();

      // 乐观渲染
      optimisticManager.addPendingMessage(messageId, content);

      try {
        const result = await client.send({
          type: "user-send-message",
          messageId,
          content,
        });

        if (result.success) {
          optimisticManager.confirmMessage(messageId);
        } else {
          // 发送失败，移除乐观消息
          optimisticManager.removeMessage(messageId);
        }
      } catch (error) {
        // 发送失败，移除乐观消息
        optimisticManager.removeMessage(messageId);
        console.error("Failed to send message:", error);
      } finally {
        setIsSending(false);
      }
    },
    [client, optimisticManager]
  );

  // 取消
  const cancel = useCallback(async (): Promise<void> => {
    await client.send({
      type: "user-take-action",
      action: JSON.stringify({ kind: "cancel" }),
    });
  }, [client]);

  // 重试
  const retry = useCallback(async (): Promise<void> => {
    await client.send({
      type: "user-take-action",
      action: JSON.stringify({ kind: "retry" }),
    });
  }, [client]);

  // 清空
  const clear = useCallback(async (): Promise<void> => {
    await client.send({
      type: "user-take-action",
      action: JSON.stringify({ kind: "clear" }),
    });
  }, [client]);

  // 连接
  const connect = useCallback(() => {
    client.connect();
    setIsConnected(true);
  }, [client]);

  // 断开连接
  const disconnect = useCallback(() => {
    client.disconnect();
    setIsConnected(false);
  }, [client]);

  return {
    state,
    optimisticState,
    isConnected,
    isSending,
    sendMessage,
    cancel,
    retry,
    clear,
    connect,
    disconnect,
    client,
  };
};

