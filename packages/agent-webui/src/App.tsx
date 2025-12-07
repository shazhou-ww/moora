/**
 * 主应用组件
 */

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Chip,
} from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import { MessageListContainer } from "@/components/MessageListContainer";
import { MessageInput } from "@/components/MessageInput";
import { createSSEConnection, applyPatchesToContext } from "@/utils/sse";
import { useStreamingMessages } from "@/hooks";
import { sendMessage } from "@/utils/api";
import type { ContextOfUser } from "@/types";
import {
  rootStyles,
  appBarStyles,
  appBarIconStyles,
  appBarTitleStyles,
  errorAlertStyles,
  contentBoxStyles,
  loadingBoxStyles,
  messageCountChipStyles,
} from "@/styles/app";

function App() {
  const [context, setContext] = useState<ContextOfUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollToBottomFn, setScrollToBottomFn] = useState<(() => void) | null>(null);

  // 使用流式消息管理 Hook
  const { messages, streamingMessageIds, toolCalls } = useStreamingMessages(context);

  // 处理 scroll indicator 状态变化
  const handleScrollIndicatorChange = useCallback((show: boolean, scrollToBottom: () => void) => {
    setShowScrollIndicator(show);
    setScrollToBottomFn(() => scrollToBottom);
  }, []);

  useEffect(() => {
    let closeConnection: (() => void) | null = null;

    const connectSSE = () => {
      try {
        closeConnection = createSSEConnection(
          "/api/agent",
          (data: ContextOfUser) => {
            // 全量数据更新
            setContext(data);
            setLoading(false);
            setError(null);
          },
          (patches) => {
            // Patch 更新
            setContext((prevContext) => {
              if (!prevContext) {
                return prevContext;
              }
              return applyPatchesToContext(prevContext, patches);
            });
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "连接失败");
        setLoading(false);
      }
    };

    connectSSE();

    return () => {
      if (closeConnection) {
        closeConnection();
      }
    };
  }, []);

  const handleSend = async (content: string) => {
    setSending(true);
    setError(null);

    try {
      await sendMessage(content);
      // 消息发送后，SSE 会推送更新，这里不需要手动更新
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送消息失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={rootStyles}>
      <AppBar position="static" elevation={1} sx={appBarStyles}>
        <Toolbar>
          <Box
            component="img"
            src="/moorex.svg"
            alt="Moorex Logo"
            sx={{
              ...appBarIconStyles,
              width: 32,
              height: 32,
            }}
          />
          <Typography variant="h6" component="h1" sx={appBarTitleStyles}>
            Agent WebUI
          </Typography>
          {!loading && (
            <Chip
              label={`${messages.length} 条消息`}
              size="small"
              sx={messageCountChipStyles}
            />
          )}
        </Toolbar>
      </AppBar>

      {error && (
        <Alert severity="error" sx={errorAlertStyles} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={contentBoxStyles}>
            <Box sx={loadingBoxStyles}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary">
                正在连接...
              </Typography>
            </Box>
          </Box>
        ) : (
          <MessageListContainer
            messages={messages}
            streamingMessageIds={streamingMessageIds}
            toolCalls={toolCalls}
            onScrollIndicatorChange={handleScrollIndicatorChange}
          />
        )}

        {/* Scroll indicator overlay：当远离底部时显示，点击可滚动到底部 */}
        {showScrollIndicator && scrollToBottomFn && (
          <Box
            onClick={scrollToBottomFn}
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              cursor: "pointer",
              transition: "background-color 0.3s, transform 0.2s",
              zIndex: 10,
              pointerEvents: "auto",
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "scale(1.1)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <KeyboardArrowDown
              sx={{
                fontSize: 24,
                animation: "bounce 1s infinite",
                "@keyframes bounce": {
                  "0%, 100%": {
                    transform: "translateY(0)",
                  },
                  "50%": {
                    transform: "translateY(-4px)",
                  },
                },
              }}
            />
          </Box>
        )}
      </Box>

      <MessageInput onSend={handleSend} disabled={sending || loading} />
    </Box>
  );
}

export default App;

