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
  WorkforceObToolkit,
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
 * AppearanceOfLlm = PerspectiveOfLlm
 *  = LlmObUser & LlmObToolkit & LlmObWorkforce & UserObLlm & LlmObLlm & ToolkitObLlm & WorkforceObLlm
 */
export type AppearanceOfLlm = LlmObUser & LlmObToolkit & LlmObWorkforce & UserObLlm & LlmObLlm & ToolkitObLlm & WorkforceObLlm;

/**
 * Toolkit 的 Appearance
 *
 * AppearanceOfToolkit = PerspectiveOfToolkit
 *  = ToolkitObUser & ToolkitObLlm & LlmObToolkit & ToolkitObToolkit & WorkforceObToolkit
 */
export type AppearanceOfToolkit = ToolkitObUser & ToolkitObLlm & LlmObToolkit & ToolkitObToolkit & WorkforceObToolkit;

/**
 * Workforce 的 Appearance
 *
 * AppearanceOfWorkforce = PerspectiveOfWorkforce
 *  = WorkforceObUser & WorkforceObLlm & WorkforceObToolkit & LlmObWorkforce & WorkforceObWorkforce
 */
export type AppearanceOfWorkforce = WorkforceObUser & WorkforceObLlm & WorkforceObToolkit & LlmObWorkforce & WorkforceObWorkforce;
