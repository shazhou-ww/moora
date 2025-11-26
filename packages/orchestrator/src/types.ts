/**
 * 类型定义主入口文件
 * 
 * 重新导出所有类型定义，保持向后兼容
 */

// 导出状态相关类型
export type {
  ResponseStatus,
  TaskStatus,
  UserTask,
  UserMessage,
  TaskResponse,
  OrchestratorState,
} from './orchestrator-state';

export {
  ResponseStatusSchema,
  TaskStatusSchema,
  UserTaskSchema,
  UserMessageSchema,
  TaskResponseSchema,
  OrchestratorStateSchema,
} from './orchestrator-state';

// 导出信号相关类型
export type {
  TaskUpdate,
  OrchestratorResponse as UserResponseContent,
  UserInputSignal,
  CreateTaskSignal,
  ReplyToUserSignal,
  CancelTaskSignal,
  OrchestratorSignal,
} from './orchestrator-signal';

export {
  TaskUpdateSchema,
  OrchestratorResponseSchema as UserResponseContentSchema,
  UserInputSignalSchema,
  CreateTaskSignalSchema,
  ReplyToUserSignalSchema,
  CancelTaskSignalSchema,
  OrchestratorSignalSchema,
} from './orchestrator-signal';

// 导出 Effect 相关类型
export type {
  SendUserMessageEffect,
  SendTaskResponseEffect,
  ExecuteTaskEffect,
  OrchestratorEffect,
} from './orchestrator-effect';

export {
  SendUserMessageEffectSchema,
  SendTaskResponseEffectSchema,
  ExecuteTaskEffectSchema,
  OrchestratorEffectSchema,
} from './orchestrator-effect';
