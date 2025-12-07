/**
 * 默认 Toolkit 创建函数
 */

import { emptyToolkit, mergeToolkits, type Toolkit } from "@moora/toolkit";
import { createTavilyToolkit } from "@moora/tools-tavily";

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
};

// ============================================================================
// 实现
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
  const { tavilyApiKey } = options;
  const toolkits: Toolkit[] = [];

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
