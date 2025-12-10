/**
 * 消息输入组件
 */

import { Box, Button, TextField, Paper } from "@mui/material";
import { Send } from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import {
  paperStyles,
  containerStyles,
  textFieldStyles,
  buttonStyles,
} from "./MessageInput.styles";

type MessageInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldFocusRef = useRef(false);

  // 当 disabled 从 true 变回 false 时，恢复焦点
  useEffect(() => {
    if (!disabled && shouldFocusRef.current) {
      shouldFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent("");
      // 标记需要恢复焦点
      shouldFocusRef.current = true;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper elevation={3} sx={paperStyles}>
      <Box sx={containerStyles}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="输入消息..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          variant="outlined"
          sx={textFieldStyles}
          inputRef={inputRef}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          sx={buttonStyles}
          startIcon={<Send sx={{ color: "inherit" }} />}
        >
          发送
        </Button>
      </Box>
    </Paper>
  );
}

