/**
 * 消息列表组件
 */

import { Person } from "@mui/icons-material";
import { Box, Avatar, Paper, Typography, Fade } from "@mui/material";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

import type { RenderItem } from "@/hooks";
import type { Message, AssiMessage, UserMessage } from "@/types";

import {
  containerStyles,
  emptyStateStyles,
  emptyStateIconStyles,
  messageRowStyles,
  avatarStyles,
  avatarIconStyles,
  messagePaperStyles,
  markdownContainerStyles,
  paragraphStyles,
  codeBlockStyles,
  inlineCodeStyles,
  timestampStyles,
} from "./MessageList.styles";
import { ToolCallStatus, ToolCallItemView, type ToolCallItem } from "./ToolCallStatus";


type MessageListProps = {
  messages: Message[];
  streamingMessageIds?: Set<string>;
  toolCalls?: ToolCallItem[];
  renderItems?: RenderItem[];
};

/**
 * 流式光标组件
 */
function StreamingCursor() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: "2px",
        height: "1em",
        backgroundColor: "primary.main",
        marginLeft: "2px",
        verticalAlign: "baseline",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s",
      }}
    />
  );
}

/**
 * Markdown 组件配置
 */
const createMarkdownComponents = (role: "user" | "assistant") => ({
  p: ({ children }: { children?: React.ReactNode }) => (
    <Typography component="p" variant="body1" sx={paragraphStyles}>
      {children}
    </Typography>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || "");
    const isBlockCode = match !== null;
    return isBlockCode ? (
      <Box component="pre" sx={codeBlockStyles(role)}>
        <code className={className}>{children}</code>
      </Box>
    ) : (
      <Box component="code" sx={inlineCodeStyles(role)}>
        {children}
      </Box>
    );
  },
});

export function MessageList({
  messages,
  streamingMessageIds = new Set(),
  toolCalls = [],
  renderItems = [],
}: MessageListProps) {
  // 如果提供了 renderItems，使用它来渲染；否则使用旧的 messages 渲染
  const useRenderItems = renderItems.length > 0;

  /**
   * 渲染单条消息
   */
  const renderMessage = (message: Message) => {
    const isStreaming =
      message.role === "assistant" &&
      streamingMessageIds.has(message.id);
    
    // 提取消息内容
    let content = "";
    if (message.role === "user") {
      content = (message as UserMessage).content;
    } else {
      const assiMsg = message as AssiMessage;
      if (assiMsg.streaming === false) {
        content = assiMsg.content;
      } else {
        // 流式进行中，内容为空（应该从流式连接获取）
        content = "";
      }
    }

    return (
      <Fade in={true} key={message.id} timeout={300}>
        <Box sx={messageRowStyles(message.role)}>
          {message.role === "assistant" && (
            <Avatar
              sx={avatarStyles("assistant")}
              src="/moorex.svg"
              alt="Agent"
            />
          )}

          <Paper elevation={2} sx={messagePaperStyles(message.role)}>
            <Box sx={markdownContainerStyles}>
              {content ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={createMarkdownComponents(message.role)}
                  >
                    {content}
                  </ReactMarkdown>
                  {isStreaming && <StreamingCursor />}
                </>
              ) : isStreaming ? (
                <StreamingCursor />
              ) : null}
            </Box>
            <Typography variant="caption" sx={timestampStyles}>
              {new Date(message.timestamp).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Paper>

          {message.role === "user" && (
            <Avatar sx={avatarStyles("user")}>
              <Person sx={avatarIconStyles} />
            </Avatar>
          )}
        </Box>
      </Fade>
    );
  };

  /**
   * 渲染单个工具调用
   */
  const renderToolCall = (toolCall: ToolCallItem) => {
    return (
      <Fade in={true} key={toolCall.request.toolCallId} timeout={300}>
        <Box sx={{ width: "100%", maxWidth: 900, mx: "auto", my: 1, px: 2 }}>
          <ToolCallItemView toolCall={toolCall} />
        </Box>
      </Fade>
    );
  };

  return (
    <Box sx={containerStyles}>
      {(useRenderItems ? renderItems.length === 0 : messages.length === 0) ? (
        <Box sx={emptyStateStyles}>
          <Box
            component="img"
            src="/moorex.svg"
            alt="Moorex Logo"
            sx={{
              ...emptyStateIconStyles,
              width: 64,
              height: 64,
            }}
          />
          <Typography variant="h6" color="text.secondary">
            开始对话
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            发送一条消息开始与 Agent 对话
          </Typography>
        </Box>
      ) : useRenderItems ? (
        // 使用 renderItems 渲染（消息和工具调用按时间排序）
        <>
          {renderItems.map((item) => {
            if (item.type === "message") {
              return renderMessage(item.data);
            } else {
              return renderToolCall(item.data);
            }
          })}
        </>
      ) : (
        // 兼容旧的渲染方式
        <>
          {messages.map((message) => renderMessage(message))}

          {/* 在最后一条助手消息后显示 tool calls */}
          {toolCalls.length > 0 && (
            <Fade in={true} timeout={300}>
              <Box>
                <ToolCallStatus toolCalls={toolCalls} />
              </Box>
            </Fade>
          )}
        </>
      )}
    </Box>
  );
}

