/**
 * 消息列表组件
 */

import { Box, Avatar, Paper, Typography, Fade } from "@mui/material";
import { Person, SmartToy } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import type { Message } from "@/types";
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

type MessageListProps = {
  messages: Message[];
};

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

export function MessageList({ messages }: MessageListProps) {
  return (
    <Box sx={containerStyles}>
      {messages.length === 0 ? (
        <Box sx={emptyStateStyles}>
          <SmartToy sx={emptyStateIconStyles} />
          <Typography variant="h6" color="text.secondary">
            开始对话
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            发送一条消息开始与 Agent 对话
          </Typography>
        </Box>
      ) : (
        messages.map((message) => (
          <Fade in={true} key={message.id} timeout={300}>
            <Box sx={messageRowStyles(message.role)}>
              {message.role === "assistant" && (
                <Avatar sx={avatarStyles("assistant")}>
                  <SmartToy sx={avatarIconStyles} />
                </Avatar>
              )}

              <Paper elevation={2} sx={messagePaperStyles(message.role)}>
                <Box sx={markdownContainerStyles}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={createMarkdownComponents(message.role)}
                  >
                    {message.content}
                  </ReactMarkdown>
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
        ))
      )}
    </Box>
  );
}

