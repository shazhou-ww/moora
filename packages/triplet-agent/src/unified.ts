// ============================================================================
// 步骤 6：最后统合去冗余 - 统合全局 State、Signal、Effect 类型
// ============================================================================

import { create } from "mutative";
import type { Dispatch, EffectController } from "@moora/moorex";
import type {
  OutputFromUser,
  OutputFromAgent,
  OutputFromToolkit,
} from "./io";
import type {
  StateUserAgent,
  StateAgentToolkit,
  StateToolkitAgent,
  StateAgentUser,
  StateUserUser,
  StateAgentAgent,
  StateToolkitToolkit,
} from "./state";
import type {
  EffectOfUser,
  EffectOfAgent,
  EffectOfToolkit,
  CallLLMFn,
  GetToolNamesFn,
  GetToolDefinitionsFn,
  UpdateUIFn,
} from "./effects";
import type {
  Channel,
  ChannelUserAgent,
  ChannelAgentToolkit,
  ChannelToolkitAgent,
  ChannelAgentUser,
  ChannelUserUser,
  ChannelAgentAgent,
  ChannelToolkitToolkit,
} from "./channels";
import {
  Channel_USER_AGENT,
  Channel_AGENT_TOOLKIT,
  Channel_TOOLKIT_AGENT,
  Channel_AGENT_USER,
  Channel_USER_USER,
  Channel_AGENT_AGENT,
  Channel_TOOLKIT_TOOLKIT,
} from "./channels";
import {
  transitionUserAgent,
  transitionAgentToolkit,
  transitionToolkitAgent,
  transitionAgentUser,
  transitionUserUser,
  transitionAgentAgent,
  transitionToolkitToolkit,
} from "./transition";
import {
  effectsAtForUser,
  effectsAtForAgent,
  effectsAtForToolkit,
  runEffectForUser,
  runEffectForAgent,
  runEffectForToolkit,
} from "./effects";

// ============================================================================
// 全局 State 类型（所有 Channel State 的合并）
// ============================================================================

/**
 * 全局 State 类型
 * 
 * 合并所有 Channel 的 State 类型，形成统一的全局状态。
 * 关键洞察：All Observation == All State（有向图的所有入边等于所有出边）
 */
export type State = {
  // Channel USER -> AGENT 的 State
  userAgent: StateUserAgent;
  // Channel AGENT -> TOOLKIT 的 State
  agentToolkit: StateAgentToolkit;
  // Channel TOOLKIT -> AGENT 的 State
  toolkitAgent: StateToolkitAgent;
  // Channel AGENT -> USER 的 State
  agentUser: StateAgentUser;
  // Channel USER -> USER (Loopback) 的 State
  userUser: StateUserUser;
  // Channel AGENT -> AGENT (Loopback) 的 State
  agentAgent: StateAgentAgent;
  // Channel TOOLKIT -> TOOLKIT (Loopback) 的 State
  toolkitToolkit: StateToolkitToolkit;
};

// ============================================================================
// Signal 类型（各个 Participant Output 的 union）
// ============================================================================

/**
 * Signal 类型
 * 
 * Signal 是各个 Participant Output 的 union。
 * 注意：改名为 Signal，不再是 Input。
 */
export type Signal = OutputFromUser | OutputFromAgent | OutputFromToolkit;

// ============================================================================
// Effect 类型（各个 Participant Effect 的 union）
// ============================================================================

/**
 * Effect 类型
 * 
 * Effect 是各个 Participant Effect 的 union。
 */
export type Effect = EffectOfUser | EffectOfAgent | EffectOfToolkit;

// ============================================================================
// 从 State 推导每个 Channel State 的函数
// ============================================================================

/**
 * 从 Channel 类型推导对应的 State 类型
 */
export type StateForChannel<C extends Channel> = 
  C extends ChannelUserAgent ? StateUserAgent :
  C extends ChannelAgentToolkit ? StateAgentToolkit :
  C extends ChannelToolkitAgent ? StateToolkitAgent :
  C extends ChannelAgentUser ? StateAgentUser :
  C extends ChannelUserUser ? StateUserUser :
  C extends ChannelAgentAgent ? StateAgentAgent :
  C extends ChannelToolkitToolkit ? StateToolkitToolkit :
  never;

