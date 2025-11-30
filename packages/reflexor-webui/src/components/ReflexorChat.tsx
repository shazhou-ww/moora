// ============================================================================
// Reflexor 聊天组件
// ============================================================================

import { Box, Paper } from "@mui/material";
import { useReflexor } from "../hooks/use-reflexor";
import type { UseReflexorConfig } from "../hooks/use-reflexor";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

/**
 * Reflexor 聊天组件属性
 */
export type ReflexorChatProps = UseReflexorConfig & {
  /**
   * 标题
   */
  title?: string;

  /**
   * 高度
   * @default "100%"
   */
  height?: string | number;

  /**
   * 宽度
   * @default "100%"
   */
  width?: string | number;
};

/**
 * Reflexor 聊天组件
 *
 * 完整的聊天界面，包含头部、消息列表和输入框。
 *
 * @param props - 组件属性
 * @returns React 元素
 *
 * @example
 * ```tsx
 * <ReflexorChat
 *   baseUrl="http://localhost:3000/api/reflexor"
 *   title="AI 助手"
 *   height="600px"
 * />
 * ```
 */
export const ReflexorChat = ({
  baseUrl,
  autoConnect = true,
  title = "Reflexor",
  height = "100%",
  width = "100%",
}: ReflexorChatProps) => {
  const {
    state,
    optimisticState,
    isConnected,
    isSending,
    sendMessage,
    cancel,
    retry,
    clear,
  } = useReflexor({ baseUrl, autoConnect });

  const isWaiting = state?.isWaitingBrain ?? false;

  return (
    <Paper
      elevation={3}
      sx={{
        height,
        width,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 2,
      }}
    >
      {/* 头部 */}
      <ChatHeader
        title={title}
        isConnected={isConnected}
        isWaiting={isWaiting}
        onCancel={cancel}
        onRetry={retry}
        onClear={clear}
      />

      {/* 消息列表 */}
      <MessageList state={state} optimisticState={optimisticState} />

      {/* 输入框 */}
      <MessageInput
        onSend={sendMessage}
        isSending={isSending}
        disabled={!isConnected}
        placeholder={isConnected ? "输入消息..." : "未连接到服务器"}
      />
    </Paper>
  );
};

