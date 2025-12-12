/**
 * 流式消息管理 Hook (Coordinator Agent 版本)
 * 
 * 在 Coordinator Agent 中，PerspectiveOfUser 只包含 userMessages
 * 暂时只显示用户消息，未来可扩展以显示其他信息
 */

import { useMemo } from "react";

import type { PerspectiveOfUser, Message } from "@/types";

/**
 * 渲染列表项类型：只有消息
 */
export type RenderItem = { type: "message"; data: Message };

/**
 * 流式消息管理 Hook
 *
 * @param context - Agent 的 PerspectiveOfUser
 * @returns 处理后的消息列表和渲染项
 */
export function useStreamingMessages(
  context: PerspectiveOfUser | null
): {
  messages: Message[];
  streamingMessageIds: Set<string>;
  renderItems: RenderItem[];
} {
  // 从 context 获取用户消息
  const messages: Message[] = useMemo(() => {
    if (!context) return [];
    
    // 只返回用户消息，按时间戳排序
    return [...context.userMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [context]);

  // 渲染列表：只包含消息
  const renderItems: RenderItem[] = useMemo(() => {
    return messages.map((msg) => ({
      type: "message" as const,
      data: msg,
    }));
  }, [messages]);

  return {
    messages,
    streamingMessageIds: new Set(), // Coordinator 版本暂时不支持流式
    renderItems,
  };
}
