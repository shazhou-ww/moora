/**
 * OpenAI Streaming API 调用逻辑
 *
 * 将 Agent 消息转换为 OpenAI 格式，并调用 OpenAI Streaming API
 */

import type { UserMessage, AssiMessage, ToolCallRequest, ToolResult } from "@moora/agent";
import type { Toolkit, ToolInfo } from "@moora/toolkit";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { StreamLlmCallOptions, StreamLlmCallResult, LlmToolCall } from "@/types";
import { getLogger } from "@/logger";

const logger = getLogger().llm;

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 将 Toolkit 的 ToolInfo 转换为 OpenAI Tool 格式
 *
 * @param toolInfo - Toolkit 中的工具信息
 * @returns OpenAI Tool 格式
 */
function convertToolInfoToOpenAITool(toolInfo: ToolInfo): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: toolInfo.name,
      description: toolInfo.description,
      parameters: toolInfo.parameterSchema,
    },
  };
}

/**
 * 将 Toolkit 转换为 OpenAI Tools 参数
 *
 * @param toolkit - Toolkit 实例
 * @returns OpenAI Tools 列表，如果没有工具则返回 undefined
 */
function convertToolkitToOpenAITools(
  toolkit: Toolkit | undefined
): ChatCompletionTool[] | undefined {
  if (!toolkit) {
    return undefined;
  }

  const toolInfos = toolkit.getAllToolInfos();
  if (toolInfos.length === 0) {
    return undefined;
  }

  return toolInfos.map(convertToolInfoToOpenAITool);
}

/**
 * 生成 Markdown 格式化指导
 *
 * @returns 格式化指导文本
 */
function generateFormattingPrompt(): string {
  return `

## Output Formatting Guidelines

When generating responses, please follow these formatting rules carefully:

1. **Proper line breaks**: Always add blank lines before and after:
   - Headings (##, ###, etc.)
   - Code blocks (\`\`\`)
   - Lists (both ordered and unordered)
   - Block quotes (>)
   - Tables

2. **Code blocks**: Use proper fenced code blocks with language identifiers:
   \`\`\`language
   code here
   \`\`\`

3. **Lists**: Ensure each list item is on its own line with proper indentation for nested lists.

4. **Paragraphs**: Separate paragraphs with blank lines. Do not concatenate multiple paragraphs into a single line.

5. **Inline formatting**: Use \`inline code\`, **bold**, and *italic* appropriately, but ensure surrounding text has proper spacing.`;
}

/**
 * 根据 Toolkit 生成工具使用说明
 *
 * @param toolkit - Toolkit 实例
 * @returns 工具使用说明文本，如果没有工具则返回空字符串
 */
function generateToolsPrompt(toolkit: Toolkit | undefined): string {
  // 始终添加格式化指导
  const formattingPrompt = generateFormattingPrompt();

  if (!toolkit) {
    return formattingPrompt;
  }

  const toolInfos = toolkit.getAllToolInfos();
  if (toolInfos.length === 0) {
    return formattingPrompt;
  }

  const toolsList = toolInfos
    .map((tool) => `- **${tool.name}**: ${tool.description}`)
    .join("\n");

  return `${formattingPrompt}

## Available Tools

You have access to the following tools. Use them when appropriate to help answer user questions:

${toolsList}

When you need to search for information on the web or extract content from URLs, use the appropriate tool.`;
}

/**
 * 根据已完成的 tool call（有对应 result 的）生成 assistant message 和 tool message
 *
 * @param toolCallRequests - 工具调用请求列表
 * @param toolResults - 工具执行结果列表
 * @returns 包含 timestamp 的消息列表
 */
