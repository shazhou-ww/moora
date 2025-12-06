/**
 * 类型定义
 */

/**
 * 消息类型
 */
export type Message = {
  id: string;
  content: string;
  timestamp: number;
  role: "user" | "assistant";
};

/**
 * ContextOfUser 类型
 */
export type ContextOfUser = {
  userMessages: Array<{
    id: string;
    content: string;
    timestamp: number;
    role: "user";
  }>;
  assiMessages: Array<{
    id: string;
    content: string;
    timestamp: number;
    role: "assistant";
  }>;
};

/**
 * RFC6902 Patch 操作类型
 */
export type PatchOperation = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
};

/**
 * SSE 消息类型
 */
export type SSEMessage =
  | {
      type: "full";
      data: ContextOfUser;
    }
  | {
      type: "patch";
      patches: PatchOperation[];
    };

/**
 * POST /agent 响应类型
 */
export type SendMessageResponse = {
  id: string;
  timestamp: number;
};

