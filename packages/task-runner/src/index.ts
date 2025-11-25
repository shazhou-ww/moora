/**
 * @moora/task-runner
 *
 * A moorex automaton representing AI Agent's task execution lifecycle.
 */

export type {
  TaskRunnerState,
  TaskRunnerSignal,
  TaskRunnerEffect,
  ChannelState,
  ReactLoopState,
  MemoryState,
  Tool,
  LLMCallFn,
  TaskRunnerOptions,
} from './types';

export { createTaskRunner } from './create-task-runner.js';

// 导出 ID 计算工具
export type {
  TaskRunnerId,
  ChannelId,
  MessageId,
} from './id-utils';

export {
  computeTopLevelTaskRunnerId,
  computeSubTaskRunnerId,
  computeChannelId,
  computeMessageId,
  parseMessageId,
} from './id-utils';


