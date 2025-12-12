/**
 * Llm Actor 状态转换函数
 */

import type {
  AppearanceOfLlm,
  ActionFromLlm,
  PerspectiveOfLlm,
  StartAssiMessageStream,
  EndAssiMessageStream,
  RequestCreateTask,
  RequestAppendMessage,
  RequestCancelTasks,
  CallTool,
} from "@/decl";

/**
 * Llm 的状态转换函数
 *
 * 处理 Llm 的 Action，更新其 Perspective
 */
export function transitionLlm(
  appearance: AppearanceOfLlm,
  action: ActionFromLlm
): PerspectiveOfLlm {
  switch (action.type) {
    case "start-assi-message-stream":
      return handleStartAssiMessageStream(appearance, action);
    case "end-assi-message-stream":
      return handleEndAssiMessageStream(appearance, action);
    case "call-tool":
      return handleCallTool(appearance, action);
    case "request-create-task":
      return handleRequestCreateTask(appearance, action);
    case "request-append-message":
      return handleRequestAppendMessage(appearance, action);
    case "request-cancel-tasks":
      return handleRequestCancelTasks(appearance, action);
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unknown action type: ${(_exhaustive as unknown as { type: string }).type}`);
    }
  }
}

/**
 * 处理开始流式生成助手消息
 */
function handleStartAssiMessageStream(
  appearance: AppearanceOfLlm,
  action: StartAssiMessageStream
): PerspectiveOfLlm {
  const { assiMessages, cutOff } = appearance;

  return {
    // LlmObUser - 保持不变
    userMessages: appearance.userMessages,

    // LlmObLlm - 添加新的流式消息，更新 cutOff
    assiMessages: [
      ...assiMessages,
      {
        role: "assistant" as const,
        id: action.id,
        streaming: true as const,
        timestamp: action.timestamp,
      },
    ],
    cutOff: Math.max(cutOff, action.cutOff),

    // LlmObToolkit - 保持不变
    toolResults: appearance.toolResults,

    // LlmObWorkforce - 保持不变
    topLevelTasks: appearance.topLevelTasks,

    // 输出到 Toolkit
    toolCallRequests: [],
  };
}

/**
 * 处理结束流式生成助手消息
 */
function handleEndAssiMessageStream(
  appearance: AppearanceOfLlm,
  action: EndAssiMessageStream
): PerspectiveOfLlm {
  const { assiMessages } = appearance;

  // 找到对应的消息并更新
  const updatedMessages = assiMessages.map((msg) =>
    msg.id === action.id
      ? {
          role: "assistant" as const,
          id: msg.id,
          streaming: false as const,
          content: action.content,
          timestamp: msg.timestamp,
        }
      : msg
  );

  return {
    // LlmObUser - 保持不变
    userMessages: appearance.userMessages,

    // LlmObLlm - 更新消息状态
    assiMessages: updatedMessages,
    cutOff: appearance.cutOff,

    // LlmObToolkit - 保持不变
    toolResults: appearance.toolResults,

    // LlmObWorkforce - 保持不变
    topLevelTasks: appearance.topLevelTasks,

    // 输出到 Toolkit
    toolCallRequests: [],
  };
}

/**
 * 处理创建任务请求
 */
function handleRequestCreateTask(
  appearance: AppearanceOfLlm,
  _action: RequestCreateTask
): PerspectiveOfLlm {
  // Llm 的 Perspective 中不需要记录请求，这些请求会被 Workforce 处理
  // 这里只需要保持状态不变
  return {
    userMessages: appearance.userMessages,
    assiMessages: appearance.assiMessages,
    cutOff: appearance.cutOff,
    toolResults: appearance.toolResults,
    topLevelTasks: appearance.topLevelTasks,
    toolCallRequests: [],
  };
}

/**
 * 处理追加消息请求
 */
function handleRequestAppendMessage(
  appearance: AppearanceOfLlm,
  _action: RequestAppendMessage
): PerspectiveOfLlm {
  return {
    userMessages: appearance.userMessages,
    assiMessages: appearance.assiMessages,
    cutOff: appearance.cutOff,
    toolResults: appearance.toolResults,
    topLevelTasks: appearance.topLevelTasks,
    toolCallRequests: [],
  };
}

/**
 * 处理取消任务请求
 */
function handleRequestCancelTasks(
  appearance: AppearanceOfLlm,
  _action: RequestCancelTasks
): PerspectiveOfLlm {
  return {
    userMessages: appearance.userMessages,
    assiMessages: appearance.assiMessages,
    cutOff: appearance.cutOff,
    toolResults: appearance.toolResults,
    topLevelTasks: appearance.topLevelTasks,
    toolCallRequests: [],
  };
}

/**
 * 处理工具调用
 */
function handleCallTool(
  appearance: AppearanceOfLlm,
  action: CallTool
): PerspectiveOfLlm {
  return {
    userMessages: appearance.userMessages,
    assiMessages: appearance.assiMessages,
    cutOff: appearance.cutOff,
    toolResults: appearance.toolResults,
    topLevelTasks: appearance.topLevelTasks,
    // 添加新的工具调用请求
    toolCallRequests: [
      {
        toolCallId: action.toolCallId,
        name: action.name,
        arguments: action.arguments,
        timestamp: action.timestamp,
      },
    ],
  };
}

