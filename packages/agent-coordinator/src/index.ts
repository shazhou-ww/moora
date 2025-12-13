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
  LlmObLlm,
  LlmObUser,
  LlmObWorkforce,
  LlmObToolkit,
  ToolkitObLlm,
  ToolkitObToolkit,
  WorkforceObWorkforce,
  WorkforceObLlm,
  // Appearances
  AppearanceOfUser,
  AppearanceOfLlm,
  AppearanceOfToolkit,
  AppearanceOfWorkforce,
  // Perspectives
  PerspectiveOfUser,
  PerspectiveOfLlm,
  PerspectiveOfToolkit,
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

export { USER, LLM, TOOLKIT, WORKFORCE } from "./decl";

// ============================================================================
// 实现导出
// ============================================================================
export {
  // Initials
  initialUser,
  initialLlm,
  initialToolkit,
  initialWorkforce,
  // Transitions
  transitionUser,
  transitionLlm,
  transitionToolkit,
  transitionWorkforce,
  // Agent
  initialAgent,
  transitionAgent,
  createReaction,
  createAgent,
  extractUserPerspective,
  // Reactions
  createUserReaction,
  createLlmReaction,
  createToolkitReaction,
  createWorkforceReaction,
} from "./impl";

export type {
  UserReactionDeps,
  LlmReactionDeps,
  ToolkitReactionOptions,
  WorkforceReactionDeps,
} from "./impl";
