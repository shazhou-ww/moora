/**
 * Coordinator 伪工具定义
 *
 * 这些工具用于 Coordinator Agent 管理 Workforce 任务：
 * - wf-create-tasks: 创建新任务
 * - wf-append-message: 向任务追加消息
 * - wf-cancel-tasks: 取消任务
 * - wf-query-tasks: 查询任务状态（自动插入，不由 LLM 主动调用）
 *
 * 这些伪工具的特点：
 * - 不会以自身的 assistant/tool message 对的形式加入 context
 * - create/append/cancel 会产生副作用，发起对应的 action
 * - query-tasks 的结果会在消息列表末尾自动追加
 */

import { z } from "zod";

import type { ToolInfo } from "@moora/toolkit";

// ============================================================================
// 伪工具名称常量
// ============================================================================

export const WF_CREATE_TASKS = "wf-create-tasks";
export const WF_APPEND_MESSAGE = "wf-append-message";
export const WF_CANCEL_TASKS = "wf-cancel-tasks";
export const WF_QUERY_TASKS = "wf-query-tasks";

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * 任务创建定义 Schema
 */
export const taskDefinitionSchema = z.object({
  title: z.string().describe("A short title for the task"),
  goal: z.string().describe("A detailed description of the task goal"),
});

/**
 * wf-create-tasks 工具参数 Schema
 */
export const createTasksParamsSchema = z.object({
  tasks: z
    .array(taskDefinitionSchema)
    .min(1)
    .describe("The list of tasks to create"),
});

/**
 * wf-append-message 工具参数 Schema
 */
export const appendMessageParamsSchema = z.object({
  content: z.string().describe("The message content to append"),
  taskIds: z
    .array(z.string())
    .min(1)
    .describe("The IDs of tasks to append the message to"),
});

/**
 * wf-cancel-tasks 工具参数 Schema
 */
export const cancelTasksParamsSchema = z.object({
  taskIds: z
    .array(z.string())
    .min(1)
    .describe("The IDs of tasks to cancel"),
});

// ============================================================================
// 类型导出（从 Schema 推导）
// ============================================================================

/**
 * 任务创建定义类型
 */
export type TaskDefinition = z.infer<typeof taskDefinitionSchema>;

/**
 * wf-create-tasks 工具参数类型
 */
export type CreateTasksParams = z.infer<typeof createTasksParamsSchema>;

/**
 * wf-append-message 工具参数类型
 */
export type AppendMessageParams = z.infer<typeof appendMessageParamsSchema>;

/**
 * wf-cancel-tasks 工具参数类型
 */
export type CancelTasksParams = z.infer<typeof cancelTasksParamsSchema>;

/**
 * Coordinator 伪工具调用联合类型
 */
export type CoordinatorPseudoToolCall =
  | { type: "create-tasks"; params: CreateTasksParams }
  | { type: "append-message"; params: AppendMessageParams }
  | { type: "cancel-tasks"; params: CancelTasksParams };

// ============================================================================
// JSON Schema 导出
// ============================================================================

/**
 * wf-create-tasks 工具的 JSON Schema
 */
export const createTasksJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      description: "The list of tasks to create",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A short title for the task",
          },
          goal: {
            type: "string",
            description: "A detailed description of the task goal",
          },
        },
        required: ["title", "goal"],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ["tasks"],
  additionalProperties: false,
};

/**
 * wf-append-message 工具的 JSON Schema
 */
export const appendMessageJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "The message content to append",
    },
    taskIds: {
      type: "array",
      description: "The IDs of tasks to append the message to",
      items: { type: "string" },
      minItems: 1,
    },
  },
  required: ["content", "taskIds"],
  additionalProperties: false,
};

/**
 * wf-cancel-tasks 工具的 JSON Schema
 */
export const cancelTasksJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    taskIds: {
      type: "array",
      description: "The IDs of tasks to cancel",
      items: { type: "string" },
      minItems: 1,
    },
  },
  required: ["taskIds"],
  additionalProperties: false,
};

// ============================================================================
// 伪工具 Info
// ============================================================================

/**
 * wf-create-tasks 工具信息
 */
export const createTasksInfo: ToolInfo = {
  name: WF_CREATE_TASKS,
  description:
    "Create new tasks in the workforce system. Each task will be assigned to a worker agent for execution.",
  parameterSchema: createTasksJsonSchema,
};

/**
 * wf-append-message 工具信息
 */
export const appendMessageInfo: ToolInfo = {
  name: WF_APPEND_MESSAGE,
  description:
    "Append a message to one or more existing tasks. Use this to provide additional information or instructions to running tasks.",
  parameterSchema: appendMessageJsonSchema,
};

/**
 * wf-cancel-tasks 工具信息
 */
export const cancelTasksInfo: ToolInfo = {
  name: WF_CANCEL_TASKS,
  description:
    "Cancel one or more running tasks. Use this when tasks are no longer needed or should be stopped.",
  parameterSchema: cancelTasksJsonSchema,
};

/**
 * wf-query-tasks 工具信息
 *
 * 注意：这个工具不需要参数，且不由 LLM 主动调用，而是自动插入到消息列表末尾
 */
export const queryTasksInfo: ToolInfo = {
  name: WF_QUERY_TASKS,
  description: "Query the current status of all tasks in the workforce system.",
  parameterSchema: { type: "object", properties: {}, additionalProperties: false },
};

/**
 * 所有 Coordinator 伪工具信息列表（供 LLM 调用的工具）
 */
export const coordinatorPseudoToolInfos: readonly ToolInfo[] = [
  createTasksInfo,
  appendMessageInfo,
  cancelTasksInfo,
];

// ============================================================================
// 伪工具辅助函数
// ============================================================================

/**
 * 检查是否为 Coordinator 伪工具名称
 */
export function isCoordinatorPseudoTool(name: string): boolean {
  return (
    name === WF_CREATE_TASKS ||
    name === WF_APPEND_MESSAGE ||
    name === WF_CANCEL_TASKS
  );
}

/**
 * 解析并验证 Coordinator 伪工具调用
 *
 * @param name - 工具名称
 * @param argsJson - 参数 JSON 字符串
 * @returns 解析后的伪工具调用，如果不是伪工具或验证失败则返回 null
 */
export function parseCoordinatorPseudoToolCall(
  name: string,
  argsJson: string
): CoordinatorPseudoToolCall | null {
  if (!isCoordinatorPseudoTool(name)) return null;

  try {
    const parsed = JSON.parse(argsJson) as unknown;

    switch (name) {
      case WF_CREATE_TASKS: {
        const result = createTasksParamsSchema.safeParse(parsed);
        if (result.success) {
          return { type: "create-tasks", params: result.data };
        }
        return null;
      }
      case WF_APPEND_MESSAGE: {
        const result = appendMessageParamsSchema.safeParse(parsed);
        if (result.success) {
          return { type: "append-message", params: result.data };
        }
        return null;
      }
      case WF_CANCEL_TASKS: {
        const result = cancelTasksParamsSchema.safeParse(parsed);
        if (result.success) {
          return { type: "cancel-tasks", params: result.data };
        }
        return null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
