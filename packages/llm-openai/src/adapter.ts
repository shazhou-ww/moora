/**
 * OpenAI Adapter for CallLlm Interface
 *
 * Converts @moora/agent-common CallLlm interface to OpenAI Streaming API calls
 */

import OpenAI from "openai";

import type { OpenAICallLlmOptions } from "./types.js";
import type {
  CallLlm,
  CallLlmContext,
  CallLlmCallbacks,
  CallLlmMessage,
  CallLlmToolDefinition,
  CallLlmToolCall,
} from "@moora/agent-common";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert CallLlmToolDefinition to OpenAI Tool format
 */
function convertToolDefinition(tool: CallLlmToolDefinition): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: JSON.parse(tool.parameters),
    },
  };
}

/**
 * Convert CallLlmMessage to OpenAI message format
 */
function convertMessage(
  msg: CallLlmMessage
): ChatCompletionMessageParam & { timestamp: number } {
  return {
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  };
}

/**
 * Convert completed tool calls to OpenAI assistant + tool messages
 *
 * Each tool call generates an assistant message with tool_calls and a corresponding tool message
 */
function convertToolCalls(
  toolCalls: CallLlmToolCall[]
): Array<ChatCompletionMessageParam & { timestamp: number }> {
  const messages: Array<ChatCompletionMessageParam & { timestamp: number }> = [];

  for (const tc of toolCalls) {
    // Generate assistant message with tool_call
    messages.push({
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: tc.toolCallId,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: tc.parameter,
          },
        },
      ],
      timestamp: tc.requestedAt,
    });

    // Generate corresponding tool message
    messages.push({
      role: "tool",
      tool_call_id: tc.toolCallId,
      content: tc.result,
      timestamp: tc.respondedAt,
    });
  }

  return messages;
}

/**
 * Build complete OpenAI messages array from context
 */
function buildMessages(
  systemPrompt: string,
  context: CallLlmContext
): ChatCompletionMessageParam[] {
  // Convert regular messages
  const regularMessages = context.messages.map(convertMessage);

  // Convert tool calls to messages
  const toolMessages = convertToolCalls(context.toolCalls);

  // Combine and sort by timestamp
  const allMessages = [...regularMessages, ...toolMessages].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Build final messages array (remove timestamp)
  return [
    { role: "system", content: systemPrompt },
    ...allMessages.map(({ timestamp: _timestamp, ...rest }) => rest),
  ];
}

/**
 * Accumulated tool call from streaming chunks
 */
type AccumulatedToolCall = {
  id: string;
  name: string;
  arguments: string;
};

/**
 * Process OpenAI streaming response and invoke callbacks
 */
async function processStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  callbacks: CallLlmCallbacks,
  debug = false
): Promise<void> {
  let fullContent = "";
  let isFirstChunk = true;

  // Accumulate tool_calls: OpenAI streaming sends tool_calls across multiple chunks
  const toolCallsAccumulator = new Map<number, AccumulatedToolCall>();

  // Process streaming response
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    const toolCalls = chunk.choices[0]?.delta?.tool_calls;

    // Accumulate tool_calls
    if (toolCalls && toolCalls.length > 0) {
      if (debug) {
        console.log('[llm-openai] Received tool_calls chunk:', JSON.stringify(toolCalls));
      }
      for (const tc of toolCalls) {
        const existing = toolCallsAccumulator.get(tc.index);
        if (existing) {
          // Accumulate arguments (streaming sends in multiple chunks)
          if (tc.function?.arguments) {
            existing.arguments += tc.function.arguments;
          }
        } else {
          // New tool call
          toolCallsAccumulator.set(tc.index, {
            id: tc.id || "",
            name: tc.function?.name || "",
            arguments: tc.function?.arguments || "",
          });
        }
      }
    }

    if (content) {
      // Call onStart on first content chunk
      if (isFirstChunk) {
        isFirstChunk = false;
        callbacks.onStart();
      }

      fullContent += content;
      callbacks.onChunk(content);
    }
  }

  if (debug) {
    console.log('[llm-openai] Full content:', fullContent);
  }

  // Emit tool calls from OpenAI format
  const completedToolCalls = Array.from(toolCallsAccumulator.values()).filter(
    (tc) => tc.id && tc.name
  );

  if (debug && completedToolCalls.length > 0) {
    console.log('[llm-openai] OpenAI format tool calls:', completedToolCalls);
  }

  for (const tc of completedToolCalls) {
    callbacks.onToolCall({
      name: tc.name,
      arguments: tc.arguments,
    });
  }

  // Call onComplete if we received any content
  if (!isFirstChunk) {
    callbacks.onComplete(fullContent);
  } else if (toolCallsAccumulator.size > 0) {
    // 只有 tool_call 没有 content 的情况
    // 也需要通知完成，以便清理 llmCalls 状态
    // 但不调用 onStart，因为没有消息需要流式输出
    callbacks.onComplete("");
  }
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Create a CallLlm function that uses OpenAI API
 *
 * @param options - OpenAI adapter configuration
 * @returns A CallLlm function compatible with @moora/agent-worker
 *
 * @example
 * ```typescript
 * import { createCallLlmWithOpenAI } from '@moora/llm-openai';
 *
 * const callLlm = createCallLlmWithOpenAI({
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   model: 'gpt-4o',
 *   systemPrompt: 'You are a helpful assistant.',
 *   temperature: 0.7,
 * });
 *
 * // Use with @moora/agent-worker
 * const reaction = createReaction({
 *   llm: createLlmReaction({ callLlm }),
 *   // ...
 * });
 * ```
 */
export function createCallLlmWithOpenAI(options: OpenAICallLlmOptions): CallLlm {
  const { baseURL, apiKey, model, systemPrompt, temperature, topP } = options;

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey,
    baseURL,
  });

  // Return CallLlm function
  const callLlm: CallLlm = async (
    context: CallLlmContext,
    callbacks: CallLlmCallbacks
  ): Promise<void> => {
    // Build messages
    const messages = buildMessages(systemPrompt, context);

    // Convert tool definitions
    const tools =
      context.tools.length > 0
        ? context.tools.map(convertToolDefinition)
        : undefined;

    // Enable debug mode if LOG_LEVEL is debug or trace
    const debug = process.env.LOG_LEVEL === 'debug' || process.env.LOG_LEVEL === 'trace';

    if (debug) {
      console.log('[llm-openai] Calling LLM with:', {
        model,
        messageCount: messages.length,
        toolCount: tools?.length ?? 0,
        toolNames: tools?.map(t => t.function.name),
      });
    }

    // Call OpenAI Streaming API
    const stream = await openai.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
      stream: true,
      temperature,
      top_p: topP,
    });

    // Process streaming response
    await processStream(stream, callbacks, debug);
  };

  return callLlm;
}
