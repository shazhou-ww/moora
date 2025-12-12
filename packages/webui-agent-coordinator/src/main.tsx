/**
 * 应用入口
 */

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import React from "react";
import ReactDOM from "react-dom/client";

import "highlight.js/styles/github-dark.css";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8FA3B5", // 莫兰迪灰蓝色（用户消息）
      light: "#B5C4D1",
      dark: "#6B7F91",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D4C5A9", // 莫兰迪黄色（Agent）
      light: "#E8DCC0",
      dark: "#B8A88C",
      contrastText: "#5C5C5C",
    },
    background: {
      default: "#F5F3F0", // 莫兰迪米白色背景
      paper: "#FFFFFF",
    },
    text: {
      primary: "#5C5C5C", // 深灰色
      secondary: "#8B8B8B", // 中灰色
    },
    divider: "#D4C5A9", // 柔和的黄色边框
    grey: {
      50: "#FAF9F7",
      100: "#F0EDE8", // 浅米色
      200: "#E0DDD8", // 中米色
      300: "#D0CDC8", // 深米色
    },
    // 扩展莫兰迪色系
    info: {
      main: "#A8B5A0", // 莫兰迪灰绿色
      light: "#C4D0BC",
      dark: "#8A9782",
    },
    success: {
      main: "#B5C4D1", // 莫兰迪灰蓝色
      light: "#D1DEE8",
      dark: "#9AA8B5",
    },
    warning: {
      main: "#D4B5B5", // 莫兰迪灰粉色
      light: "#E8D4D4",
      dark: "#B89A9A",
    },
    error: {
      main: "#C9A8A8", // 莫兰迪灰红色
      light: "#E0C4C4",
      dark: "#B08A8A",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

