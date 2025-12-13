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
 * 工具调用请求类型
 */
export type ToolCallRequest = {
  toolCallId: string;
  name: string;
  arguments: string;
  timestamp: number;
};

/**
 * 工具执行结果类型
 */
export type ToolResult = {
  toolCallId: string;
  result: string;
  timestamp: number;
};

/**
 * 任务状态类型
 */
export type TaskStatus = "ready" | "pending" | "processing" | "succeeded" | "failed";

/**
 * 任务结果类型
 */
export type TaskResult =
  | {
      success: true;
      conclusion: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * 任务信息类型
 */
export type TaskInfo = {
  id: string;
  title: string;
  status: TaskStatus;
  parentId: string;
  result?: TaskResult;
};

/**
 * 消息类型（Union）
 */
export type Message = UserMessage | AssiMessage;

/**
 * PerspectiveOfUser 类型 (Coordinator Agent)
 *
 * 按照 MOOREX 规范，PerspectiveOfUser 包含 User 能看到的所有数据：
 * - userMessages: 用户消息（来自 UserObUser）
 * - assiMessages: 助手消息（来自 UserObLlm）
 * - toolResults: 工具执行结果（来自 UserObToolkit）
 * - ongoingTopLevelTasks: 进行中的顶层任务（来自 UserObWorkforce）
 * - notifiedTaskCompletions: 已通知的任务完成事件（来自 UserObWorkforce）
 */
export type PerspectiveOfUser = {
  userMessages: UserMessage[];
  assiMessages: AssiMessage[];
  toolResults: ToolResult[];
  ongoingTopLevelTasks: TaskInfo[];
  notifiedTaskCompletions: string[];
};

/**
 * ContextOfUser 类型（与 PerspectiveOfUser 完全一致，用于兼容）
 */
export type ContextOfUser = PerspectiveOfUser;

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
    }
  | {
      type: "heartbeat";
    };

/**
 * POST /send 响应类型
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

