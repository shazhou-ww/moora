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
        // 保留最终内容在缓存中，以便后续渲染
        streamContentsRef.current.set(msg.id, msg.content);
      }
    });

    // 清理已完成的流式连接
    connectionsToClose.forEach((messageId) => {
      const closeConnection = streamConnectionsRef.current.get(messageId);
      if (closeConnection) {
        closeConnection();
        streamConnectionsRef.current.delete(messageId);
      }
    });

    // 统一更新流式消息 ID 集合（只更新一次，避免竞态条件）
    setStreamingMessageIds((prev) => {
      const next = new Set(prev);
      // 添加新的流式消息
      activeStreamingIds.forEach((id) => next.add(id));
      // 移除不再流式的消息
      prev.forEach((id) => {
        if (!activeStreamingIds.has(id)) {
          next.delete(id);
        }
      });
      return next;
    });

    // 清理不再存在的流式连接
    streamConnectionsRef.current.forEach((closeConnection, messageId) => {
      if (!activeStreamingIds.has(messageId)) {
        closeConnection();
        streamConnectionsRef.current.delete(messageId);
      }
    });
  }, [context]);

  // 清理函数：组件卸载时清理所有连接
  useEffect(() => {
    // 清理函数：组件卸载时清理所有连接
    const connections = streamConnectionsRef.current;
    const contents = streamContentsRef.current;

    return () => {
      connections.forEach((closeConnection) => {
        closeConnection();
      });
      connections.clear();
      contents.clear();
    };
  }, []);

  // 合并 tool calls
  const toolCalls = useMemo(() => {
    if (!context) return [];
    return mergeToolCalls(
      context.toolCallRequests ?? [],
      context.toolResults ?? []
    );
  }, [context]);

  // 合并消息和工具调用，按时间排序
  const renderItems: RenderItem[] = useMemo(() => {
    const items: RenderItem[] = [];

    // 添加消息
    messages.forEach((msg) => {
      items.push({ type: "message", data: msg });
    });

    // 添加工具调用（按 request 的时间戳）
    toolCalls.forEach((toolCall) => {
      items.push({ type: "toolCall", data: toolCall });
    });

    // 按时间戳排序
    return items.sort((a, b) => {
      const timestampA = a.type === "message" ? a.data.timestamp : a.data.request.timestamp;
      const timestampB = b.type === "message" ? b.data.timestamp : b.data.request.timestamp;
      return timestampA - timestampB;
    });
  }, [messages, toolCalls]);

  return {
    messages,
    streamingMessageIds,
    toolCalls,
    renderItems,
  };
}
