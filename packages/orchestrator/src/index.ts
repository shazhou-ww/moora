/**
 * @moora/orchestrator
 *
 * An abstraction layer for coordinating multiple user tasks and interacting
 * with users in real-time.
 *
 * Orchestrator is an abstract implementation that outputs a Moorex, without
 * containing runEffect. The actual effect execution is handled externally through
 * createEffectRunner, allowing different business logic for frontend and backend.
 */

export type {
  TaskStatus,
  UserTask,
  UserMessage,
  TaskResponse,
  OrchestratorState,
  UserInputSignal,
  CreateTaskSignal,
  TaskResponseSignal,
  TaskCompletedSignal,
  TaskFailedSignal,
  CancelTaskSignal,
  UserMessageSentSignal,
  TaskResponseSentSignal,
  OrchestratorSignal,
  SendUserMessageEffect,
  SendTaskResponseEffect,
  ExecuteTaskEffect,
  OrchestratorEffect,
} from './types';

export {
  TaskStatusSchema,
  UserTaskSchema,
  UserMessageSchema,
  TaskResponseSchema,
  OrchestratorStateSchema,
  UserInputSignalSchema,
  CreateTaskSignalSchema,
  TaskResponseSignalSchema,
  TaskCompletedSignalSchema,
  TaskFailedSignalSchema,
  CancelTaskSignalSchema,
  UserMessageSentSignalSchema,
  TaskResponseSentSignalSchema,
  OrchestratorSignalSchema,
  SendUserMessageEffectSchema,
  SendTaskResponseEffectSchema,
  ExecuteTaskEffectSchema,
  OrchestratorEffectSchema,
} from './types';

export { createOrchestrator } from './create-orchestrator.js';
