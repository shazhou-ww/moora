// ============================================================================
// effectsAt 函数（统合所有 effectsAt）
// ============================================================================

import type { State, Effect } from "../types/unified";
import type { StateForUser, StateForAgent, StateForToolkit } from "../types/effects";
import {
  effectsAtForUser,
  effectsAtForAgent,
  effectsAtForToolkit,
} from "../effectsAt";
import {
  stateForAgentUser,
  stateForUserAgent,
  stateForToolkitAgent,
  stateForAgentAgent,
  stateForAgentToolkit,
  stateForToolkitToolkit,
} from "./state-for-channel";

/**
 * 统合的 effectsAt 函数
 * 
 * 实现逻辑：
 * - 使用对应的 stateForXxxYyy 函数从统合 State 提取各个 Channel State
 * - 构建各个节点的 StateForXxx 类型（打包该节点需要的所有入边 Channel State）
 * - 调用各个节点的 effectsAtForXxx 函数，传入对应的 StateForXxx
 * - 收集所有 Effect，合并为 Effect Record（注意 key 的唯一性）
 * - 返回 Effect Record
 */
export function effectsAt(state: State): Record<string, Effect> {
  const effects: Record<string, Effect> = {};

  // User 节点的 effectsAt
  const stateForUser: StateForUser = {
    agentUser: stateForAgentUser(state),
  };
  const userEffects = effectsAtForUser(stateForUser);
  Object.assign(effects, userEffects);

  // Agent 节点的 effectsAt
  const stateForAgent: StateForAgent = {
    userAgent: stateForUserAgent(state),
    toolkitAgent: stateForToolkitAgent(state),
    agentAgent: stateForAgentAgent(state),
    agentToolkit: stateForAgentToolkit(state),
  };
  const agentEffects = effectsAtForAgent(stateForAgent);
  Object.assign(effects, agentEffects);

  // Toolkit 节点的 effectsAt
  const stateForToolkit: StateForToolkit = {
    agentToolkit: stateForAgentToolkit(state),
    toolkitToolkit: stateForToolkitToolkit(state),
  };
  const toolkitEffects = effectsAtForToolkit(stateForToolkit);
  Object.assign(effects, toolkitEffects);

  return effects;
}

