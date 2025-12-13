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
 * 有效任务类型（LLM 发起的任务，包含 title 和 goal）
 */
export type ValidTask = {
  id: string;
  title: string;
  goal: string;
  timestamp: number;
};

/**
 * 任务监控信息类型（运行时状态）
 */
export type TaskMonitorInfo = {
  id: string;
  status: TaskStatus;
  result?: TaskResult;
};

/**
 * 任务信息类型（合并后的完整信息，用于 UI 展示）
 */
export type TaskInfo = {
  id: string;
  title: string;
  goal: string;
  status: TaskStatus;
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
 * - toolCallRequests: 工具调用请求（来自 UserObLlm）
 * - validTasks: 有效任务列表（来自 UserObLlm）
 * - toolResults: 工具执行结果（来自 UserObToolkit）
 * - topLevelTasks: 顶层任务运行时状态（来自 UserObWorkforce）
 */
export type PerspectiveOfUser = {
  userMessages: UserMessage[];
  assiMessages: AssiMessage[];
  toolCallRequests: ToolCallRequest[];
  validTasks: ValidTask[];
  toolResults: ToolResult[];
  topLevelTasks: TaskMonitorInfo[];
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

