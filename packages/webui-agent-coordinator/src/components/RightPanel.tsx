/**
 * 右侧面板组件
 *
 * 整合文件浏览器和文件查看器
 */

import { Box, Paper } from "@mui/material";
import { useState, useCallback } from "react";

import { FileExplorer } from "./FileExplorer";
import { FileViewer } from "./FileViewer";
import type { FileItem } from "@/utils/webdav";

/**
 * 右侧面板属性
 */
type RightPanelProps = {
  /**
   * 面板宽度
   */
  width: number;
};

/**
 * 右侧面板组件
 */
export function RightPanel({ width }: RightPanelProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileItem, setSelectedFileItem] = useState<FileItem | null>(null);
  const [explorerWidth] = useState(280);

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((path: string, item: FileItem) => {
    setSelectedFilePath(path);
    setSelectedFileItem(item);
  }, []);

  /**
   * 处理关闭文件查看器
   */
  const handleCloseFileViewer = useCallback(() => {
    setSelectedFilePath(null);
    setSelectedFileItem(null);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        width,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderLeft: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* 文件浏览器 */}
        <Box
          sx={{
            width: explorerWidth,
            flexShrink: 0,
            borderRight: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <FileExplorer
            selectedPath={selectedFilePath}
            onFileSelect={handleFileSelect}
          />
        </Box>

        {/* 文件查看器 */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
          }}
        >
          <FileViewer
            filePath={selectedFilePath}
            fileItem={selectedFileItem}
            onClose={handleCloseFileViewer}
          />
        </Box>
      </Box>
    </Paper>
  );
}
