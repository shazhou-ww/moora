/**
 * 主应用组件
 */

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Chip,
} from "@mui/material";
import { MessageList } from "@/components/MessageList";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用流式消息管理 Hook
  const { messages, streamingMessageIds } = useStreamingMessages(context);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      <Box sx={contentBoxStyles}>
        {loading ? (
          <Box sx={loadingBoxStyles}>
            <CircularProgress size={48} />
            <Typography variant="body2" color="text.secondary">
              正在连接...
            </Typography>
          </Box>
        ) : (
          <>
            <MessageList messages={messages} streamingMessageIds={streamingMessageIds} />
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <MessageInput onSend={handleSend} disabled={sending || loading} />
    </Box>
  );
}

export default App;

