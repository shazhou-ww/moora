// ============================================================================
// 聊天头部组件
// ============================================================================

import { Box, Typography, IconButton, Chip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopIcon from "@mui/icons-material/Stop";
import CircleIcon from "@mui/icons-material/Circle";

/**
 * 聊天头部属性
 */
export type ChatHeaderProps = {
  /**
   * 标题
   */
  title?: string;

  /**
   * 是否已连接
   */
  isConnected: boolean;

  /**
   * 是否正在等待响应
   */
  isWaiting?: boolean;

  /**
   * 取消回调
   */
  onCancel?: () => void;

  /**
   * 重试回调
   */
  onRetry?: () => void;

  /**
   * 清空回调
   */
  onClear?: () => void;
};

/**
 * 聊天头部组件
 *
 * @param props - 组件属性
 * @returns React 元素
 */
export const ChatHeader = ({
  title = "Reflexor",
  isConnected,
  isWaiting = false,
  onCancel,
  onRetry,
  onClear,
}: ChatHeaderProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* 左侧：标题和连接状态 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" component="h1">
          {title}
        </Typography>

        <Chip
          icon={
            <CircleIcon
              sx={{
                fontSize: "0.6rem !important",
                color: isConnected ? "success.main" : "error.main",
              }}
            />
          }
          label={isConnected ? "已连接" : "未连接"}
          size="small"
          variant="outlined"
          sx={{
            borderColor: isConnected ? "success.main" : "error.main",
            color: isConnected ? "success.main" : "error.main",
          }}
        />
      </Box>

      {/* 右侧：操作按钮 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {isWaiting && onCancel && (
          <IconButton
            size="small"
            onClick={onCancel}
            title="取消"
            color="warning"
          >
            <StopIcon />
          </IconButton>
        )}

        {onRetry && (
          <IconButton
            size="small"
            onClick={onRetry}
            title="重试"
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        )}

        {onClear && (
          <IconButton
            size="small"
            onClick={onClear}
            title="清空"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

