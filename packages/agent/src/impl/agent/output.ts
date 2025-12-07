/**
 * Agent 的输出函数实现
 */

import type { AgentState, AgentInput, OutputFns } from "@/decl/agent";
import type { ContextOfUser, ContextOfLlm, ContextOfToolkit } from "@/decl/contexts";
import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";

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
  (state: AgentState): Eff<Dispatch<AgentInput>> => {
    // 确保 state 存在并提取所需的字段，使用默认值防止 undefined
    if (!state) {
      console.error("[createOutput] State is undefined!");
      throw new Error("State is undefined in createOutput");
    }
    const userMessages = state.userMessages ?? [];
    const assiMessages = state.assiMessages ?? [];
    const cutOff = state.cutOff ?? 0;
    const toolCallRequests = state.toolCallRequests ?? [];
    const toolResults = state.toolResults ?? [];
    return (dispatch: Dispatch<AgentInput>) => {
      const contextUser: ContextOfUser = {
        userMessages,
        assiMessages,
        toolCallRequests,
        toolResults,
      };
      const contextLlm: ContextOfLlm = {
        userMessages,
        assiMessages,
        cutOff,
        toolResults,
      };
      const contextToolkit: ContextOfToolkit = {
        toolCallRequests, // 来自 StateOfLlm，因为 ToolkitObLlm 观察 Llm 的 toolCallRequests
        toolResults,
      };
      outputFns.user({ context: contextUser, dispatch });
      outputFns.llm({ context: contextLlm, dispatch });
      outputFns.toolkit({ context: contextToolkit, dispatch });
    };
  };
