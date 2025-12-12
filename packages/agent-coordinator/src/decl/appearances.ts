/**
 * Appearances 类型定义
 *
 * AppearanceOfFoo = 所有 XxxObFoo 的交集
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
  WorkforceObWorkforce,
} from "./observations";

/**
 * User 的 Appearance
 *
 * AppearanceOfUser = UserObUser & LlmObUser & ToolkitObUser & WorkforceObUser
 */
export type AppearanceOfUser = UserObUser & LlmObUser & ToolkitObUser & WorkforceObUser;

/**
 * Llm 的 Appearance
 *
 * AppearanceOfLlm = Llm 的输入（其他 Actor 发送给 Llm 的数据）
 *  = UserObLlm & LlmObLlm & ToolkitObLlm & WorkforceObLlm
 */
export type AppearanceOfLlm = UserObLlm & LlmObLlm & ToolkitObLlm & WorkforceObLlm;

/**
 * Toolkit 的 Appearance
 *
 * AppearanceOfToolkit = Toolkit 的输入（其他 Actor 发送给 Toolkit 的数据）
 *  = LlmObToolkit & ToolkitObToolkit
 *
 * 注意：Toolkit 持有 Workforce 实例并直接调用其方法，不通过 Observation
 */
export type AppearanceOfToolkit = LlmObToolkit & ToolkitObToolkit;

/**
 * Workforce 的 Appearance
 *
 * AppearanceOfWorkforce = Workforce 的输入（其他 Actor 发送给 Workforce 的数据）
 *  = LlmObWorkforce & WorkforceObWorkforce
 */
export type AppearanceOfWorkforce = LlmObWorkforce & WorkforceObWorkforce;
