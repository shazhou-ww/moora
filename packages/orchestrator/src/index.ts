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
  ResponseStatus,
  TaskStatus,
  UserTask,
  UserMessage,
  TaskResponse,
  OrchestratorState,
  TaskUpdate,
  UserResponseContent,
  UserInputSignal,
  CreateTaskSignal,
  ReplyToUserSignal,
  CancelTaskSignal,
  OrchestratorSignal,
  SendUserMessageEffect,
  SendTaskResponseEffect,
  ExecuteTaskEffect,
  OrchestratorEffect,
} from './types';

export {
  ResponseStatusSchema,
  TaskStatusSchema,
  UserTaskSchema,
  UserMessageSchema,
  TaskResponseSchema,
  OrchestratorStateSchema,
  TaskUpdateSchema,
  UserResponseContentSchema,
  UserInputSignalSchema,
  CreateTaskSignalSchema,
  ReplyToUserSignalSchema,
  CancelTaskSignalSchema,
  OrchestratorSignalSchema,
  SendUserMessageEffectSchema,
  SendTaskResponseEffectSchema,
  ExecuteTaskEffectSchema,
  OrchestratorEffectSchema,
} from './types';

export { createOrchestrator } from './create-orchestrator.js';