/**
 * 从 State 推导每个 Channel State 的函数
 */
export function getStateForChannel<C extends Channel>(
  state: State,
  channel: C
): StateForChannel<C> {
  if (channel === Channel_USER_AGENT) {
    return state.userAgent as StateForChannel<C>;
  }
  if (channel === Channel_AGENT_TOOLKIT) {
    return state.agentToolkit as StateForChannel<C>;
  }
  if (channel === Channel_TOOLKIT_AGENT) {
    return state.toolkitAgent as StateForChannel<C>;
  }
  if (channel === Channel_AGENT_USER) {
    return state.agentUser as StateForChannel<C>;
  }
  if (channel === Channel_USER_USER) {
    return state.userUser as StateForChannel<C>;
  }
  if (channel === Channel_AGENT_AGENT) {
    return state.agentAgent as StateForChannel<C>;
  }
  if (channel === Channel_TOOLKIT_TOOLKIT) {
    return state.toolkitToolkit as StateForChannel<C>;
  }
  throw new Error(`Unknown channel: ${channel}`);
}

// ============================================================================
// initial 函数
// ============================================================================

/**
 * initial 函数
 * 
 * 返回初始 State。
 */
export function initial(): State {
  return {
    userAgent: {
      userMessages: [],
      canceledStreamingMessageIds: [],
    },
    agentToolkit: {
      pendingToolCalls: [],
    },
    toolkitAgent: {
      toolResults: [],
    },
    agentUser: {
      messages: [],
      streamingChunks: {},
    },
    userUser: {
      actionHistory: [],
    },
    agentAgent: {
      processingHistory: [],
    },
    toolkitToolkit: {
      executionHistory: [],
    },
  };
}

// ============================================================================
// transition 函数（统合所有 transition）
// ============================================================================

/**
 * transition 函数
 * 
 * 根据 Signal 的来源，更新对应的 Channel State。
 * 统合所有 Channel 的 transition 函数。
 * 
 * 注意：Moorex 的 Transition 类型是 (input) => (state) => State
 */
export function transition(signal: Signal): (state: State) => State {
  return (state: State): State => {
  // 来自 User 的 Output
  if (signal.type === "sendMessage" || signal.type === "cancelStreaming") {
    const userOutput = signal as OutputFromUser;
    return create(state, (draft) => {
      // 更新 USER -> AGENT Channel State
      draft.userAgent = transitionUserAgent(userOutput, state.userAgent);
      // 更新 USER -> USER (Loopback) Channel State
      draft.userUser = transitionUserUser(userOutput, state.userUser);
    });
  }
  
  // 来自 Agent 的 Output
  if (signal.type === "callTool" || signal.type === "sendChunk" || signal.type === "completeMessage") {
    const agentOutput = signal as OutputFromAgent;
    return create(state, (draft) => {
      if (agentOutput.type === "callTool") {
        // 更新 AGENT -> TOOLKIT Channel State
        draft.agentToolkit = transitionAgentToolkit(agentOutput, state.agentToolkit);
      } else {
        // 更新 AGENT -> USER Channel State
        draft.agentUser = transitionAgentUser(agentOutput, state.agentUser);
      }
      // 更新 AGENT -> AGENT (Loopback) Channel State
      draft.agentAgent = transitionAgentAgent(agentOutput, state.agentAgent);
    });
  }
  
  // 来自 Toolkit 的 Output
  if (signal.type === "toolResult" || signal.type === "toolError") {
    const toolkitOutput = signal as OutputFromToolkit;
    return create(state, (draft) => {
      // 更新 TOOLKIT -> AGENT Channel State
      draft.toolkitAgent = transitionToolkitAgent(toolkitOutput, state.toolkitAgent);
      // 更新 TOOLKIT -> TOOLKIT (Loopback) Channel State
      draft.toolkitToolkit = transitionToolkitToolkit(toolkitOutput, state.toolkitToolkit);
    });
  }
  
    return state;
  };
}

// ============================================================================
// effectsAt 函数（统合所有 effectsAt）
// ============================================================================

