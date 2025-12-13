/**
 * Workspace Tools Implementation
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, normalize, relative, resolve } from "node:path";

import type { ToolDefinition } from "@moora/toolkit";

import type {
  WorkspaceConfig,
  WriteFileParams,
  WriteFileResult,
  ReadFileParams,
  ReadFileResult,
  ReadDirectoryParams,
  ReadDirectoryResult,
  DirectoryItem,
  DeleteParams,
  DeleteResult,
} from "./types.js";

// ============================================================================
// 路径安全工具函数
// ============================================================================

/**
 * 获取 workspace 根目录路径
 *
 * @param config - Workspace 配置
 * @returns 绝对路径
 */
function getWorkspaceRoot(config: WorkspaceConfig): string {
  return resolve(config.rootPath);
}

/**
 * 验证路径是否在 workspace 内
 *
 * 防止通过 ".." 访问 workspace 文件夹之外的内容
 *
 * @param workspaceRoot - Workspace 根目录
 * @param relativePath - 相对路径
 * @returns 如果路径安全，返回规范化后的绝对路径；否则返回 null
 */
function validatePath(workspaceRoot: string, relativePath: string): string | null {
  // 规范化路径，移除 ".." 和 "." 等
  const normalized = normalize(relativePath);
  
  // 解析为绝对路径
  const absolutePath = resolve(workspaceRoot, normalized);
  
  // 规范化 workspace 根目录
  const rootNormalized = normalize(resolve(workspaceRoot));
  
  // 使用 relative 检查路径是否在 workspace 内
  // 如果路径在 workspace 外，relative 会返回包含 ".." 的路径
  const relativeToRoot = relative(rootNormalized, absolutePath);
  if (relativeToRoot.startsWith("..") || relativeToRoot === "..") {
    return null;
  }
  
  return absolutePath;
}

// ============================================================================
// 工具实现
// ============================================================================

/**
 * 创建写文件工具定义
 *
 * @param config - Workspace 配置
 * @returns 写文件工具定义
 */
export const createWriteFileTool = (config: WorkspaceConfig): ToolDefinition => {
  const workspaceRoot = getWorkspaceRoot(config);
  const rootNormalized = normalize(resolve(workspaceRoot));

  return {
    name: "workspace-write-file",
    description:
      "Write content to a file in the workspace. If the file doesn't exist, it will be created. If the directory doesn't exist, it will be created automatically. The path is relative to the workspace root directory.",
    parameterSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to workspace root directory",
        },
        content: {
          type: "string",
          description: "File content to write",
        },
      },
      required: ["path", "content"],
    },
    execute: async (parameters: string): Promise<string> => {
      const params: WriteFileParams = JSON.parse(parameters);
      
      // 验证路径
      const absolutePath = validatePath(workspaceRoot, params.path);
      if (!absolutePath) {
        const result: WriteFileResult = {
          success: false,
          path: params.path,
          error: "Invalid path: path must be within workspace directory",
        };
        return JSON.stringify(result);
      }

      try {
        // 确保目录存在
        const dirPath = dirname(absolutePath);
        if (dirPath !== rootNormalized && !existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true });
        }

        // 写入文件
        writeFileSync(absolutePath, params.content, "utf-8");

        const result: WriteFileResult = {
          success: true,
          path: absolutePath,
        };
        return JSON.stringify(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result: WriteFileResult = {
          success: false,
          path: absolutePath,
          error: errorMessage,
        };
        return JSON.stringify(result);
      }
    },
  };
};

/**
 * 创建读文件工具定义
 *
 * @param config - Workspace 配置
 * @returns 读文件工具定义
 */
export const createReadFileTool = (config: WorkspaceConfig): ToolDefinition => {
  const workspaceRoot = getWorkspaceRoot(config);

  return {
    name: "workspace-read-file",
    description:
      "Read content from a file in the workspace. The path is relative to the workspace root directory.",
    parameterSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to workspace root directory",
        },
      },
      required: ["path"],
    },
    execute: async (parameters: string): Promise<string> => {
      const params: ReadFileParams = JSON.parse(parameters);
      
      // 验证路径
      const absolutePath = validatePath(workspaceRoot, params.path);
      if (!absolutePath) {
        const result: ReadFileResult = {
          success: false,
          error: "Invalid path: path must be within workspace directory",
        };
        return JSON.stringify(result);
      }

      try {
        // 检查文件是否存在
        if (!existsSync(absolutePath)) {
          const result: ReadFileResult = {
            success: false,
            error: "File not found",
          };
          return JSON.stringify(result);
        }

        // 检查是否为文件
        const stats = statSync(absolutePath);
        if (!stats.isFile()) {
          const result: ReadFileResult = {
            success: false,
            error: "Path is not a file",
          };
          return JSON.stringify(result);
        }

        // 读取文件
        const content = readFileSync(absolutePath, "utf-8");

        const result: ReadFileResult = {
          success: true,
          content,
        };
        return JSON.stringify(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result: ReadFileResult = {
          success: false,
          error: errorMessage,
        };
        return JSON.stringify(result);
      }
    },
  };
};