function convertToolCallsToMessages(
  toolCallRequests: ToolCallRequest[],
  toolResults: ToolResult[]
): Array<ChatCompletionMessageParam & { timestamp: number }> {
  // 创建 toolCallId -> result 的映射
  const resultMap = new Map<string, ToolResult>();
  for (const result of toolResults) {
    resultMap.set(result.toolCallId, result);
  }

  // 按 timestamp 对 toolCallRequests 分组，相同 timestamp 的是同一批次的 tool calls
  const requestsByTimestamp = new Map<number, ToolCallRequest[]>();
  for (const request of toolCallRequests) {
    // 只处理有对应 result 的 tool call
    if (!resultMap.has(request.toolCallId)) {
      continue;
    }
    const existing = requestsByTimestamp.get(request.timestamp);
    if (existing) {
      existing.push(request);
    } else {
      requestsByTimestamp.set(request.timestamp, [request]);
    }
  }

  const messages: Array<ChatCompletionMessageParam & { timestamp: number }> = [];

  // 按 timestamp 排序处理每批 tool calls
  const sortedTimestamps = Array.from(requestsByTimestamp.keys()).sort((a, b) => a - b);

  for (const timestamp of sortedTimestamps) {
    const requests = requestsByTimestamp.get(timestamp)!;

    // 生成 assistant message with tool_calls
    const toolCalls = requests.map((req) => ({
      id: req.toolCallId,
      type: "function" as const,
      function: {
        name: req.name,
        arguments: req.arguments,
      },
    }));

    messages.push({
      role: "assistant" as const,
      content: null,
      tool_calls: toolCalls,
      timestamp,
    });

    // 生成对应的 tool messages
    for (const req of requests) {
      const result = resultMap.get(req.toolCallId)!;
      messages.push({
        role: "tool" as const,
        tool_call_id: req.toolCallId,
        content: result.result,
        timestamp: result.timestamp,
      });
    }
  }

  return messages;
}

/**
 * 将 Agent 消息转换为 OpenAI 消息格式
 *
 * @param prompt - System prompt
 * @param userMessages - 用户消息列表
 * @param assiMessages - 助手消息列表
 * @param toolCallRequests - 工具调用请求列表
 * @param toolResults - 工具执行结果列表
 * @param toolkit - Toolkit 实例（可选）
 * @returns OpenAI 消息列表
 */
