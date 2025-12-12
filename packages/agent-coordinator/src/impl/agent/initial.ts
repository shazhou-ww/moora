/**
 * Agent 初始化函数
 */

import type { Worldscape } from "@/decl";
import { initialUser, initialLlm, initialToolkit, initialWorkforce } from "@/impl/initials";

/**
 * 初始化整个 Agent 的状态
 *
 * @returns 初始 Worldscape
 */
export function initialAgent(): Worldscape {
  const userPerspective = initialUser();
  const llmPerspective = initialLlm();
  const toolkitPerspective = initialToolkit();
  const workforcePerspective = initialWorkforce();

  return {
    // User's perspective
    ...userPerspective,

    // Llm's perspective
    ...llmPerspective,

    // Toolkit's perspective
    ...toolkitPerspective,

    // Workforce's perspective
    ...workforcePerspective,
  };
}
