/**
 * MessageList 组件样式
 */

import type { SxProps, Theme } from "@mui/material";

export const containerStyles: SxProps<Theme> = {
  width: "100%",
  maxWidth: 900,
  mx: "auto",
  py: 3,
  px: 2,
};

export const emptyStateStyles: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "text.secondary",
};

export const emptyStateIconStyles: SxProps<Theme> = {
  fontSize: 64,
  mb: 2,
  opacity: 0.3,
};

export const messageRowStyles = (role: "user" | "assistant"): SxProps<Theme> => ({
  display: "flex",
  justifyContent: role === "user" ? "flex-end" : "flex-start",
  mb: 2,
  gap: 1,
});

export const avatarStyles = (role: "user" | "assistant"): SxProps<Theme> => ({
  bgcolor: role === "user" ? "primary.main" : "#D4C5A9", // 莫兰迪黄色
  width: 32,
  height: 32,
  border: role === "user" ? "2px solid #C9A8A8" : "none", // 用户头像添加红色边框点缀
});

export const avatarIconStyles: SxProps<Theme> = {
  fontSize: 20,
};

export const messagePaperStyles = (role: "user" | "assistant"): SxProps<Theme> => ({
  p: 2,
  maxWidth: "75%",
  bgcolor: role === "user" ? "primary.main" : "#F5F0E8", // Agent消息用浅米色
  color: role === "user" ? "primary.contrastText" : "text.primary",
  borderRadius: 2,
  border: role === "assistant" ? "1px solid" : "none",
  borderColor: role === "assistant" ? "#E8DCC0" : "transparent", // 浅黄色边框
  boxShadow: role === "user" 
    ? "0 2px 4px rgba(143,163,181,0.2)" 
    : "0 2px 4px rgba(212,197,169,0.15)",
  "& pre": {
    bgcolor: role === "user" ? "rgba(255,255,255,0.2)" : "#E8DCC0", // Agent代码块用浅黄色
    borderRadius: 1,
    p: 1,
    overflow: "auto",
    "& code": {
      bgcolor: "transparent",
      p: 0,
    },
  },
  "& code": {
    bgcolor: role === "user" ? "rgba(255,255,255,0.25)" : "#D4C5A9", // Agent行内代码用黄色
    px: 0.5,
    py: 0.25,
    borderRadius: 0.5,
    fontSize: "0.9em",
  },
  "& p": {
    margin: 0,
    "&:not(:last-child)": {
      mb: 1,
    },
  },
  "& ul, & ol": {
    margin: 0,
    pl: 2,
    "& li": {
      mb: 0.5,
    },
  },
  "& blockquote": {
    borderLeft: 3,
    borderColor: role === "user" ? "rgba(255,255,255,0.4)" : "#D4C5A9",
    pl: 2,
    ml: 0,
    mr: 0,
    fontStyle: "italic",
  },
  "& table": {
    borderCollapse: "collapse",
    width: "100%",
    "& th, & td": {
      border: 1,
      borderColor: role === "user" ? "rgba(255,255,255,0.3)" : "#E8DCC0",
      px: 1,
      py: 0.5,
    },
    "& th": {
      bgcolor: role === "user" ? "rgba(255,255,255,0.2)" : "#E8DCC0",
    },
  },
});

export const markdownContainerStyles: SxProps<Theme> = {
  wordBreak: "break-word",
  lineHeight: 1.6,
  "& > *:first-of-type": {
    mt: 0,
  },
  "& > *:last-of-type": {
    mb: 0,
  },
};

export const paragraphStyles: SxProps<Theme> = {
  mb: 1,
  "&:last-child": { mb: 0 },
  color: "inherit",
};

export const codeBlockStyles = (role: "user" | "assistant"): SxProps<Theme> => ({
  bgcolor: role === "user" ? "rgba(255,255,255,0.2)" : "#E8DCC0", // Agent代码块用浅黄色
  borderRadius: 1,
  p: 1.5,
  overflow: "auto",
  mb: 1,
  "& code": {
    bgcolor: "transparent",
    p: 0,
    color: "inherit",
  },
});

export const inlineCodeStyles = (role: "user" | "assistant"): SxProps<Theme> => ({
  bgcolor: role === "user" ? "rgba(255,255,255,0.25)" : "#D4C5A9", // Agent行内代码用黄色
  px: 0.5,
  py: 0.25,
  borderRadius: 0.5,
  fontSize: "0.9em",
  color: "inherit",
});

export const timestampStyles: SxProps<Theme> = {
  display: "block",
  mt: 1,
  opacity: 0.7,
  fontSize: "0.75rem",
};

