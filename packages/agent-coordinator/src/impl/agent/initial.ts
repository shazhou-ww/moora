/**
 * Agent 初始化函数
 */

import type { Worldscape } from "@/decl";
import { initialWorldscape } from "@/impl/initial";

/**
 * 初始化整个 Agent 的状态
 *
 * @returns 初始 Worldscape
 */
export function initialAgent(): Worldscape {
  return initialWorldscape();
}
