/**
 * SSE 连接工具
 */

import { applyPatch, type Operation } from "rfc6902";
import type { ContextOfUser, SSEMessage, PatchOperation } from "@/types";

/**
 * SSE 重连配置
 */
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;
const HEALTH_CHECK_INTERVAL_MS = 5000; // 每 5 秒检查连接状态

/**
 * 创建 SSE 连接（带自动重连）
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
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  let isClosed = false;
  let lastMessageTime = Date.now();

  const connect = () => {
    if (isClosed) return;

    console.log("[SSE] Connecting to", url);
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened");
      reconnectAttempts = 0; // 重置重连计数
      lastMessageTime = Date.now();
    };

    eventSource.onmessage = (event) => {
      lastMessageTime = Date.now();
      try {
        console.log("[SSE] Received message:", event.data.substring(0, 100));
        const message: SSEMessage = JSON.parse(event.data);

        if (message.type === "full") {
          console.log("[SSE] Full data received");
          onFull(message.data);
        } else if (message.type === "patch") {
          console.log("[SSE] Patch received, count:", (message.patches as PatchOperation[]).length);
          onPatch(message.patches as PatchOperation[]);
        } else if (message.type === "heartbeat") {
          // 心跳消息，仅用于保持连接
          console.log("[SSE] Heartbeat received");
        }
      } catch (error) {
        console.error("[SSE] Failed to parse message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error:", error);
      handleDisconnect();
    };
  };

  const handleDisconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    // 尝试重连
    if (!isClosed && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttempts, 5);
      console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      reconnectTimeout = setTimeout(connect, delay);
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("[SSE] Max reconnect attempts reached");
    }
  };

  // 健康检查：如果长时间没有收到消息（包括心跳），则重连
  // 后端每 30 秒发送心跳，所以 45 秒没消息就认为断开了
  const startHealthCheck = () => {
    healthCheckInterval = setInterval(() => {
      if (isClosed) return;

      const now = Date.now();
      const timeSinceLastMessage = now - lastMessageTime;

      // 检查 EventSource 状态
      if (eventSource) {
        // readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log("[SSE] Health check: Connection closed, reconnecting...");
          handleDisconnect();
        } else if (eventSource.readyState === EventSource.CONNECTING && timeSinceLastMessage > 10000) {
          // 如果长时间处于 CONNECTING 状态，强制重连
          console.log("[SSE] Health check: Stuck in CONNECTING state, reconnecting...");
          handleDisconnect();
        } else if (timeSinceLastMessage > 45000) {
          // 45 秒没收到任何消息（心跳是 30 秒），认为连接断开
          console.log("[SSE] Health check: No message for 45s, reconnecting...");
          handleDisconnect();
        }
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  };

  connect();
  startHealthCheck();

  return () => {
    console.log("[SSE] Closing connection");
    isClosed = true;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
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
    
    // 检查是否有错误（result 中非 null 的元素表示错误）
    const errors = result.filter((r) => r !== null);
    if (errors.length > 0) {
      console.error("Patch application errors:", errors);
      // 如果有错误，返回原始上下文
      return context;
    }
    
    return newContext;
  } catch (error) {
    console.error("Failed to apply patches:", error);
    return context;
  }
}

