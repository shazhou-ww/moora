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
 * 在 Coordinator Agent 中，PerspectiveOfUser 只包含 userMessages
 * 其他信息（assiMessages, toolResults, tasks）需要通过扩展的 Worldscape 获取
 */
export type PerspectiveOfUser = {
  userMessages: UserMessage[];
};

/**
 * 扩展的 Worldscape 类型（用于 WebUI 显示）
 * 
 * 包含了 WebUI 需要展示的所有信息
 * 注意：这不是严格的 MOOREX Worldscape，而是为了 UI 便利的扩展
 */
export type ExtendedWorldscape = {
  userMessages: UserMessage[];
  assiMessages?: AssiMessage[];
  toolResults?: ToolResult[];
  ongoingTopLevelTasks?: TaskInfo[];
  notifiedTaskCompletions?: string[];
};

/**
 * ContextOfUser 类型（保留用于兼容）
 * @deprecated 使用 ExtendedWorldscape 代替
 */
export type ContextOfUser = ExtendedWorldscape;

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
      data: PerspectiveOfUser;
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

