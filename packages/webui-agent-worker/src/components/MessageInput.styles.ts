/**
 * MessageInput 组件样式
 */

import type { SxProps, Theme } from "@mui/material";

export const paperStyles: SxProps<Theme> = {
  p: 2,
  borderRadius: 0,
  borderTop: 1,
  borderColor: "#D4B5B5", // 莫兰迪灰粉色边框
  bgcolor: "#E8DCC0", // 莫兰迪浅黄色
  boxShadow: "0 -2px 8px rgba(0,0,0,0.03)",
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
    bgcolor: "#FFFFFF",
    "& fieldset": {
      borderColor: "#D4B5B5", // 莫兰迪灰粉色
    },
    "&:hover fieldset": {
      borderColor: "#C9A8A8", // 莫兰迪灰红色
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C9A8A8", // 莫兰迪灰红色聚焦
      borderWidth: 2,
    },
  },
};

export const buttonStyles: SxProps<Theme> = {
  minWidth: 100,
  height: 56,
  borderRadius: 2,
  textTransform: "none",
  fontSize: "1rem",
  bgcolor: "#C9A8A8", // 莫兰迪灰红色
  color: "#FFFFFF",
  "&:hover": {
    bgcolor: "#B08A8A",
  },
  "&:disabled": {
    bgcolor: "#E0DDD8",
    color: "#8B8B8B",
  },
};

