// ============================================================================
// 消息输入组件
// ============================================================================

import { useState, useCallback } from "react";
import { Box, TextField, IconButton, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

/**
 * 消息输入属性
 */
export type MessageInputProps = {
  /**
   * 发送消息回调
   */
  onSend: (content: string) => Promise<void>;

  /**
   * 是否正在发送
   */
  isSending?: boolean;

  /**
   * 是否禁用
   */
  disabled?: boolean;

  /**
   * 占位符文本
   */
  placeholder?: string;
};

/**
 * 消息输入组件
 *
 * @param props - 组件属性
 * @returns React 元素
 */
export const MessageInput = ({
  onSend,
  isSending = false,
  disabled = false,
  placeholder = "输入消息...",
}: MessageInputProps) => {
  const [value, setValue] = useState("");

  const handleSend = useCallback(async () => {
    const content = value.trim();
    if (!content || isSending || disabled) {
      return;
    }

    setValue("");
    await onSend(content);
  }, [value, isSending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: 1,
        p: 2,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        variant="outlined"
        size="small"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      />

      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={!value.trim() || isSending || disabled}
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "&:hover": {
            bgcolor: "primary.dark",
          },
          "&.Mui-disabled": {
            bgcolor: "action.disabledBackground",
            color: "action.disabled",
          },
        }}
      >
        {isSending ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <SendIcon />
        )}
      </IconButton>
    </Box>
  );
};

