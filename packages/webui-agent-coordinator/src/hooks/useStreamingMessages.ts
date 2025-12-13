/**
 * 流式消息管理 Hook (Coordinator Agent 版本)
 *
 * 处理用户消息和助手消息的显示
 */

import { useMemo } from "react";

import type { ContextOfUser, Message } from "@/types";

/**
 * 渲染列表项类型：只有消息
 */
export type RenderItem = { type: "message"; data: Message };

/**
 * 流式消息管理 Hook
 *
 * @param context - Agent 的完整上下文
 * @returns 处理后的消息列表和渲染项
 */
export function useStreamingMessages(
  context: ContextOfUser | null
): {
  messages: Message[];
  streamingMessageIds: Set<string>;
  renderItems: RenderItem[];
} {
  // 从 context 获取所有消息
  const messages: Message[] = useMemo(() => {
    if (!context) return [];

    const allMessages: Message[] = [
      ...context.userMessages,
      ...(context.assiMessages || []),
    ];

    // 按时间戳排序
    return allMessages.sort((a, b) => a.timestamp - b.timestamp);
  }, [context]);

  // 获取正在流式的消息ID
  const streamingMessageIds: Set<string> = useMemo(() => {
    if (!context?.assiMessages) return new Set();

    return new Set(
      context.assiMessages
        .filter((msg) => msg.streaming)
        .map((msg) => msg.id)
    );
  }, [context?.assiMessages]);

  // 渲染列表：只包含消息
  const renderItems: RenderItem[] = useMemo(() => {
    return messages.map((msg) => ({
      type: "message" as const,
      data: msg,
    }));
  }, [messages]);

  return {
    messages,
    streamingMessageIds,
    renderItems,
  };
}
