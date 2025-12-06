/**
 * 流式消息管理 Hook
 */

import { useEffect, useState, useRef, useMemo } from "react";
import { createStreamConnection } from "@/utils/stream";
import type { ContextOfUser, Message } from "@/types";

/**
 * 流式消息管理 Hook
 *
 * 管理流式消息的连接、内容缓存和状态
 *
 * @param context - Agent 上下文
 * @returns 处理后的消息列表和流式消息 ID 集合
 */
export function useStreamingMessages(
  context: ContextOfUser | null
): {
  messages: Message[];
  streamingMessageIds: Set<string>;
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
  const messages: Message[] = useMemo(() => {
    if (!context) return [];

    // 将流式消息转换为带内容的完整消息
    const processedAssiMessages: Message[] = context.assiMessages.map(
      (msg) => {
        if (msg.streaming === true) {
          // 流式进行中，从缓存获取内容
          const streamContent =
            streamContentsRef.current.get(msg.id) || "";
          return {
            ...msg,
            streaming: false as const,
            content: streamContent,
          };
        }
        // 流式完成，直接使用
        return msg;
      }
    );

    return [...context.userMessages, ...processedAssiMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, streamContentVersion]);

  // 管理流式连接：当检测到新的流式消息时，建立连接
  useEffect(() => {
    if (!context) return;

    const activeStreamingIds = new Set<string>();

    // 检查是否有新的流式消息需要连接
    context.assiMessages.forEach((msg) => {
      if (msg.streaming === true) {
        activeStreamingIds.add(msg.id);

        // 如果还没有连接，建立新的流式连接
        if (!streamConnectionsRef.current.has(msg.id)) {
          const closeConnection = createStreamConnection(
            msg.id,
            (content) => {
              // 初始内容
              streamContentsRef.current.set(msg.id, content);
              setStreamingMessageIds((prev) => new Set(prev).add(msg.id));
              setStreamContentVersion((prev) => prev + 1);
            },
            (chunk) => {
              // 追加 chunk
              const currentContent =
                streamContentsRef.current.get(msg.id) || "";
              const newContent = currentContent + chunk;
              streamContentsRef.current.set(msg.id, newContent);

              // 触发重新渲染
              setStreamContentVersion((prev) => prev + 1);
            },
            (finalContent) => {
              // 流式结束，更新最终内容
              streamContentsRef.current.set(msg.id, finalContent);

              // 清理连接和流式状态
              streamConnectionsRef.current.delete(msg.id);
              setStreamingMessageIds((prev) => {
                const next = new Set(prev);
                next.delete(msg.id);
                return next;
              });

              // 触发重新渲染
              setStreamContentVersion((prev) => prev + 1);
            }
          );

          streamConnectionsRef.current.set(msg.id, closeConnection);
        }
      } else {
        // 流式完成，清理连接和缓存
        const closeConnection = streamConnectionsRef.current.get(msg.id);
        if (closeConnection) {
          closeConnection();
          streamConnectionsRef.current.delete(msg.id);
        }
        // 移除流式状态
        setStreamingMessageIds((prev) => {
          const next = new Set(prev);
          next.delete(msg.id);
          return next;
        });
        // 保留最终内容在缓存中，以便后续渲染
        if (msg.streaming === false) {
          streamContentsRef.current.set(msg.id, msg.content);
        }
      }
    });

    // 更新流式消息 ID 集合
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
  }, [context, streamContentVersion]);

  // 清理函数：组件卸载时清理所有连接
  useEffect(() => {
    // 保存 ref 的当前值到局部变量，确保 cleanup 函数使用正确的值
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

  return {
    messages,
    streamingMessageIds,
  };
}
