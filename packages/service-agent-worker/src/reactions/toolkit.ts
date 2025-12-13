/**
 * Toolkit Reaction 回调工厂
 *
 * 创建用于调用工具的回调函数
 */

import type { ToolCallRequest } from "@moora/agent-worker";
import type { Toolkit } from "@moora/toolkit";
import { emptyToolkit, mergeToolkits } from "@moora/toolkit";
import { createTavilyToolkit } from "@moora/tools-tavily";
import { createWorkspaceToolkit } from "@moora/tools-workspace";
import { getLogger } from "@/logger";



const logger = getLogger();

// ============================================================================
// 回调工厂
// ============================================================================

/**
 * 创建 callTool 回调
 *
 * 执行工具调用并返回结果
 *
 * @param toolkit - Toolkit 实例
 * @returns callTool 回调函数
 */
export function createCallToolCallback(toolkit: Toolkit) {
  return async (request: ToolCallRequest): Promise<string> => {
    const { toolCallId, name, arguments: args } = request;

    logger.toolkit.info("CallTool: Executing tool", { toolCallId, name });

    try {
      if (!toolkit.hasTool(name)) {
        logger.toolkit.warn("CallTool: Tool not found", { toolCallId, name });
        return JSON.stringify({ error: `Tool not found: ${name}` });
      }

      const result = await toolkit.invoke(name, args);
      logger.toolkit.info("CallTool: Tool completed", {
        toolCallId,
        name,
        resultLength: result.length,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.toolkit.error("CallTool: Tool failed", { toolCallId, name, error: errorMessage });
      return JSON.stringify({ error: errorMessage });
    }
  };
}

// ============================================================================
// Toolkit 创建
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
