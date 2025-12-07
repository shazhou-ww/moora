/**
 * Agent 的 Effect 函数实现
 */

import type { AgentState, AgentInput, EffectFns } from "@/decl/agent";
import type { ContextOfUser, ContextOfLlm, ContextOfToolkit } from "@/decl/contexts";
import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";

// ============================================================================
// Effect 相关函数
// ============================================================================

/**
 * 创建 Agent 的 Effect 函数
 *
 * 根据当前状态，统合各个 Actor 的 Effect，返回副作用函数。
 *
 * 由于 Automata 的输出需要统合所有 Actor 的 Effect，
 * 这里我们将各个 Actor 的 Effect 统合为一个函数。
 *
 * @param effectFns - 各个 Actor 的 Effect 函数映射
 * @returns 统合后的 effect 函数
 */
export const createEffect =
  (effectFns: EffectFns) =>
  (state: AgentState): Eff<Dispatch<AgentInput>> => {
    // 确保 state 存在并提取所需的字段，使用默认值防止 undefined
    if (!state) {
      console.error("[createEffect] State is undefined!");
      throw new Error("State is undefined in createEffect");
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
        toolCallRequests,
        toolResults,
      };
      const contextToolkit: ContextOfToolkit = {
        toolCallRequests, // 来自 StateOfLlm，因为 ToolkitObLlm 观察 Llm 的 toolCallRequests
        toolResults,
      };
      effectFns.user({ context: contextUser, dispatch });
      effectFns.llm({ context: contextLlm, dispatch });
      effectFns.toolkit({ context: contextToolkit, dispatch });
    };
  };
