/**
 * 文件查看器组件
 *
 * 支持查看 Markdown、文本、代码文件和图片
 */

import { Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createHighlighter } from "shiki";

import {
  readTextFile,
  readFile,
  isMarkdownFile,
  isImageFile,
  getCodeLanguage,
  type FileItem,
} from "@/utils/webdav";

/**
 * 文件查看器属性
 */
type FileViewerProps = {
  /**
   * 文件路径
   */
  filePath: string | null;
  /**
   * 文件信息
   */
  fileItem: FileItem | null;
  /**
   * 关闭回调
   */
  onClose: () => void;
};

/**
 * 文件查看器组件
 */
export function FileViewer({ filePath, fileItem, onClose }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [highlighter, setHighlighter] = useState<Awaited<ReturnType<typeof createHighlighter>> | null>(null);

  // 创建并初始化 Shiki highlighter
  useEffect(() => {
    let cancelled = false;

    createHighlighter({
      themes: ["github-dark"],
      langs: [
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "json",
        "python",
        "bash",
        "shell",
        "yaml",
        "yml",
        "markdown",
        "html",
        "css",
        "go",
        "rust",
        "java",
        "cpp",
        "c",
        "ruby",
        "php",
        "swift",
        "kotlin",
        "scala",
        "sql",
        "vue",
        "graphql",
        "text",
      ],
    }).then((h) => {
      if (!cancelled) {
        setHighlighter(h);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // 创建 rehype 插件
  const rehypeShikiPlugin = useMemo(() => {
    if (!highlighter) {
      // 如果 highlighter 还未初始化，返回空数组（不使用插件）
      return [];
    }

    const transformer = rehypeShikiFromHighlighter(highlighter, {
      themes: {
        dark: "github-dark",
      },
    });

    // 包装 transformer 以确保总是返回有效节点
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeTransformer = (tree: any, file?: any, next?: any) => {
      // 确保 tree 有 children 属性（防御性检查）
      if (!tree || typeof tree !== "object" || !("children" in tree)) {
        return tree;
      }

      try {
        // 调用原始 transformer（总是传递所有参数）
        const result = transformer(tree, file, next);
        
        // 如果是 Promise，处理异步情况
        if (result && typeof result === "object" && "then" in result) {
          return (result as Promise<any>).catch((error) => {
            console.warn("Shiki highlighting error:", error);
            return tree;
          }).then((resolved) => {
            // 确保解析后的结果也有 children 属性
            if (!resolved || typeof resolved !== "object" || !("children" in resolved)) {
              return tree;
            }
            return resolved;
          });
        }
        
        // 确保返回的节点有 children 属性
        if (!result || typeof result !== "object" || !("children" in result)) {
          // 如果 transformer 没有返回有效结果，返回原始 tree
          return tree;
        }
        return result;
      } catch (error) {
        console.warn("Shiki highlighting error:", error);
        // 出错时返回原始 tree，避免破坏渲染
        return tree;
      }
    };

    // 将 transformer 包装成插件格式
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [safeTransformer] as any[];
  }, [highlighter]);

  /**
   * 加载文件内容
   */
  useEffect(() => {
    if (!filePath || !fileItem) {
      setContent(null);
      setImageUrl(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setContent(null);
    setImageUrl(null);

    const loadFile = async () => {
      try {
        if (isImageFile(fileItem.name)) {
          // 图片文件：创建对象 URL
          const blob = await readFile(filePath);
          const url = URL.createObjectURL(blob);
          setImageUrl(url);

          // 清理旧的 URL
          return () => {
            if (url) {
              URL.revokeObjectURL(url);
            }
          };
        } else {
          // 文本文件
          const text = await readTextFile(filePath);
          setContent(text);

          // 如果是代码文件（非 Markdown），使用 Shiki 高亮
          if (!isMarkdownFile(fileItem.name) && highlighter) {
            try {
              const lang = getCodeLanguage(fileItem.name) || "text";
              const html = highlighter.codeToHtml(text, {
                lang,
                theme: "github-dark",
              });
              setHighlightedCode(html);
            } catch (err) {
              // 如果高亮失败，使用原始文本
              console.warn("Failed to highlight code:", err);
              setHighlightedCode(null);
            }
          } else {
            setHighlightedCode(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载文件失败");
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [filePath, fileItem]);

  // 清理图片 URL
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (!filePath || !fileItem) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          选择一个文件查看内容
        </Typography>
      </Box>
    );
  }

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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fileItem.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filePath}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 内容区域 */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
        }}
      >
        {loading ? (
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
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : imageUrl ? (
          // 图片查看
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100%",
            }}
          >
            <Box
              component="img"
              src={imageUrl}
              alt={fileItem.name}
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        ) : content !== null ? (
          // 文本/代码查看
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "background.default",
            }}
          >
            {isMarkdownFile(fileItem.name) ? (
              // Markdown 渲染
              <Box
                sx={{
                  "& pre": {
                    borderRadius: 1,
                    p: 2,
                    overflow: "auto",
                  },
                  "& code": {
                    fontFamily: "monospace",
                  },
                }}
              >
                <ReactMarkdown
                  rehypePlugins={rehypeShikiPlugin.length > 0 ? rehypeShikiPlugin : []}
                  remarkPlugins={[remarkGfm]}
                >
                  {content}
                </ReactMarkdown>
              </Box>
            ) : highlightedCode ? (
              // 代码高亮（使用 Shiki）
              <Box
                component="div"
                sx={{
                  "& pre": {
                    margin: 0,
                    borderRadius: 1,
                    fontSize: "0.875rem",
                    overflow: "auto",
                  },
                }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            ) : (
              // 纯文本（无高亮）
              <Box
                component="pre"
                sx={{
                  margin: 0,
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {content}
              </Box>
            )}
          </Paper>
        ) : null}
      </Box>
    </Box>
  );
}
