/**
 * ToolCallStatus 组件样式
 */

import type { SxProps, Theme } from "@mui/material";

export const toolCallContainerStyles: SxProps<Theme> = {
  width: "100%",
  maxWidth: 900,
  mx: "auto",
  my: 1,
  px: 2,
};

export const toolCallItemStyles: SxProps<Theme> = {
  bgcolor: "#FAF8F5",
  border: "1px solid #E8DCC0",
  borderRadius: 2,
  overflow: "hidden",
  mb: 1,
  "&:last-child": {
    mb: 0,
  },
};

export const toolCallHeaderStyles: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  px: 2,
  py: 1,
  cursor: "pointer",
  transition: "background-color 0.2s",
  "&:hover": {
    bgcolor: "#F5F0E8",
  },
};

export const toolCallIconStyles: SxProps<Theme> = {
  fontSize: 18,
  color: "#D4C5A9",
};

export const toolCallNameStyles: SxProps<Theme> = {
  fontWeight: 500,
  fontSize: "0.9rem",
  color: "text.primary",
  fontFamily: "monospace",
};

export const toolCallStatusChipStyles = (isPending: boolean): SxProps<Theme> => ({
  ml: 1,
  bgcolor: isPending ? "#FFF8E1" : "#E8F5E9",
  color: isPending ? "#F9A825" : "#4CAF50",
  fontWeight: 500,
  fontSize: "0.75rem",
  height: 22,
  "& .MuiChip-label": {
    px: 1,
  },
  ...(isPending && {
    animation: "pulse 2s infinite",
    "@keyframes pulse": {
      "0%, 100%": {
        opacity: 1,
      },
      "50%": {
        opacity: 0.6,
      },
    },
  }),
});

export const toolCallDetailsStyles: SxProps<Theme> = {
  px: 2,
  py: 1.5,
  bgcolor: "#F5F0E8",
  borderTop: "1px solid #E8DCC0",
};

export const toolCallCodeBlockStyles: SxProps<Theme> = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E8DCC0",
  borderRadius: 1,
  p: 1.5,
  overflow: "auto",
  fontSize: "0.85rem",
  fontFamily: "monospace",
  lineHeight: 1.5,
  m: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  maxHeight: 200,
  "& code": {
    bgcolor: "transparent",
    p: 0,
    color: "text.primary",
  },
};
