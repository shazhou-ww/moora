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
  bgcolor: "background.paper",
};

export const appBarIconStyles: SxProps<Theme> = {
  mr: 2,
  color: "primary.main",
};

export const appBarTitleStyles: SxProps<Theme> = {
  flexGrow: 1,
  color: "text.primary",
};

export const errorAlertStyles: SxProps<Theme> = {
  mx: 2,
  mt: 2,
};

export const contentBoxStyles: SxProps<Theme> = {
  flex: 1,
  overflow: "auto",
  bgcolor: "background.default",
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

