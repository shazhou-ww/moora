/**
 * Perspectives 类型定义
 *
 * PerspectiveOfFoo = FooObUser & FooObLlm & FooObToolkit & FooObWorkforce & FooObFoo
 */

import type {
  UserObUser,
  UserObLlm,
  LlmObUser,
  LlmObLlm,
  LlmObToolkit,
  LlmObWorkforce,
  ToolkitObUser,
  ToolkitObLlm,
  ToolkitObToolkit,
  WorkforceObUser,
  WorkforceObLlm,
  WorkforceObToolkit,
  WorkforceObWorkforce,
} from "./observations";

/**
 * User 的 Perspective
 *
 * PerspectiveOfUser = User 的输出（User 发送给其他 Actor 的数据）
 *  = UserObUser & UserObLlm
 *
 * 包含：
 * - UserObUser: userMessages (User 自己维护的状态)
 * - UserObLlm: userMessages (User 发给 Llm 的消息，与 UserObUser 字段相同)
 *
 * 注意：UserObUser 和 UserObLlm 的字段完全相同（都是 userMessages），
 * 因为 User 维护的状态就是它发给 Llm 的消息列表。
 */
export type PerspectiveOfUser = UserObUser & UserObLlm;

/**
 * Llm 的 Perspective
 *
 * PerspectiveOfLlm = AppearanceOfLlm
 *  = LlmObUser & LlmObToolkit & LlmObWorkforce & UserObLlm & LlmObLlm & ToolkitObLlm & WorkforceObLlm
 *
 * 包含：
 * - LlmObUser: 发给 User 的助手消息
 * - LlmObToolkit: 发给 Toolkit 的工具调用请求
 * - LlmObWorkforce: 发给 Workforce 的任务请求
 * - UserObLlm: 从 User 接收的用户消息
 * - LlmObLlm: 自己维护的状态（assiMessages, cutOff）
 * - ToolkitObLlm: 从 Toolkit 接收的工具结果
 * - WorkforceObLlm: 从 Workforce 接收的任务详情
 */
export type PerspectiveOfLlm = LlmObUser & LlmObToolkit & LlmObWorkforce & UserObLlm & LlmObLlm & ToolkitObLlm & WorkforceObLlm;

/**
 * Toolkit 的 Perspective
 *
 * PerspectiveOfToolkit = AppearanceOfToolkit
 *  = ToolkitObUser & ToolkitObLlm & LlmObToolkit & ToolkitObToolkit & WorkforceObToolkit
 *
 * 包含：
 * - ToolkitObUser: 发给 User 的工具结果
 * - ToolkitObLlm: 发给 Llm 的工具结果
 * - LlmObToolkit: 从 Llm 接收的工具调用请求
 * - ToolkitObToolkit: 自己维护的工具结果缓存
 * - WorkforceObToolkit: 从 Workforce 接收的任务信息
 */
export type PerspectiveOfToolkit = ToolkitObUser & ToolkitObLlm & LlmObToolkit & ToolkitObToolkit & WorkforceObToolkit;

/**
 * Workforce 的 Perspective
 *
 * PerspectiveOfWorkforce = AppearanceOfWorkforce
 *  = WorkforceObUser & WorkforceObLlm & WorkforceObToolkit & LlmObWorkforce & WorkforceObWorkforce
 *
 * 包含：
 * - WorkforceObUser: 发给 User 的任务信息
 * - WorkforceObLlm: 发给 Llm 的任务详情
 * - WorkforceObToolkit: 发给 Toolkit 的所有任务
 * - LlmObWorkforce: 从 Llm 接收的请求
 * - WorkforceObWorkforce: 自己维护的状态
 */
export type PerspectiveOfWorkforce = WorkforceObUser & WorkforceObLlm & WorkforceObToolkit & LlmObWorkforce & WorkforceObWorkforce;
