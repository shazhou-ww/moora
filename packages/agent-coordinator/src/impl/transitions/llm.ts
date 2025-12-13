/**
 * Llm Actor 状态转换函数
 *
 * 处理 Llm 发起的 Action，更新 AppearanceOfLlm
 */

import type {
  AppearanceOfLlm,
  ActionFromLlm,
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
 * 处理 Llm 的 Action，更新其 Appearance 中的字段
 */
export function transitionLlm(
  appearance: AppearanceOfLlm,
  action: ActionFromLlm
): Partial<AppearanceOfLlm> {
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
): Partial<AppearanceOfLlm> {
  const { assiMessages, llmProceedCutOff } = appearance;

  return {
    // 添加新的流式消息
    assiMessages: [
      ...assiMessages,
      {
        role: "assistant" as const,
        id: action.id,
        streaming: true as const,
        timestamp: action.timestamp,
      },
    ],
    // 更新 LLM 处理截止时间戳（包括用户消息和任务完成）
    llmProceedCutOff: Math.max(llmProceedCutOff, action.llmProceedCutOff),
  };
}

/**
 * 处理结束流式生成助手消息
 */
function handleEndAssiMessageStream(
  appearance: AppearanceOfLlm,
  action: EndAssiMessageStream
): Partial<AppearanceOfLlm> {
  const { assiMessages } = appearance;

  // 找到对应的消息并更新为完成状态
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
    assiMessages: updatedMessages,
  };
}

/**
 * 处理工具调用
 *
 * 添加工具调用请求到 toolCallRequests 列表
 */
function handleCallTool(
  appearance: AppearanceOfLlm,
  action: CallTool
): Partial<AppearanceOfLlm> {
  const { toolCallRequests } = appearance;

  return {
    toolCallRequests: [
      ...toolCallRequests,
      {
        toolCallId: action.toolCallId,
        name: action.name,
        arguments: action.arguments,
        timestamp: action.timestamp,
      },
    ],
  };
}

/**
 * 处理创建任务请求
 *
 * 添加新任务到 validTasks 列表
 */
function handleRequestCreateTask(
  appearance: AppearanceOfLlm,
  action: RequestCreateTask
): Partial<AppearanceOfLlm> {
  const { validTasks } = appearance;

  return {
    validTasks: [
      ...validTasks,
      {
        id: action.taskId,
        title: action.title,
        goal: action.goal,
        timestamp: action.timestamp,
      },
    ],
  };
}

/**
 * 处理追加消息请求
 *
 * 添加消息追加请求到 messageAppendRequests 列表
 */
function handleRequestAppendMessage(
  appearance: AppearanceOfLlm,
  action: RequestAppendMessage
): Partial<AppearanceOfLlm> {
  const { messageAppendRequests } = appearance;

  return {
    messageAppendRequests: [
      ...messageAppendRequests,
      {
        messageId: action.messageId,
        content: action.content,
        taskIds: action.taskIds,
        timestamp: action.timestamp,
      },
    ],
  };
}

/**
 * 处理取消任务请求
 *
 * 从 validTasks 列表中移除被取消的任务
 */
function handleRequestCancelTasks(
  appearance: AppearanceOfLlm,
  action: RequestCancelTasks
): Partial<AppearanceOfLlm> {
  const { validTasks } = appearance;
  const cancelledIds = new Set(action.taskIds);

  return {
    validTasks: validTasks.filter((task) => !cancelledIds.has(task.id)),
  };
}
