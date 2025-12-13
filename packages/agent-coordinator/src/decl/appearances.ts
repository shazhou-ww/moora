/**
 * Appearances 类型定义
 *
 * Appearance = Actor 的外表，即别人能看到这个 Actor 的什么数据
 * AppearanceOfFoo = 所有 XxxObFoo 的并集（其他 Actor 对 Foo 的观察）
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
 * User 的 Appearance
 *
 * AppearanceOfUser = 别人能看到 User 的什么
 *  = LlmObUser & UserObUser
 *
 * 包含：
 * - LlmObUser: Llm 看到的 User = 用户消息
 * - UserObUser: User 自己维护的用户消息
 */
export type AppearanceOfUser = LlmObUser & UserObUser;

/**
 * Llm 的 Appearance
 *
 * AppearanceOfLlm = 别人能看到 Llm 的什么
 *  = UserObLlm & ToolkitObLlm & WorkforceObLlm & LlmObLlm
 *
 * 包含：
 * - UserObLlm: User 看到的 Llm = 助手消息
 * - ToolkitObLlm: Toolkit 看到的 Llm = 工具调用请求
 * - WorkforceObLlm: Workforce 看到的 Llm = 任务请求
 * - LlmObLlm: Llm 自己维护的状态
 */
export type AppearanceOfLlm = UserObLlm & ToolkitObLlm & WorkforceObLlm & LlmObLlm;

/**
 * Toolkit 的 Appearance
 *
 * AppearanceOfToolkit = 别人能看到 Toolkit 的什么
 *  = UserObToolkit & LlmObToolkit & ToolkitObToolkit
 *
 * 包含：
 * - UserObToolkit: User 看到的 Toolkit = toolResults
 * - LlmObToolkit: Llm 看到的 Toolkit = toolResults
 * - ToolkitObToolkit: Toolkit 自己维护的状态 = toolResults
 */
export type AppearanceOfToolkit = UserObToolkit & LlmObToolkit & ToolkitObToolkit;

/**
 * Workforce 的 Appearance
 *
 * AppearanceOfWorkforce = 别人能看到 Workforce 的什么
 *  = UserObWorkforce & LlmObWorkforce & WorkforceObWorkforce
 *
 * 包含：
 * - UserObWorkforce: User 看到的 Workforce = topLevelTasks
 * - LlmObWorkforce: Llm 看到的 Workforce = topLevelTasks
 * - WorkforceObWorkforce: Workforce 自己维护的状态 = appendMessageCutOff
 */
export type AppearanceOfWorkforce = UserObWorkforce & LlmObWorkforce & WorkforceObWorkforce;
