/**
 * Perspectives 类型定义
 *
 * Perspective = Actor 的视角，即 Actor 能看到的所有数据
 * PerspectiveOfFoo = Foo 对所有其他 Actor 的观察 + Foo 对自己的观察
 */

import type {
  UserObUser,
  UserObLlm,
  UserObToolkit,
  UserObWorkforce,
  LlmObUser,
  LlmObLlm,
  LlmObToolkit,
  LlmObWorkforce,
  ToolkitObLlm,
  ToolkitObToolkit,
  WorkforceObLlm,
  WorkforceObWorkforce,
} from "./observations";

/**
 * User 的 Perspective
 *
 * PerspectiveOfUser = User 能看到的所有数据
 *  = UserObUser & UserObLlm & UserObToolkit & UserObWorkforce
 *
 * 包含：
 * - UserObUser: 自己维护的用户消息
 * - UserObLlm: Llm 的助手消息
 * - UserObToolkit: Toolkit 的工具结果
 * - UserObWorkforce: Workforce 的任务信息
 */
export type PerspectiveOfUser = UserObUser & UserObLlm & UserObToolkit & UserObWorkforce;

/**
 * Llm 的 Perspective
 *
 * PerspectiveOfLlm = Llm 能看到的所有数据
 *  = LlmObUser & LlmObLlm & LlmObToolkit & LlmObWorkforce
 *
 * 包含：
 * - LlmObUser: User 的用户消息
 * - LlmObLlm: 自己维护的状态（assiMessages, llmProceedCutOff, toolCallRequests, validTasks）
 * - LlmObToolkit: Toolkit 的工具结果
 * - LlmObWorkforce: Workforce 的任务状态
 */
export type PerspectiveOfLlm = LlmObUser & LlmObLlm & LlmObToolkit & LlmObWorkforce;

/**
 * Toolkit 的 Perspective
 *
 * PerspectiveOfToolkit = Toolkit 能看到的所有数据
 *  = ToolkitObLlm & ToolkitObToolkit
 *
 * 包含：
 * - ToolkitObLlm: Llm 的工具调用请求
 * - ToolkitObToolkit: 自己维护的工具结果缓存
 */
export type PerspectiveOfToolkit = ToolkitObLlm & ToolkitObToolkit;

/**
 * Workforce 的 Perspective
 *
 * PerspectiveOfWorkforce = Workforce 能看到的所有数据
 *  = WorkforceObLlm & WorkforceObWorkforce
 *
 * 包含：
 * - WorkforceObLlm: Llm 的任务请求
 * - WorkforceObWorkforce: 自己维护的状态
 */
export type PerspectiveOfWorkforce = WorkforceObLlm & WorkforceObWorkforce;
