/**
 * 主应用组件
 */

import { KeyboardArrowDown, Menu as MenuIcon } from "@mui/icons-material";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  AppBar,
  Toolbar,
  Chip,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";

import { MessageInput } from "@/components/MessageInput";
import { MessageListContainer } from "@/components/MessageListContainer";
import { TaskPanel } from "@/components/TaskPanel";
import { useStreamingMessages } from "@/hooks";
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
import type { ContextOfUser, TaskInfo } from "@/types";
import { sendMessage } from "@/utils/api";
import { createSSEConnection, applyPatchesToContext } from "@/utils/sse";

/**
 * 合并 validTasks 和 topLevelTasks 得到完整的任务信息
 */
function mergeTaskInfo(context: ContextOfUser | null): TaskInfo[] {
  if (!context) return [];

  const { validTasks = [], topLevelTasks = [] } = context;

  // 创建一个 Map 用于快速查找 topLevelTasks 的状态
  const statusMap = new Map(
    topLevelTasks.map((t) => [t.id, { status: t.status, result: t.result }])
  );

  // 合并信息：从 validTasks 获取 title/goal，从 topLevelTasks 获取 status/result
  const merged = validTasks.map((validTask) => {
    const statusInfo = statusMap.get(validTask.id);
    return {
      id: validTask.id,
      title: validTask.title,
      goal: validTask.goal,
      status: statusInfo?.status ?? "pending",
      result: statusInfo?.result,
    };
  });

  console.log("[App] Merged tasks:", {
    validTasksCount: validTasks.length,
    topLevelTasksCount: topLevelTasks.length,
    mergedCount: merged.length,
    tasks: merged,
  });

  return merged;
}


function App() {
  const [context, setContext] = useState<ContextOfUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollToBottomFn, setScrollToBottomFn] = useState<(() => void) | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = useState(true);

  // 使用流式消息管理 Hook
  const { messages, streamingMessageIds, toolCalls, renderItems } = useStreamingMessages(context);

  // 合并 validTasks 和 topLevelTasks 获取完整任务信息
  const tasks = mergeTaskInfo(context);

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
            console.log("[App] Full context received:", {
              userMessagesCount: data.userMessages?.length ?? 0,
              assiMessagesCount: data.assiMessages?.length ?? 0,
              validTasksCount: data.validTasks?.length ?? 0,
              topLevelTasksCount: data.topLevelTasks?.length ?? 0,
              validTasks: data.validTasks,
              topLevelTasks: data.topLevelTasks,
            });
            setContext(data);
            setLoading(false);
            setError(null);
          },
          (patches) => {
            // Patch 更新
            console.log("[App] Patches received:", patches);
            setContext((prevContext) => {
              if (!prevContext) {
                return prevContext;
              }
              const newContext = applyPatchesToContext(prevContext, patches);
              console.log("[App] Context after patch:", {
                validTasksCount: newContext.validTasks?.length ?? 0,
                topLevelTasksCount: newContext.topLevelTasks?.length ?? 0,
                validTasks: newContext.validTasks,
                topLevelTasks: newContext.topLevelTasks,
              });
              return newContext;
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setTaskPanelOpen((prev) => !prev)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
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
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* 左侧任务面板 */}
        {taskPanelOpen && !loading && (
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TaskPanel tasks={tasks} />
          </Box>
        )}

        {/* 主聊天区域 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
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
            renderItems={renderItems}
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
      </Box>

      <MessageInput onSend={handleSend} disabled={sending || loading} />
    </Box>
  );
}

export default App;

