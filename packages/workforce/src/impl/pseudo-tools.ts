/**
 * Workforce 伪工具定义
 *
 * 这些工具用于 Worker Agent 完成任务时的控制流
 * 使用 zod@4 定义 schema，导出类型和 JSON Schema
 */

import { z } from "zod";
import type { ToolDefinition, ToolInfo } from "@moora/toolkit";

// ============================================================================
// 伪工具名称常量
// ============================================================================

export const WF_TASK_SUCCEED = "wf-task-succeed";
export const WF_TASK_FAIL = "wf-task-fail";
export const WF_TASK_BREAKDOWN = "wf-task-breakdown";

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * wf-task-succeed 工具参数 Schema
 */
export const taskSucceedParamsSchema = z.object({
  conclusion: z.string().describe("The conclusion or result of the successfully completed task"),
});

/**
 * wf-task-fail 工具参数 Schema
 */
export const taskFailParamsSchema = z.object({
  error: z.string().describe("The error message explaining why the task failed"),
});

/**
 * 子任务定义 Schema
 */
export const subtaskDefinitionSchema = z.object({
  title: z.string().describe("A short title for the subtask"),
  description: z.string().describe("A detailed description of the subtask goal"),
});

/**
 * wf-task-breakdown 工具参数 Schema
 */
export const taskBreakdownParamsSchema = z.object({
  subtasks: z
    .array(subtaskDefinitionSchema)
    .min(1)
    .describe("The list of subtasks to break down the current task into"),
});

// ============================================================================
// 类型导出（从 Schema 推导）
// ============================================================================

/**
 * wf-task-succeed 工具参数类型
 */
export type TaskSucceedParams = z.infer<typeof taskSucceedParamsSchema>;

/**
 * wf-task-fail 工具参数类型
 */
export type TaskFailParams = z.infer<typeof taskFailParamsSchema>;

/**
 * 子任务定义类型
 */
export type SubtaskDefinition = z.infer<typeof subtaskDefinitionSchema>;

/**
 * wf-task-breakdown 工具参数类型
 */
export type TaskBreakdownParams = z.infer<typeof taskBreakdownParamsSchema>;

/**
 * 伪工具调用联合类型
 */
export type PseudoToolCall =
  | { type: "succeed"; params: TaskSucceedParams }
  | { type: "fail"; params: TaskFailParams }
  | { type: "breakdown"; params: TaskBreakdownParams };

// ============================================================================
// JSON Schema 导出
// ============================================================================

/**
 * wf-task-succeed 工具的 JSON Schema
 */
export const taskSucceedJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    conclusion: {
      type: "string",
      description: "The conclusion or result of the successfully completed task",
    },
  },
  required: ["conclusion"],
  additionalProperties: false,
};

/**
 * wf-task-fail 工具的 JSON Schema
 */
export const taskFailJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "The error message explaining why the task failed",
    },
  },
  required: ["error"],
  additionalProperties: false,
};

/**
 * wf-task-breakdown 工具的 JSON Schema
 */
export const taskBreakdownJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    subtasks: {
      type: "array",
      description: "The list of subtasks to break down the current task into",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A short title for the subtask",
          },
          description: {
            type: "string",
            description: "A detailed description of the subtask goal",
          },
        },
        required: ["title", "description"],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ["subtasks"],
  additionalProperties: false,
};

// ============================================================================
// 伪工具 Info
// ============================================================================

/**
 * wf-task-succeed 工具信息
 */
export const taskSucceedInfo: ToolInfo = {
  name: WF_TASK_SUCCEED,
  description:
    "Mark the current task as successfully completed. Use this when you have fully accomplished the task goal.",
  parameterSchema: taskSucceedJsonSchema,
};

/**
 * wf-task-fail 工具信息
 */
export const taskFailInfo: ToolInfo = {
  name: WF_TASK_FAIL,
  description:
    "Mark the current task as failed. Use this when you cannot complete the task and want to report an error.",
  parameterSchema: taskFailJsonSchema,
};

/**
 * wf-task-breakdown 工具信息
 */
export const taskBreakdownInfo: ToolInfo = {
  name: WF_TASK_BREAKDOWN,
  description:
    "Break down the current task into smaller subtasks. Use this when the task is too complex to complete in one step.",
  parameterSchema: taskBreakdownJsonSchema,
};

/**
 * 所有伪工具信息列表
 */
export const pseudoToolInfos: readonly ToolInfo[] = [
  taskSucceedInfo,
  taskFailInfo,
  taskBreakdownInfo,
];

// ============================================================================
// 伪工具辅助函数
// ============================================================================

/**
 * 检查是否为伪工具名称
 */
export function isPseudoTool(name: string): boolean {
  return name === WF_TASK_SUCCEED || name === WF_TASK_FAIL || name === WF_TASK_BREAKDOWN;
}

/**
 * 解析并验证伪工具调用
 *
 * 使用 zod schema 进行类型检查和验证
 *
 * @param name - 工具名称
 * @param argsJson - 参数 JSON 字符串
 * @returns 解析后的伪工具调用，如果不是伪工具或验证失败则返回 undefined
 */
export function parsePseudoToolCall(name: string, argsJson: string): PseudoToolCall | undefined {
  if (!isPseudoTool(name)) return undefined;

  try {
    const parsed = JSON.parse(argsJson) as unknown;

    switch (name) {
      case WF_TASK_SUCCEED: {
        const result = taskSucceedParamsSchema.safeParse(parsed);
        if (result.success) {
          return { type: "succeed", params: result.data };
        }
        return undefined;
      }
      case WF_TASK_FAIL: {
        const result = taskFailParamsSchema.safeParse(parsed);
        if (result.success) {
          return { type: "fail", params: result.data };
        }
        return undefined;
      }
      case WF_TASK_BREAKDOWN: {
        const result = taskBreakdownParamsSchema.safeParse(parsed);
        if (result.success) {
          return { type: "breakdown", params: result.data };
        }
        return undefined;
      }
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/**
 * 创建伪工具的 ToolDefinition 列表
 *
 * 注意：execute 函数不会被实际调用，因为伪工具会被 Workforce 拦截
 */
export function createPseudoToolDefinitions(): ToolDefinition[] {
  const noopExecute = async (): Promise<string> => {
    return JSON.stringify({ error: "Pseudo tool should not be executed directly" });
  };

  return [
    { ...taskSucceedInfo, execute: noopExecute },
    { ...taskFailInfo, execute: noopExecute },
    { ...taskBreakdownInfo, execute: noopExecute },
  ];
}
