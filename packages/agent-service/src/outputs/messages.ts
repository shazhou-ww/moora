/**
 * 消息合并逻辑（OpenAI 无关）
 *
 * 将用户消息和助手消息合并，按 timestamp 排序
 */

import type { UserMessage, AssiMessage } from "@moora/agent";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 合并后的消息类型（包含 timestamp 用于排序）
 */
type AgentMessage = (UserMessage | AssiMessage);

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 合并消息列表
 *
 * 将用户消息和已完成的助手消息合并，按 timestamp 排序
 *
 * @param userMessages - 用户消息列表
 * @param assiMessages - 助手消息列表
 * @returns 合并并排序后的消息列表
 *
 * @example
 * ```typescript
 * const messages = mergeMessages(
 *   [{ id: "1", role: "user", content: "Hello", timestamp: 1000 }],
 *   [{ id: "2", role: "assistant", content: "Hi", timestamp: 2000, streaming: false }]
 * );
 * ```
 */
export function mergeMessages(
  userMessages: UserMessage[],
  assiMessages: AssiMessage[]
): AgentMessage[] {
  // 过滤出已完成的助手消息
  const completedAssiMessages = assiMessages.filter(
    (msg) => msg.streaming === false
  ) as Array<AssiMessage & { streaming: false }>;

  // 合并所有消息并按 timestamp 排序
  return [...userMessages, ...completedAssiMessages].sort(
    (a, b) => a.timestamp - b.timestamp
  );
}

