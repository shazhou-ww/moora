/**
 * 消息列表容器组件
 * 负责管理消息列表的自动滚动逻辑
 */

import { Box } from "@mui/material";
import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";

import type { RenderItem } from "@/hooks";
import { contentBoxStyles } from "@/styles/app";
import type { Message } from "@/types";

import { MessageList } from "./MessageList";
import type { ToolCallItem } from "./ToolCallStatus";


type MessageListContainerProps = {
  messages: Message[];
  streamingMessageIds?: Set<string>;
  toolCalls?: ToolCallItem[];
  renderItems?: RenderItem[];
  onScrollIndicatorChange?: (show: boolean, scrollToBottom: () => void) => void;
};

/**
 * 检查容器是否接近底部
 */
const checkIfNearBottom = (container: HTMLElement, threshold: number): boolean => {
  const { scrollTop, scrollHeight, clientHeight } = container;
  return scrollHeight - scrollTop - clientHeight < threshold;
};

/**
 * 滚动容器到底部
 */
const scrollToBottom = (container: HTMLElement, messagesEnd: HTMLDivElement | null): void => {
  if (messagesEnd) {
    messagesEnd.scrollIntoView({ behavior: "smooth" });
  } else {
    container.scrollTop = container.scrollHeight;
  }
};

/**
 * 消息列表容器组件
 * 
 * 功能：
 * - 检测用户滚动行为（userScrolling）
 * - 自动滚动到底部（当用户不在滚动且接近底部时）
 */
export function MessageListContainer({
  messages,
  streamingMessageIds = new Set(),
  toolCalls = [],
  renderItems = [],
  onScrollIndicatorChange,
}: MessageListContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userScrolling, setUserScrolling] = useState(false);
  const userScrollingRef = useRef(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const wheelDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamingMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  
  // 容错距离阈值（像素）
  const threshold = 150;

  // 检查是否接近底部
  const checkNearBottom = useCallback((): boolean => {
    const container = containerRef.current;
    if (!container) return true;
    return checkIfNearBottom(container, threshold);
  }, []);

  // 监听用户滚动行为：设置 userScrolling 状态，并更新 isNearBottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 处理 wheel 事件：设置 userScrolling 为 true，并在延迟后设为 false
    const handleWheel = (): void => {
      setUserScrolling(true);
      userScrollingRef.current = true;
      
      // 清除之前的定时器
      if (wheelDebounceTimerRef.current) {
        clearTimeout(wheelDebounceTimerRef.current);
      }
      
      // 延迟后将 userScrolling 设为 false
      wheelDebounceTimerRef.current = setTimeout(() => {
        setUserScrolling(false);
        userScrollingRef.current = false;
        wheelDebounceTimerRef.current = null;
      }, 150); // 150ms 无滚动后认为滚动结束
    };

    // 处理 touchstart 事件：设置 userScrolling 为 true
    const handleTouchStart = (): void => {
      setUserScrolling(true);
      userScrollingRef.current = true;
    };

    // 处理 touchend 事件：设置 userScrolling 为 false
    const handleTouchEnd = (): void => {
      setUserScrolling(false);
      userScrollingRef.current = false;
    };

    // 处理滚动事件：更新 isNearBottom 状态
    const handleScroll = (): void => {
      setIsNearBottom(checkNearBottom());
    };

    // 监听鼠标滚轮和触摸板滚动
    container.addEventListener("wheel", handleWheel, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("scroll", handleScroll);
      if (wheelDebounceTimerRef.current) {
        clearTimeout(wheelDebounceTimerRef.current);
      }
    };
  }, [checkNearBottom]);

  // 处理点击指示器滚动到底部
  const handleScrollToBottom = useCallback((): void => {
    const container = containerRef.current;
    if (!container) return;
    scrollToBottom(container, messagesEndRef.current);
  }, []);

  // 向上级组件传递 indicator 状态
  useEffect(() => {
    if (onScrollIndicatorChange) {
      onScrollIndicatorChange(!isNearBottom, handleScrollToBottom);
    }
  }, [isNearBottom, handleScrollToBottom, onScrollIndicatorChange]);

  // 自动滚动逻辑：当用户不在滚动且接近底部时，自动滚动到底部
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 初始加载时强制滚动到底部
    if (isInitialLoadRef.current && messages.length > 0) {
      isInitialLoadRef.current = false;
      scrollToBottom(container, messagesEndRef.current);
      setIsNearBottom(true);
      return;
    }

    const nearBottom = checkNearBottom();
    setIsNearBottom(nearBottom);

    // 只要用户不在滚动且接近底部，就自动滚动
    if (!userScrolling && nearBottom) {
      scrollToBottom(container, messagesEndRef.current);
    }
    // 依赖 userScrolling 和 messages，当用户滚动状态变化或消息更新时重新检查
    // checkNearBottom 是稳定的 useCallback，不会导致不必要的重新执行
  }, [userScrolling, messages, checkNearBottom]);

  // 更新 streamingMessageIds ref
  useEffect(() => {
    streamingMessageIdsRef.current = streamingMessageIds || new Set();
  }, [streamingMessageIds]);

  // Streaming 过程中定期检查并自动滚动
  useEffect(() => {
    const isStreaming = streamingMessageIds && streamingMessageIds.size > 0;
    if (!isStreaming) return;

    const container = containerRef.current;
    if (!container) return;

    // 使用 requestAnimationFrame 在 streaming 过程中定期检查
    let animationFrameId: number | null = null;
    const checkAndScroll = (): void => {
      // 使用 ref 检查最新的用户滚动状态
      if (userScrollingRef.current) {
        // 如果用户在滚动，停止自动滚动，但继续检查状态
        const nearBottom = checkNearBottom();
        setIsNearBottom(nearBottom);
        
        // 如果还在 streaming，继续检查
        const currentStreaming = streamingMessageIdsRef.current.size > 0;
        if (currentStreaming) {
          animationFrameId = requestAnimationFrame(checkAndScroll);
        }
        return;
      }

      // 使用 ref 检查是否还在 streaming
      const currentStreaming = streamingMessageIdsRef.current.size > 0;
      if (!currentStreaming) {
        return;
      }

      const nearBottom = checkNearBottom();
      setIsNearBottom(nearBottom);

      // 在 streaming 过程中，如果接近底部就自动滚动到底部
      // 这样可以确保 streaming 内容始终可见
      if (nearBottom) {
        scrollToBottom(container, messagesEndRef.current);
      }

      // 如果还在 streaming，继续检查（使用 requestAnimationFrame 确保在下一帧检查）
      animationFrameId = requestAnimationFrame(checkAndScroll);
    };

    animationFrameId = requestAnimationFrame(checkAndScroll);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [streamingMessageIds, checkNearBottom]);

  return (
    <Box ref={containerRef} sx={contentBoxStyles}>
      <MessageList
        messages={messages}
        streamingMessageIds={streamingMessageIds}
        toolCalls={toolCalls}
        renderItems={renderItems}
      />
      <div ref={messagesEndRef} />
    </Box>
  );
}
