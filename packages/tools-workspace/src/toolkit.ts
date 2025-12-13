/**
 * Workspace Toolkit
 *
 * 基于 @moora/toolkit 创建 Workspace 工具集
 */

import type { Toolkit } from "@moora/toolkit";
import { createToolkit } from "@moora/toolkit";

import { createWorkspaceTools } from "./tools.js";
import type { WorkspaceConfig } from "./types.js";

/**
 * 创建 Workspace Toolkit
 *
 * 包含以下工具：
 * - workspace-write-file: 写文件
 * - workspace-read-file: 读文件
 * - workspace-read-directory: 读文件夹
 * - workspace-delete: 删除文件/文件夹
 *
 * @param config - Workspace 配置
 * @returns Toolkit 实例
 *
 * @example
 * ```typescript
 * const toolkit = createWorkspaceToolkit({ rootPath: "./workspace" });
 *
 * // 写文件
 * const writeResult = await toolkit.invoke(
 *   "workspace-write-file",
 *   JSON.stringify({ path: "test.txt", content: "Hello, World!" })
 * );
 *
 * // 读文件
 * const readResult = await toolkit.invoke(
 *   "workspace-read-file",
 *   JSON.stringify({ path: "test.txt" })
 * );
 *
 * // 读文件夹
 * const dirResult = await toolkit.invoke(
 *   "workspace-read-directory",
 *   JSON.stringify({ path: "." })
 * );
 *
 * // 删除文件
 * const deleteResult = await toolkit.invoke(
 *   "workspace-delete",
 *   JSON.stringify({ path: "test.txt" })
 * );
 * ```
 */
export const createWorkspaceToolkit = (config: WorkspaceConfig): Toolkit => {
  const tools = createWorkspaceTools(config);
  return createToolkit(tools);
};
