/**
 * 类型定义主入口文件
 * 
 * 重新导出所有类型定义，保持向后兼容
 */

// 导出状态相关类型
export type {
  ToolCall,
  LLMCall,
  ShortTermMemory,
  ChannelState,
  ReactLoopState,
  MemoryState,
  VolitionState,
} from './volition-state';

export {
  ToolCallSchema,
  LLMCallSchema,
  ShortTermMemorySchema,
  ChannelStateSchema,
  ReactLoopStateSchema,
  MemoryStateSchema,
  VolitionStateSchema,
} from './volition-state';

// 导出信号相关类型
export type {
  ChannelMessageSignal,
  ToolResultSignal,
  LLMResponseSignal,
  CreateSubvolitionSignal,
  ReactLoopCompletedSignal,
  VolitionSignal,
} from './volition-signal';

export {
  ChannelMessageSignalSchema,
  ToolResultSignalSchema,
  LLMResponseSignalSchema,
  CreateSubvolitionSignalSchema,
  ReactLoopCompletedSignalSchema,
  VolitionSignalSchema,
} from './volition-signal';

// 导出 Effect 相关类型
export type {
  SendMessageEffect,
  ReactLoopEffect,
  CallToolEffect,
  CallLLMEffect,
  VolitionEffect,
} from './volition-effect';

export {
  SendMessageEffectSchema,
  ReactLoopEffectSchema,
  CallToolEffectSchema,
  CallLLMEffectSchema,
  VolitionEffectSchema,
} from './volition-effect';

// 导出配置选项相关类型
export type {
  LLMCallFn,
  Tool,
  VolitionOptions,
} from './volition-options';