/**
 * effectsAt 函数
 * 
 * 综合所有节点的 effectsAt 逻辑，从全局 State 推导 Effect。
 */
export function effectsAt(state: State): Record<string, Effect> {
  const effects: Record<string, Effect> = {};
  
  // User 节点的 effectsAt
  const userEffects = effectsAtForUser(state.agentUser, state.userUser);
  Object.assign(effects, userEffects);
  
  // Agent 节点的 effectsAt
  const agentEffects = effectsAtForAgent(
    state.userAgent,
    state.toolkitAgent,
    state.agentAgent
  );
  Object.assign(effects, agentEffects);
  
  // Toolkit 节点的 effectsAt
  const toolkitEffects = effectsAtForToolkit(
    state.agentToolkit,
    state.toolkitToolkit
  );
  Object.assign(effects, toolkitEffects);
  
  return effects;
}

// ============================================================================
// runEffect 函数（统合所有 runEffect）
// ============================================================================

/**
 * runEffect 函数选项（不包含 dispatch）
 * 
 * 包含所有需要注入的依赖（dispatch 在 EffectController.start 中提供）。
 */
export type RunEffectOptions = {
  updateUI: UpdateUIFn;
  callLLM: CallLLMFn;
  prompt: string;
  getToolNames: GetToolNamesFn;
  getToolDefinitions: GetToolDefinitionsFn;
};

/**
 * runEffect 函数
 * 
 * 根据 Effect 的类型，调用对应的 runEffect。
 * 统合所有节点的 runEffect 函数。
 * 
 * 注意：返回的 EffectController.start 方法会接收 dispatch 参数，
 * 然后在 start 中调用实际的 runEffect 函数，传入 dispatch。
 */
export function runEffect(
  effect: Effect,
  state: State,
  key: string,
  options: RunEffectOptions
): EffectController<Signal> {
  if (effect.kind === "updateUI") {
    // 返回包装的 EffectController，start 方法接收 dispatch
    const userController = runEffectForUser(
      effect as EffectOfUser,
      state.agentUser,
      (signal) => {
        // 这个 dispatch 会在 start 中提供
        throw new Error("Dispatch should be provided in start method");
      },
      options.updateUI
    );
    
    return {
      start: async (dispatch: Dispatch<Signal>) => {
        // 重新创建 controller，传入实际的 dispatch
        const controller = runEffectForUser(
          effect as EffectOfUser,
          state.agentUser,
          dispatch,
          options.updateUI
        );
        await controller.start(dispatch);
      },
      cancel: userController.cancel,
    };
  }
  
  if (effect.kind === "callLLM") {
    const agentController = runEffectForAgent(
      effect as EffectOfAgent,
      state.userAgent,
      state.toolkitAgent,
      (signal) => {
        throw new Error("Dispatch should be provided in start method");
      },
      options.callLLM,
      options.prompt,
      options.getToolNames,
      options.getToolDefinitions
    );
    
    return {
      start: async (dispatch: Dispatch<Signal>) => {
        const controller = runEffectForAgent(
          effect as EffectOfAgent,
          state.userAgent,
          state.toolkitAgent,
          dispatch,
          options.callLLM,
          options.prompt,
          options.getToolNames,
          options.getToolDefinitions
        );
        await controller.start(dispatch);
      },
      cancel: agentController.cancel,
    };
  }
  
  if (effect.kind === "executeTool") {
    const toolkitController = runEffectForToolkit(
      effect as EffectOfToolkit,
      state.agentToolkit,
      (signal) => {
        throw new Error("Dispatch should be provided in start method");
      },
      options.getToolNames,
      options.getToolDefinitions
    );
    
    return {
      start: async (dispatch: Dispatch<Signal>) => {
        const controller = runEffectForToolkit(
          effect as EffectOfToolkit,
          state.agentToolkit,
          dispatch,
          options.getToolNames,
          options.getToolDefinitions
        );
        await controller.start(dispatch);
      },
      cancel: toolkitController.cancel,
    };
  }
  
  throw new Error(`Unknown effect kind: ${(effect as Effect).kind}`);
}