/**
 * 创建读文件夹工具定义
 *
 * @param config - Workspace 配置
 * @returns 读文件夹工具定义
 */
export const createReadDirectoryTool = (config: WorkspaceConfig): ToolDefinition => {
  const workspaceRoot = getWorkspaceRoot(config);

  return {
    name: "workspace-read-directory",
    description:
      "Read directory contents in the workspace. Returns a list of files and subdirectories. The path is relative to the workspace root directory.",
    parameterSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path relative to workspace root directory",
        },
      },
      required: ["path"],
    },
    execute: async (parameters: string): Promise<string> => {
      const params: ReadDirectoryParams = JSON.parse(parameters);
      
      // 验证路径
      const absolutePath = validatePath(workspaceRoot, params.path);
      if (!absolutePath) {
        const result: ReadDirectoryResult = {
          success: false,
          error: "Invalid path: path must be within workspace directory",
        };
        return JSON.stringify(result);
      }

      try {
        // 检查路径是否存在
        if (!existsSync(absolutePath)) {
          const result: ReadDirectoryResult = {
            success: false,
            error: "Directory not found",
          };
          return JSON.stringify(result);
        }

        // 检查是否为目录
        const stats = statSync(absolutePath);
        if (!stats.isDirectory()) {
          const result: ReadDirectoryResult = {
            success: false,
            error: "Path is not a directory",
          };
          return JSON.stringify(result);
        }

        // 读取目录内容
        const entries = readdirSync(absolutePath, { withFileTypes: true });
        const items: DirectoryItem[] = entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
        }));

        const result: ReadDirectoryResult = {
          success: true,
          items,
        };
        return JSON.stringify(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result: ReadDirectoryResult = {
          success: false,
          error: errorMessage,
        };
        return JSON.stringify(result);
      }
    },
  };
};

/**
 * 创建删除文件/文件夹工具定义
 *
 * @param config - Workspace 配置
 * @returns 删除文件/文件夹工具定义
 */
export const createDeleteTool = (config: WorkspaceConfig): ToolDefinition => {
  const workspaceRoot = getWorkspaceRoot(config);
  const rootNormalized = normalize(resolve(workspaceRoot));

  return {
    name: "workspace-delete",
    description:
      "Delete a file or directory in the workspace. For directories, set recursive to true to delete recursively. The path is relative to the workspace root directory.",
    parameterSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File or directory path relative to workspace root directory",
        },
        recursive: {
          type: "boolean",
          description: "Whether to delete recursively (for directories only)",
          default: false,
        },
      },
      required: ["path"],
    },
    execute: async (parameters: string): Promise<string> => {
      const params: DeleteParams = JSON.parse(parameters);
      
      // 验证路径
      const absolutePath = validatePath(workspaceRoot, params.path);
      if (!absolutePath) {
        const result: DeleteResult = {
          success: false,
          error: "Invalid path: path must be within workspace directory",
        };
        return JSON.stringify(result);
      }

      // 防止删除 workspace 根目录
      const absolutePathNormalized = normalize(absolutePath);
      if (absolutePathNormalized === rootNormalized) {
        const result: DeleteResult = {
          success: false,
          error: "Cannot delete workspace root directory",
        };
        return JSON.stringify(result);
      }

      try {
        // 检查路径是否存在
        if (!existsSync(absolutePath)) {
          const result: DeleteResult = {
            success: false,
            error: "File or directory not found",
          };
          return JSON.stringify(result);
        }

        // 删除文件或目录
        const stats = statSync(absolutePath);
        if (stats.isDirectory()) {
          rmSync(absolutePath, { recursive: params.recursive ?? false, force: true });
        } else {
          rmSync(absolutePath, { force: true });
        }

        const result: DeleteResult = {
          success: true,
        };
        return JSON.stringify(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result: DeleteResult = {
          success: false,
          error: errorMessage,
        };
        return JSON.stringify(result);
      }
    },
  };
};

/**
 * 创建所有 Workspace 工具
 *
 * @param config - Workspace 配置
 * @returns Workspace 工具定义列表
 */
export const createWorkspaceTools = (
  config: WorkspaceConfig
): readonly ToolDefinition[] => {
  return [
    createWriteFileTool(config),
    createReadFileTool(config),
    createReadDirectoryTool(config),
    createDeleteTool(config),
  ];
};
