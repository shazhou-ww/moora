/**
 * 类型定义
 */

/**
 * 流式进行中的助手消息
 */
export type StreamingAssiMessage = {
  id: string;
  timestamp: number;
  role: "assistant";
  streaming: true;
};

/**
 * 流式完成的助手消息
 */
export type CompletedAssiMessage = {
  id: string;
  content: string;
  timestamp: number;
  role: "assistant";
  streaming: false;
};

/**
 * 助手消息类型（Discriminated Union）
 */
export type AssiMessage = StreamingAssiMessage | CompletedAssiMessage;

/**
 * 用户消息类型
 */
export type UserMessage = {
  id: string;
  content: string;
  timestamp: number;
  role: "user";
};

/**
 * 消息类型（Union）
 */
export type Message = UserMessage | AssiMessage;

/**
 * ContextOfUser 类型
 */
export type ContextOfUser = {
  userMessages: UserMessage[];
  assiMessages: AssiMessage[];
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

/**
 * 流式消息事件类型
 */
export type StreamMessageEvent =
  | {
      type: "initial";
      content: string;
      isActive: boolean;
    }
  | {
      type: "chunk";
      chunk: string;
    }
  | {
      type: "end";
      content: string;
    };

