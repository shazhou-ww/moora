/**
 * API 调用工具
 */

import type { SendMessageResponse } from "@/types";

const API_BASE_URL = "/api";

/**
 * 发送用户消息
 *
 * @param content - 消息内容
 * @returns 消息 ID 和 timestamp
 */
export async function sendMessage(
  content: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to send message",
    }));
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}

