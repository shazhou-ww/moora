/**
 * Agent 的输出函数实现
 */

import type { AgentState, AgentInput, OutputFns } from "@/decl/agent";
import type { Dispatch } from "@moora/automata";

// ============================================================================
// Output 相关函数
// ============================================================================

/**
 * 创建 Agent 的输出函数
 *
 * **纯函数**：根据当前状态，统合各个 Actor 的输出，返回副作用函数。
 * 函数本身不执行任何副作用，所有副作用都在返回的函数中执行。
 *
 * 由于 Automata 的 moore 函数只接受一个 output 函数，
 * 这里我们需要统合所有 Actor 的输出。
 *
 * @param outputFns - 各个 Actor 的 Output 函数映射
 * @returns 统合后的 output 函数
 */
export const createOutput =
  (outputFns: OutputFns) =>
  ({ userMessages, assiMessages }: AgentState) => (dispatch: Dispatch<AgentInput>) => {
    outputFns.user({ context: { userMessages, assiMessages }, dispatch });
    outputFns.llm({ context: { userMessages, assiMessages }, dispatch });
  }
