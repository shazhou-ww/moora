/**
 * 流式消息管理 Hook
 */

import { useEffect, useState, useRef, useMemo } from "react";

import type { ToolCallItem } from "@/components/ToolCallStatus";
import type { ContextOfUser, Message, ToolCallRequest, ToolResult } from "@/types";

import { createStreamConnection } from "@/utils/stream";

/**
 * 渲染列表项类型：消息或工具调用
 */
export type RenderItem =
  | { type: "message"; data: Message }
  | { type: "toolCall"; data: ToolCallItem };

/**
 * 将 toolCallRequests 和 toolResults 合并成 ToolCallItem 列表
 */
function mergeToolCalls(
  toolCallRequests: ToolCallRequest[],
  toolResults: ToolResult[]
): ToolCallItem[] {
  const resultsMap = new Map<string, ToolResult>();
  toolResults.forEach((result) => {
    resultsMap.set(result.toolCallId, result);
  });

  return toolCallRequests.map((request) => ({
    request,
    result: resultsMap.get(request.toolCallId),
  }));
}

/**
 * 流式消息管理 Hook
 *
 * 管理流式消息的连接、内容缓存和状态
 *
 * @param context - Agent 上下文
 * @returns 处理后的渲染列表（消息和工具调用按时间排序）、流式消息 ID 集合和工具调用列表
 */
export function useStreamingMessages(
  context: ContextOfUser | null
): {
  messages: Message[];
  streamingMessageIds: Set<string>;
  toolCalls: ToolCallItem[];
  renderItems: RenderItem[];
} {
  // 流式消息内容缓存（messageId -> content）
  const streamContentsRef = useRef<Map<string, string>>(new Map());
  // 流式连接关闭函数缓存
  const streamConnectionsRef = useRef<Map<string, () => void>>(new Map());
  // 正在流式的消息 ID 集合
  const [streamingMessageIds, setStreamingMessageIds] = useState<Set<string>>(
    new Set()
  );
  // 流式内容更新触发器
  const [streamContentVersion, setStreamContentVersion] = useState(0);

  // 从 context 更新 messages，并合并流式内容
  // 所有消息（包括流式进行中的）都按时间戳排序，不强制 user/assistant 消息穿插
  const messages: Message[] = useMemo(() => {
    if (!context) return [];

    // 将流式消息转换为带内容的完整消息
    const processedAssiMessages: Message[] = context.assiMessages.map(
      (msg) => {
        if (msg.streaming === true) {
          // 流式进行中，从缓存获取内容
          const streamContent =
            streamContentsRef.current.get(msg.id) || "";
          // 创建 CompletedAssiMessage，不展开 StreamingAssiMessage
          return {
            id: msg.id,
            content: streamContent,
            timestamp: msg.timestamp,
            role: "assistant" as const,
            streaming: false as const,
          };
        }
        // 流式完成，直接使用
        return msg;
      }
    );

    // 合并所有消息（包括流式进行中的）并按时间戳排序
    // 不强制 user/assistant 消息穿插，完全按时间顺序排列
    return [...context.userMessages, ...processedAssiMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, streamContentVersion]);

  // 管理流式连接：当检测到新的流式消息时，建立连接
  useEffect(() => {
    if (!context) return;

    const activeStreamingIds = new Set<string>();
    const connectionsToClose = new Set<string>();

    // 检查是否有新的流式消息需要连接
    context.assiMessages.forEach((msg) => {
      if (msg.streaming === true) {
        activeStreamingIds.add(msg.id);

        // 如果还没有连接，建立新的流式连接
        if (!streamConnectionsRef.current.has(msg.id)) {
          console.debug(`[useStreamingMessages] Creating stream connection for messageId: ${msg.id}`);
          const closeConnection = createStreamConnection(
            msg.id,
            (content) => {
              // 初始内容
              console.debug(`[useStreamingMessages] Received initial content for ${msg.id}, length: ${content.length}`);
              streamContentsRef.current.set(msg.id, content);
              setStreamContentVersion((prev) => prev + 1);
            },
            (chunk) => {
              // 追加 chunk
              const currentContent =
                streamContentsRef.current.get(msg.id) || "";
              const newContent = currentContent + chunk;
              streamContentsRef.current.set(msg.id, newContent);
              console.debug(`[useStreamingMessages] Received chunk for ${msg.id}, total length: ${newContent.length}`);

              // 触发重新渲染
              setStreamContentVersion((prev) => prev + 1);
            },
            (finalContent) => {
              // 流式结束，更新最终内容
              console.debug(`[useStreamingMessages] Stream ended for ${msg.id}, final length: ${finalContent.length}`);
              streamContentsRef.current.set(msg.id, finalContent);

              // 清理连接
              streamConnectionsRef.current.delete(msg.id);

              // 触发重新渲染
              setStreamContentVersion((prev) => prev + 1);
            }
          );

          streamConnectionsRef.current.set(msg.id, closeConnection);
        }
      } else {
        // 流式完成，标记需要清理的连接
        connectionsToClose.add(msg.id);
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
