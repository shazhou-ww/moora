/**
 * SSE 连接工具
 */

import { applyPatch, type Operation } from "rfc6902";
import type { ContextOfUser, SSEMessage, PatchOperation } from "@/types";

/**
 * 创建 SSE 连接
 *
 * @param url - SSE URL
 * @param onFull - 全量数据回调
 * @param onPatch - Patch 数据回调
 * @returns 关闭连接的函数
 */
export function createSSEConnection(
  url: string,
  onFull: (data: ContextOfUser) => void,
  onPatch: (patches: PatchOperation[]) => void
): () => void {
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const message: SSEMessage = JSON.parse(event.data);

      if (message.type === "full") {
        onFull(message.data);
      } else if (message.type === "patch") {
        onPatch(message.patches as PatchOperation[]);
      }
    } catch (error) {
      console.error("Failed to parse SSE message:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE connection error:", error);
  };

  return () => {
    eventSource.close();
  };
}

/**
 * 应用 RFC6902 patch 到 ContextOfUser
 *
 * @param context - 当前上下文
 * @param patches - Patch 数组
 * @returns 更新后的上下文（深拷贝）
 */
export function applyPatchesToContext(
  context: ContextOfUser,
  patches: PatchOperation[]
): ContextOfUser {
  try {
    // 深拷贝以避免直接修改原对象
    const newContext = JSON.parse(JSON.stringify(context)) as ContextOfUser;
    const result = applyPatch(newContext, patches as Operation[]);
    if (result.length > 0) {
      console.error("Patch application errors:", result);
    }
    return newContext;
  } catch (error) {
    console.error("Failed to apply patches:", error);
    return context;
  }
}

