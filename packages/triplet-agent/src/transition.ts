// ============================================================================
// 步骤 4：聚焦通道关注点 - 定义每条 Channel 的 transition 函数
// ============================================================================

import { create } from "mutative";
import type {
  OutputFromUser,
  OutputFromAgent,
  OutputFromToolkit,
} from "./io";
import type {
  StateUserAgent,
  StateAgentToolkit,
  StateToolkitAgent,
  StateAgentUser,
  StateUserUser,
  StateAgentAgent,
  StateToolkitToolkit,
} from "./state";

// ============================================================================
// Channel USER -> AGENT 的 transition 函数
// ============================================================================

/**
 * Channel USER -> AGENT 的 transition 函数
 * 
 * State 随 User 的 Output 变化：
 * - sendMessage: 添加用户消息
 * - cancelStreaming: 添加被取消流式输出的消息 ID
 */
export const transitionUserAgent = (
  output: OutputFromUser,
  state: StateUserAgent
): StateUserAgent => {
  if (output.type === "sendMessage") {
    return create(state, (draft) => {
      draft.userMessages.push({
        id: output.messageId,
        content: output.message,
        timestamp: Date.now(),
      });
    });
  }
  if (output.type === "cancelStreaming") {
    return create(state, (draft) => {
      if (!draft.canceledStreamingMessageIds.includes(output.messageId)) {
        draft.canceledStreamingMessageIds.push(output.messageId);
      }
    });
  }
  return state;
};

// ============================================================================
// Channel AGENT -> TOOLKIT 的 transition 函数
// ============================================================================

/**
 * Channel AGENT -> TOOLKIT 的 transition 函数
 * 
 * State 随 Agent 的 Output 变化：
 * - callTool: 添加待执行的工具调用
 * - sendChunk, completeMessage: 不影响此 Channel 的 State
 */
export const transitionAgentToolkit = (
  output: OutputFromAgent,
  state: StateAgentToolkit
): StateAgentToolkit => {
  if (output.type === "callTool") {
    return create(state, (draft) => {
      draft.pendingToolCalls.push({
        toolCallId: output.toolCallId,
        toolName: output.toolName,
        parameters: output.parameters,
        timestamp: Date.now(),
      });
    });
  }
  return state;
};

// ============================================================================
// Channel TOOLKIT -> AGENT 的 transition 函数
// ============================================================================

/**
 * Channel TOOLKIT -> AGENT 的 transition 函数
 * 
 * State 随 Toolkit 的 Output 变化：
 * - toolResult: 添加工具执行成功结果
 * - toolError: 添加工具执行失败结果
 */
export const transitionToolkitAgent = (
  output: OutputFromToolkit,
  state: StateToolkitAgent
): StateToolkitAgent => {
  if (output.type === "toolResult") {
    return create(state, (draft) => {
      draft.toolResults.push({
        isSuccess: true,
        toolCallId: output.toolCallId,
        toolName: output.toolName,
        result: output.result,
        timestamp: Date.now(),
      });
    });
  }
  if (output.type === "toolError") {
    return create(state, (draft) => {
      draft.toolResults.push({
        isSuccess: false,
        toolCallId: output.toolCallId,
        toolName: output.toolName,
        error: output.error,
        timestamp: Date.now(),
      });
    });
  }
  return state;
};

// ============================================================================
// Channel AGENT -> USER 的 transition 函数
// ============================================================================

/**
 * Channel AGENT -> USER 的 transition 函数
 * 
 * State 随 Agent 的 Output 变化：
 * - sendChunk: 更新或创建消息，追加内容块，记录 chunk 到 streamingChunks
 * - completeMessage: 标记消息流式输出完成，清理 streamingChunks
 * - callTool: 不影响此 Channel 的 State
 * 
 * 注意：streamingChunks 的 keys 就是正在流式输出的消息 ID 列表
 */
export const transitionAgentUser = (
  output: OutputFromAgent,
  state: StateAgentUser
): StateAgentUser => {
  if (output.type === "sendChunk") {
    return create(state, (draft) => {
      // 查找或创建消息
      let message = draft.messages.find((m) => m.id === output.messageId);
      if (!message) {
        // 创建新消息
        message = {
          id: output.messageId,
          role: "assistant" as const,
          content: "",
          timestamp: Date.now(),
        };
        draft.messages.push(message);
        // 初始化 streamingChunks（key 的存在表示正在流式输出）
        draft.streamingChunks[output.messageId] = [];
      }
      // 追加内容块到消息
      message.content += output.chunk;
      message.timestamp = Date.now();
      // 记录 chunk 到 streamingChunks
      draft.streamingChunks[output.messageId].push(output.chunk);
    });
  }
  if (output.type === "completeMessage") {
    return create(state, (draft) => {
      // 清理 streamingChunks（删除 key 表示流式输出完成）
      delete draft.streamingChunks[output.messageId];
    });
  }
  return state;
};

// ============================================================================
// Channel USER -> USER (Loopback) 的 transition 函数
// ============================================================================

/**
 * Channel USER -> USER (Loopback) 的 transition 函数
 * 
 * State 随 User 的 Output 变化：
 * - 记录所有用户操作到历史中
 */
export const transitionUserUser = (
  output: OutputFromUser,
  state: StateUserUser
): StateUserUser => {
  return create(state, (draft) => {
    draft.actionHistory.push({
      type: output.type,
      messageId: output.messageId,
      timestamp: Date.now(),
    });
  });
};

// ============================================================================
// Channel AGENT -> AGENT (Loopback) 的 transition 函数
// ============================================================================

/**
 * Channel AGENT -> AGENT (Loopback) 的 transition 函数
 * 
 * State 随 Agent 的 Output 变化：
 * - 记录所有 Agent 处理操作到历史中
 */
export const transitionAgentAgent = (
  output: OutputFromAgent,
  state: StateAgentAgent
): StateAgentAgent => {
  return create(state, (draft) => {
    draft.processingHistory.push({
      type: output.type,
      toolCallId: output.type === "callTool" ? output.toolCallId : undefined,
      messageId:
        output.type === "sendChunk" || output.type === "completeMessage"
          ? output.messageId
          : undefined,
      timestamp: Date.now(),
    });
  });
};

// ============================================================================
// Channel TOOLKIT -> TOOLKIT (Loopback) 的 transition 函数
// ============================================================================

/**
 * Channel TOOLKIT -> TOOLKIT (Loopback) 的 transition 函数
 * 
 * State 随 Toolkit 的 Output 变化：
 * - 记录所有工具执行结果到历史中
 */
export const transitionToolkitToolkit = (
  output: OutputFromToolkit,
  state: StateToolkitToolkit
): StateToolkitToolkit => {
  return create(state, (draft) => {
    draft.executionHistory.push({
      type: output.type,
      toolCallId: output.toolCallId,
      toolName: output.toolName,
      timestamp: Date.now(),
    });
  });
};

