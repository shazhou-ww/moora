// ============================================================================
// Reflexor State Machine - Transition Functions
// ============================================================================

import type { Transition } from "@moora/moorex";
import type { ReflexorInput } from "../input";
import type { ReflexorState } from "../state";
import { checkTimeIrreversibility } from "./utils";
import { handleUserSendMessage } from "./user-send-message";
import { handleUserTakeAction } from "./user-take-action";
import { handleBrainRefineContext } from "./brain-refine-context";
import { handleBrainCallTools } from "./brain-call-tools";
import {
  handleBrainSendMessageStart,
  handleBrainSendMessageComplete,
} from "./brain-send-message";
import {
  handleToolkitRespond,
  handleToolkitError,
} from "./toolkit-respond";

/**
 * 创建 Reflexor 状态转换函数
 *
 * 返回标准的 moorex transition 函数：
 * `(input: ReflexorInput) => (state: ReflexorState) => ReflexorState`
 *
 * @returns 标准的 moorex transition 函数
 *
 * @example
 * ```typescript
 * const transition = createReflexorTransition();
 *
 * const newState = transition({
 *   type: "user-send-message",
 *   messageId: "msg-1",
 *   content: "Hello",
 *   timestamp: Date.now(),
 * })(currentState);
 * ```
 */
export const createReflexorTransition =
  (): Transition<ReflexorInput, ReflexorState> =>
  (input) =>
  (state) => {
    // 检查时间不可逆原则
    if (!checkTimeIrreversibility(input, state)) {
      return state;
    }

    switch (input.type) {
      // User inputs
      case "user-send-message":
        return handleUserSendMessage(input, state);
      case "user-take-action":
        return handleUserTakeAction(input, state);
      // Brain inputs
      case "brain-refine-context":
        return handleBrainRefineContext(input, state);
      case "brain-call-tools":
        return handleBrainCallTools(input, state);
      case "brain-send-message-start":
        return handleBrainSendMessageStart(input, state);
      case "brain-send-message-complete":
        return handleBrainSendMessageComplete(input, state);
      // Toolkit inputs
      case "toolkit-respond":
        return handleToolkitRespond(input, state);
      case "toolkit-error":
        return handleToolkitError(input, state);
      default:
        // 确保所有 case 都被处理
        const _exhaustive: never = input;
        return state;
    }
  };

