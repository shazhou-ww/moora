/**
 * @moora/agent-coordinator
 *
 * Agent coordinator for managing workforce tasks
 */

// ============================================================================
// 类型导出
// ============================================================================
export type {
  // Actors
  Actors,
  // Observations
  TaskMonitorInfo,
  UserObLlm,
  UserObUser,
  UserObWorkforce,
  LlmObLlm,
  LlmObUser,
  LlmObWorkforce,
  WorkforceObWorkforce,
  WorkforceObLlm,
  WorkforceObUser,
  // Appearances
  AppearanceOfUser,
  AppearanceOfLlm,
  AppearanceOfWorkforce,
  // Perspectives
  PerspectiveOfUser,
  PerspectiveOfLlm,
  PerspectiveOfWorkforce,
  // Actions
  SendUserMessage,
  StartAssiMessageStream,
  EndAssiMessageStream,
  RequestCreateTask,
  RequestAppendMessage,
  RequestCancelTasks,
  NotifyTaskCompletion,
  UpdateTaskStatus,
  ActionFromUser,
  ActionFromLlm,
  ActionFromWorkforce,
  Actuation,
  // Helpers
  AppearanceOf,
  PerspectiveOf,
  ActionFrom,
  InitialFnOf,
  TransitionFnOf,
  // Agent
  Worldscape,
  ReactionFnOf,
  ReactionFns,
  AgentReaction,
  // Reactions
  NotifyUser,
  CallLlm,
  Workforce,
} from "./decl";

export { USER, LLM, WORKFORCE } from "./decl";

// ============================================================================
// 实现导出
// ============================================================================
export {
  // Initials
  initialUser,
  initialLlm,
  initialWorkforce,
  // Transitions
  transitionUser,
  transitionLlm,
  transitionWorkforce,
  // Agent
  initialAgent,
  transitionAgent,
  createReaction,
  createAgent,
  // Reactions
  createUserReaction,
  createLlmReaction,
  createWorkforceReaction,
} from "./impl";

export type {
  UserReactionDeps,
  LlmReactionDeps,
  WorkforceReactionDeps,
} from "./impl";
