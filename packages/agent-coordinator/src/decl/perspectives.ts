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
 * PerspectiveOfLlm = Llm 的输出（Llm 发送给其他 Actor 的数据）
 *  = LlmObUser & LlmObLlm & LlmObToolkit & LlmObWorkforce
 *
 * 包含：
 * - LlmObUser: 发给 User 的助手消息
 * - LlmObLlm: 自己维护的状态（assiMessages, cutOff）
 * - LlmObToolkit: 发给 Toolkit 的工具调用请求
 * - LlmObWorkforce: 发给 Workforce 的任务请求
 */
export type PerspectiveOfLlm = LlmObUser & LlmObLlm & LlmObToolkit & LlmObWorkforce;

/**
 * Toolkit 的 Perspective
 *
 * PerspectiveOfToolkit = Toolkit 的输出（Toolkit 发送给其他 Actor 的数据）
 *  = ToolkitObUser & ToolkitObLlm & ToolkitObToolkit
 *
 * 包含：
 * - ToolkitObUser: 发给 User 的工具结果
 * - ToolkitObLlm: 发给 Llm 的工具结果
 * - ToolkitObToolkit: 自己维护的工具结果缓存
 */
export type PerspectiveOfToolkit = ToolkitObUser & ToolkitObLlm & ToolkitObToolkit;

/**
 * Workforce 的 Perspective
 *
 * PerspectiveOfWorkforce = Workforce 的输出（Workforce 发送给其他 Actor 的数据）
 *  = WorkforceObUser & WorkforceObLlm & WorkforceObToolkit & WorkforceObWorkforce
 *
 * 包含：
 * - WorkforceObUser: 发给 User 的任务信息
 * - WorkforceObLlm: 发给 Llm 的任务详情
 * - WorkforceObToolkit: 发给 Toolkit 的所有任务
 * - WorkforceObWorkforce: 自己维护的状态
 */
export type PerspectiveOfWorkforce = WorkforceObUser & WorkforceObLlm & WorkforceObToolkit & WorkforceObWorkforce;
