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
  console.log("[sendMessage] Sending message:", content);
  const response = await fetch(`${API_BASE_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  console.log("[sendMessage] Response status:", response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to send message",
    }));
    console.error("[sendMessage] Error:", error);
    throw new Error(error.error || "Failed to send message");
  }

  const result = await response.json();
  console.log("[sendMessage] Response:", result);
  return result;
}

