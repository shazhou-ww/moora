/**
 * 类型定义主入口文件
 * 
 * 重新导出所有类型定义，保持向后兼容
 */

// 导出状态相关类型
export type {
  TaskStatus,
  UserTask,
  UserMessage,
  TaskResponse,
  OrchestratorState,
} from './orchestrator-state';

export {
  TaskStatusSchema,
  UserTaskSchema,
  UserMessageSchema,
  TaskResponseSchema,
  OrchestratorStateSchema,
} from './orchestrator-state';

// 导出信号相关类型
export type {
  UserInputSignal,
  CreateTaskSignal,
  TaskResponseSignal,
  TaskCompletedSignal,
  TaskFailedSignal,
  CancelTaskSignal,
  UserMessageSentSignal,
  TaskResponseSentSignal,
  OrchestratorSignal,
} from './orchestrator-signal';

export {
  UserInputSignalSchema,
  CreateTaskSignalSchema,
  TaskResponseSignalSchema,
  TaskCompletedSignalSchema,
  TaskFailedSignalSchema,
  CancelTaskSignalSchema,
  UserMessageSentSignalSchema,
  TaskResponseSentSignalSchema,
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
