/**
 * App 组件样式
 */

import type { SxProps, Theme } from "@mui/material";

export const rootStyles: SxProps<Theme> = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
};

export const appBarStyles: SxProps<Theme> = {
  bgcolor: "#E8DCC0", // 莫兰迪浅黄色（与输入框一致）
  borderBottom: "1px solid #D4B5B5",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

export const appBarIconStyles: SxProps<Theme> = {
  mr: 2,
  color: "#D4C5A9", // 莫兰迪黄色
  filter: "drop-shadow(0 0 2px rgba(201,168,168,0.3))", // 添加红色阴影点缀
};

export const appBarTitleStyles: SxProps<Theme> = {
  flexGrow: 1,
  color: "#5C5C5C",
  fontWeight: 500,
};

export const errorAlertStyles: SxProps<Theme> = {
  mx: 2,
  mt: 2,
};

export const contentBoxStyles: SxProps<Theme> = {
  flex: 1,
  overflow: "auto",
  bgcolor: "#FAF9F7", // 更浅的米色背景
  position: "relative",
};

export const loadingBoxStyles: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  gap: 2,
};

export const messageCountChipStyles: SxProps<Theme> = {
  bgcolor: "#8FA3B5", // 莫兰迪灰蓝色背景
  color: "#FFFFFF", // 白色文字
  fontWeight: 500,
  border: "none",
  "& .MuiChip-label": {
    color: "#FFFFFF",
  },
};

