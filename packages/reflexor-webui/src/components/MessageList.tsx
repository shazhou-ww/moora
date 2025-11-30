// ============================================================================
// 消息列表组件
// ============================================================================

import { useRef, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import type { ReflexorState } from "@moora/reflexor-state-machine";
import { getMergedMessages, getAllMessageIds } from "@moora/reflexor-state-machine";
import type { OptimisticState } from "../types";
import { MessageBubble, PendingMessageBubble } from "./MessageBubble";

/**
 * 消息列表属性
 */
export type MessageListProps = {
  /**
   * Reflexor 状态
   */
  state: ReflexorState | null;

  /**
   * 乐观渲染状态
   */
  optimisticState: OptimisticState;
};

/**
 * 消息列表组件
 *
 * @param props - 组件属性
 * @returns React 元素
 */
export const MessageList = ({ state, optimisticState }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 合并并排序消息
  const messages = useMemo(() => {
    return state ? getMergedMessages(state) : [];
  }, [state]);

  // 收集已在状态中的消息 ID
  const confirmedMessageIds = useMemo(() => {
    return state ? getAllMessageIds(state) : new Set<string>();
  }, [state]);

  // 过滤出尚未在状态中的待确认消息
  const pendingMessages = optimisticState.pendingMessages.filter(
    (msg) => !confirmedMessageIds.has(msg.messageId)
  );

  // 判断是否有正在流式输出的消息
  const lastMessage = messages[messages.length - 1];
  const isStreaming =
    lastMessage?.kind === "assistant" && lastMessage.content === "";

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pendingMessages.length]);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 已确认的消息 */}
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={
            isStreaming && index === messages.length - 1
          }
        />
      ))}

      {/* 待确认的消息（乐观渲染） */}
      {pendingMessages.map((pending) => (
        <PendingMessageBubble
          key={pending.messageId}
          content={pending.content}
          isConfirmed={pending.isConfirmed}
        />
      ))}

      {/* 滚动锚点 */}
      <div ref={bottomRef} />
    </Box>
  );
};
