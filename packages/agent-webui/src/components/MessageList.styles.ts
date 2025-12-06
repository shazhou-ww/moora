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
  bgcolor: role === "user" ? "primary.main" : "secondary.main",
  width: 32,
  height: 32,
});

export const avatarIconStyles: SxProps<Theme> = {
  fontSize: 20,
};

export const messagePaperStyles = (role: "user" | "assistant"): SxProps<Theme> => ({
  p: 2,
  maxWidth: "75%",
  bgcolor: role === "user" ? "primary.main" : "background.paper",
  color: role === "user" ? "primary.contrastText" : "text.primary",
  borderRadius: 2,
  border: role === "assistant" ? "1px solid" : "none",
  borderColor: role === "assistant" ? "divider" : "transparent",
  "& pre": {
    bgcolor: role === "user" ? "rgba(0,0,0,0.2)" : "grey.100",
    borderRadius: 1,
    p: 1,
    overflow: "auto",
    "& code": {
      bgcolor: "transparent",
      p: 0,
    },
  },
  "& code": {
    bgcolor: role === "user" ? "rgba(0,0,0,0.2)" : "grey.200",
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
    borderColor: "divider",
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
      borderColor: "divider",
      px: 1,
      py: 0.5,
    },
    "& th": {
      bgcolor: role === "user" ? "rgba(0,0,0,0.2)" : "grey.100",
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
  bgcolor: role === "user" ? "rgba(0,0,0,0.2)" : "grey.100",
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
  bgcolor: role === "user" ? "rgba(0,0,0,0.2)" : "grey.200",
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

