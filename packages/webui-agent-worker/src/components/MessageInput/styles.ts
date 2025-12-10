/**
 * MessageInput 组件样式
 */

import type { SxProps, Theme } from "@mui/material";

export const paperStyles: SxProps<Theme> = {
  p: 2,
  borderRadius: 0,
  borderTop: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
};

export const containerStyles: SxProps<Theme> = {
  display: "flex",
  gap: 2,
  maxWidth: 900,
  mx: "auto",
  alignItems: "flex-end",
};

export const textFieldStyles: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "background.default",
  },
};

export const buttonStyles: SxProps<Theme> = {
  minWidth: 100,
  height: 56,
  borderRadius: 2,
  textTransform: "none",
  fontSize: "1rem",
};