function convertToOpenAIMessages(
  prompt: string,
  userMessages: UserMessage[],
  assiMessages: AssiMessage[],
  toolCallRequests: ToolCallRequest[],
  toolResults: ToolResult[],
  toolkit: Toolkit | undefined
): ChatCompletionMessageParam[] {
  // 生成包含工具说明的完整系统提示词
  const toolsPrompt = generateToolsPrompt(toolkit);
  const fullPrompt = prompt + toolsPrompt;

  // 将用户消息转换为 OpenAI 消息格式
  const userOpenAIMessages = userMessages.map((msg) => ({
    role: "user" as const,
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  // 将已完成的助手消息转换为 OpenAI 消息格式
  const assiOpenAIMessages = assiMessages
    .filter((msg) => msg.streaming === false)
    .map((msg) => ({
      role: "assistant" as const,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

  // 转换已完成的 tool calls
  const toolMessages = convertToolCallsToMessages(toolCallRequests, toolResults);

  // 合并所有消息并按 timestamp 排序
  const allMessages = [
    ...userOpenAIMessages,
    ...assiOpenAIMessages,
    ...toolMessages,
  ].sort((a, b) => a.timestamp - b.timestamp);

  // 构建最终消息列表（移除 timestamp）
  return [
    { role: "system" as const, content: fullPrompt },
    ...allMessages.map(({ timestamp: _timestamp, ...rest }) => rest),
  ];
}

// ============================================================================
// 主要函数
// ============================================================================

/**
 * 执行 Streaming LLM Call
 *
 * 将 Agent 消息转换为 OpenAI 格式，调用 OpenAI Streaming API 并处理流式响应
 *
 * @param options - Streaming LLM Call 选项
 * @returns 包含内容和工具调用的结果
 *
 * @example
 * ```typescript
 * const result = await streamLlmCall({
 *   openai: new OpenAI({ apiKey: "..." }),
 *   model: "gpt-4",
 *   prompt: "You are a helpful assistant.",
 *   userMessages: [{ id: "1", role: "user", content: "Hello", timestamp: 1000 }],
 *   assiMessages: [],
 *   toolkit: myToolkit,
 *   toolCallRequests: [],
 *   toolResults: [],
 *   streamManager,
 *   messageId: "msg-123",
 * });
 * // result.content: 文本内容
 * // result.toolCalls: 工具调用列表
 * ```
 */
export async function streamLlmCall(
  options: StreamLlmCallOptions
): Promise<StreamLlmCallResult> {
  const {
    openai,
    model,
    prompt,
    userMessages,
    assiMessages,
    toolkit,
    toolCallRequests,
    toolResults,
    streamManager,
    messageId,
    onFirstChunk,
  } = options;

  // 记录 toolkit 信息
  if (toolkit) {
    const toolNames = toolkit.getToolNames();
    logger.debug("Toolkit available", {
      messageId,
      toolCount: toolNames.length,
      toolNames: toolNames,
    });
  } else {
    logger.debug("No toolkit provided", { messageId });
  }

  // 将 Agent 消息转换为 OpenAI 消息格式
  const messages = convertToOpenAIMessages(
    prompt,
    userMessages,
    assiMessages,
    toolCallRequests,
    toolResults,
    toolkit
  );

  // 将 Toolkit 转换为 OpenAI Tools 格式
  const tools = convertToolkitToOpenAITools(toolkit);

  // 记录 tools 参数
  logger.debug("OpenAI API call parameters", {
    messageId,
    model,
    messagesCount: messages.length,
    toolsCount: tools?.length ?? 0,
    tools: tools?.map(t => t.type === "function" ? t.function.name : t.type) ?? [],
    toolCallRequestsCount: toolCallRequests.length,
    toolResultsCount: toolResults.length,
  });

  // 调用 OpenAI Streaming API
  const stream = await openai.chat.completions.create({
    model,
    messages,
    tools,
    stream: true,
  });

  let fullContent = "";
  let isFirstChunk = true;

  // 累积 tool_calls：OpenAI streaming 会分多个 chunk 发送 tool_calls
  // 使用 index 作为 key，累积每个 tool call 的信息
  const toolCallsAccumulator: Map<
    number,
    { id: string; name: string; arguments: string }
  > = new Map();

  // 处理流式响应
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    const toolCalls = chunk.choices[0]?.delta?.tool_calls;

    // 处理 tool_calls（累积）
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        const existing = toolCallsAccumulator.get(tc.index);
        if (existing) {
          // 累积 arguments（streaming 会分多次发送）
          if (tc.function?.arguments) {
            existing.arguments += tc.function.arguments;
          }
        } else {
          // 新的 tool call
          toolCallsAccumulator.set(tc.index, {
            id: tc.id || "",
            name: tc.function?.name || "",
            arguments: tc.function?.arguments || "",
          });
        }
      }

      logger.debug("Accumulating tool_calls", {
        messageId,
        currentToolCalls: Array.from(toolCallsAccumulator.values()).map((tc) => ({
          id: tc.id,
          name: tc.name,
          argsLength: tc.arguments.length,
        })),
      });
    }

    if (content) {
      // 如果是第一个 chunk，调用回调
      if (isFirstChunk && onFirstChunk) {
        isFirstChunk = false;
        onFirstChunk();
      }

      fullContent += content;
      // 通过 StreamManager 分发 chunk
      streamManager.appendChunk(messageId, content);
    }
  }

  // 将累积的 tool_calls 转换为结果数组
  const toolCallResults: LlmToolCall[] = Array.from(
    toolCallsAccumulator.values()
  ).filter((tc) => tc.id && tc.name); // 过滤掉不完整的 tool call

  logger.debug("Stream completed", {
    messageId,
    contentLength: fullContent.length,
    toolCallsCount: toolCallResults.length,
    toolCalls: toolCallResults.map((tc) => ({
      id: tc.id,
      name: tc.name,
      argsLength: tc.arguments.length,
    })),
  });

  return {
    content: fullContent,
    toolCalls: toolCallResults,
  };
}
