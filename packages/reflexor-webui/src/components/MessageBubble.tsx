// ============================================================================
// 消息气泡组件
// ============================================================================

import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ScheduleIcon from "@mui/icons-material/Schedule";
import type { ReflexorMessage } from "@moora/reflexor-state-machine";

/**
 * 消息气泡属性
 */
export type MessageBubbleProps = {
  /**
   * 消息数据
   */
  message: ReflexorMessage;

  /**
   * 是否正在流式输出
   */
  isStreaming?: boolean;
};

/**
 * 消息气泡组件
 *
 * @param props - 组件属性
 * @returns React 元素
 */
export const MessageBubble = ({
  message,
  isStreaming = false,
}: MessageBubbleProps) => {
  const isUser = message.kind === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          maxWidth: "70%",
          p: 2,
          bgcolor: isUser ? "primary.main" : "grey.100",
          color: isUser ? "primary.contrastText" : "text.primary",
          borderRadius: 2,
          borderTopRightRadius: isUser ? 0 : 2,
          borderTopLeftRadius: isUser ? 2 : 0,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message.content || (isStreaming ? "..." : "")}
        </Typography>

        {/* 状态指示器 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 0.5,
            gap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              fontSize: "0.7rem",
            }}
          >
            {formatTime(message.receivedAt)}
          </Typography>

          {isUser && (
            <CheckIcon
              sx={{
                fontSize: "0.9rem",
                opacity: 0.7,
              }}
            />
          )}

          {isStreaming && (
            <CircularProgress
              size={12}
              sx={{
                color: isUser ? "primary.contrastText" : "primary.main",
              }}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

/**
 * 待确认消息气泡属性
 */
export type PendingMessageBubbleProps = {
  /**
   * 消息内容
   */
  content: string;

  /**
   * 是否已确认
   */
  isConfirmed: boolean;
};

/**
 * 待确认消息气泡组件
 *
 * 用于乐观渲染的消息。
 *
 * @param props - 组件属性
 * @returns React 元素
 */
export const PendingMessageBubble = ({
  content,
  isConfirmed,
}: PendingMessageBubbleProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        mb: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          maxWidth: "70%",
          p: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 2,
          borderTopRightRadius: 0,
          opacity: isConfirmed ? 1 : 0.7,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
        </Typography>

        {/* 状态指示器 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 0.5,
            gap: 0.5,
          }}
        >
          {isConfirmed ? (
            <CheckIcon
              sx={{
                fontSize: "0.9rem",
                opacity: 0.7,
              }}
            />
          ) : (
            <ScheduleIcon
              sx={{
                fontSize: "0.9rem",
                opacity: 0.7,
              }}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

/**
 * 格式化时间
 *
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 格式化的时间字符串
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

