/**
 * 文件浏览器组件
 *
 * 提供目录树浏览功能，支持展开/折叠目录，点击文件查看内容
 */

import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { listDirectory, isImageFile, isTextFile, type FileItem } from "@/utils/webdav";

/**
 * 文件浏览器属性
 */
type FileExplorerProps = {
  /**
   * 当前选中的文件路径
   */
  selectedPath: string | null;
  /**
   * 文件选择回调
   */
  onFileSelect: (path: string, item: FileItem) => void;
};

/**
 * 目录项状态
 */
type DirectoryState = {
  /**
   * 是否已展开
   */
  expanded: boolean;
  /**
   * 是否正在加载
   */
  loading: boolean;
  /**
   * 子项列表
   */
  items: FileItem[];
  /**
   * 错误信息
   */
  error: string | null;
};

/**
 * 文件浏览器组件
 */
export function FileExplorer({ selectedPath, onFileSelect }: FileExplorerProps) {
  const [rootItems, setRootItems] = useState<FileItem[]>([]);
  const [rootLoading, setRootLoading] = useState(true);
  const [rootError, setRootError] = useState<string | null>(null);
  const [directoryStates, setDirectoryStates] = useState<Map<string, DirectoryState>>(new Map());

  /**
   * 加载目录内容
   */
  const loadDirectory = useCallback(async (path: string) => {
    setDirectoryStates((prev) => {
      const state = prev.get(path);
      if (state?.loading) {
        return prev; // 已经在加载，不重复加载
      }

      // 设置加载状态
      const newMap = new Map(prev);
      newMap.set(path, {
        expanded: true,
        loading: true,
        items: [],
        error: null,
      });
      return newMap;
    });

    try {
      const items = await listDirectory(path);
      setDirectoryStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(path, {
          expanded: true,
          loading: false,
          items,
          error: null,
        });
        return newMap;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "加载失败";
      setDirectoryStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(path, {
          expanded: true,
          loading: false,
          items: [],
          error: errorMessage,
        });
        return newMap;
      });
    }
  }, []);

  /**
   * 刷新根目录
   */
  const refreshRoot = useCallback(async () => {
    setRootLoading(true);
    setRootError(null);
    try {
      const items = await listDirectory("");
      setRootItems(items);
    } catch (error) {
      setRootError(error instanceof Error ? error.message : "加载失败");
    } finally {
      setRootLoading(false);
    }
  }, []);

  /**
   * 切换目录展开/折叠
   */
  const toggleDirectory = useCallback(
    (path: string) => {
      setDirectoryStates((prev) => {
        const state = prev.get(path);
        if (!state) {
          // 如果目录未加载，先设置状态，然后异步加载
          const newMap = new Map(prev);
          newMap.set(path, {
            expanded: true,
            loading: true,
            items: [],
            error: null,
          });
          // 异步加载目录内容
          loadDirectory(path);
          return newMap;
        }

        if (state.expanded) {
          // 折叠
          const newMap = new Map(prev);
          newMap.set(path, {
            ...state,
            expanded: false,
          });
          return newMap;
        } else {
          // 展开
          if (state.items.length === 0 && !state.error && !state.loading) {
            // 需要重新加载
            loadDirectory(path);
            const newMap = new Map(prev);
            newMap.set(path, {
              ...state,
              expanded: true,
              loading: true,
            });
            return newMap;
          } else {
            const newMap = new Map(prev);
            newMap.set(path, {
              ...state,
              expanded: true,
            });
            return newMap;
          }
        }
      });
    },
    [loadDirectory]
  );

  /**
   * 处理文件点击
   */
  const handleFileClick = useCallback(
    (item: FileItem) => {
      if (item.isDirectory) {
        toggleDirectory(item.path);
      } else {
        // 只支持文本文件、代码文件和图片文件
        if (isTextFile(item.name) || isImageFile(item.name)) {
          onFileSelect(item.path, item);
        }
      }
    },
    [toggleDirectory, onFileSelect]
  );

  /**
   * 初始化加载根目录
   */
  useEffect(() => {
    refreshRoot();
  }, [refreshRoot]);

  /**
   * 渲染目录项
   */
  const renderDirectoryItem = useCallback(
    (item: FileItem, depth: number = 0) => {
      const state = directoryStates.get(item.path);
      const isExpanded = state?.expanded ?? false;
      const isLoading = state?.loading ?? false;
      const isSelected = selectedPath === item.path;

      if (item.isDirectory) {
        return (
          <Box key={item.path}>
            <ListItem
              disablePadding
              sx={{
                pl: depth * 2,
              }}
            >
              <ListItemButton
                onClick={() => handleFileClick(item)}
                selected={false}
                sx={{
                  py: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "transparent",
                  },
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {isExpanded ? (
                    <FolderOpenIcon fontSize="small" color="primary" />
                  ) : (
                    <FolderIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    variant: "body2",
                  }}
                />
                {isLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </ListItemButton>
            </ListItem>
            {isExpanded && state && (
              <Box>
                {state.error ? (
                  <Box sx={{ pl: (depth + 1) * 2 + 4, py: 1 }}>
                    <Alert severity="error" sx={{ py: 0.5 }}>
                      {state.error}
                    </Alert>
                  </Box>
                ) : (
                  state.items.map((childItem) => renderDirectoryItem(childItem, depth + 1))
                )}
              </Box>
            )}
          </Box>
        );
      } else {
        // 只显示可查看的文件
        if (!isTextFile(item.name) && !isImageFile(item.name)) {
          return null;
        }

        return (
          <ListItem
            key={item.path}
            disablePadding
            sx={{
              pl: depth * 2,
            }}
          >
            <ListItemButton
              onClick={() => handleFileClick(item)}
              selected={isSelected}
              sx={{
                py: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <FileIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  variant: "body2",
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      }
    },
    [directoryStates, selectedPath, handleFileClick]
  );

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
      }}
    >
      {/* 标题栏 */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="h2">
          文件浏览器
        </Typography>
        <IconButton size="small" onClick={refreshRoot} disabled={rootLoading}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 文件列表 */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {rootLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : rootError ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{rootError}</Alert>
          </Box>
        ) : rootItems.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              目录为空
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 1 }}>
            {rootItems.map((item) => renderDirectoryItem(item, 0))}
          </List>
        )}
      </Box>
    </Box>
  );
}
