/**
 * Toolkit 创建工厂
 *
 * 创建 Workforce 使用的 Toolkit 实例
 */

import type { Toolkit } from "@moora/toolkit";
import { emptyToolkit, mergeToolkits } from "@moora/toolkit";
import { createTavilyToolkit } from "@moora/tools-tavily";
import { createWorkspaceToolkit } from "@moora/tools-workspace";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 创建默认 toolkit 的选项
 */
export type CreateDefaultToolkitOptions = {
  /**
   * Tavily API Key（可选，用于启用 Tavily 搜索工具）
   */
  tavilyApiKey?: string;
  /**
   * Workspace 根目录路径（可选，用于启用 Workspace 工具）
   * 如果未提供，将从环境变量 WORKSPACE_PATH 读取
   */
  workspacePath?: string;
};

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建默认 toolkit
 *
 * 根据配置创建包含可用工具的 toolkit
 *
 * @param options - 配置选项
 * @returns Toolkit 实例
 */
export function createDefaultToolkit(
  options: CreateDefaultToolkitOptions = {}
): Toolkit {
  const { tavilyApiKey, workspacePath } = options;
  const toolkits: Toolkit[] = [];

  // 如果提供了 Workspace 路径或环境变量中有设置，添加 Workspace 工具
  const workspaceRootPath = workspacePath ?? process.env.WORKSPACE_PATH;
  if (workspaceRootPath) {
    toolkits.push(createWorkspaceToolkit({ rootPath: workspaceRootPath }));
  }

  // 如果提供了 Tavily API Key，添加 Tavily 工具
  if (tavilyApiKey) {
    toolkits.push(createTavilyToolkit({ apiKey: tavilyApiKey }));
  }

  // 如果没有任何工具，返回空 toolkit
  if (toolkits.length === 0) {
    return emptyToolkit();
  }

  // 合并所有 toolkits
  return mergeToolkits(toolkits);
}
