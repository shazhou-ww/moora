/**
 * @moora/agent-coordinator
 *
 * Agent coordinator for managing workforce tasks
 */

// ============================================================================
// 类型导出
// ============================================================================
export type {
  // Messages
  UserMessage,
  AssiMessage,
  AssiMessageStreaming,
  AssiMessageCompleted,
  UserMessages,
  AssiMessages,
  // Tool related
  ToolCallRequest,
  ToolResult,
  ToolCallRequests,
  ToolResults,
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
  initialWorldscape,
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
  // Pseudo tools
  TaskDefinition,
  CreateTasksParams,
  AppendMessageParams,
  CancelTasksParams,
  CoordinatorPseudoToolCall,
} from "./impl";

// ============================================================================
// 伪工具导出
// ============================================================================
export {
  WF_CREATE_TASKS,
  WF_APPEND_MESSAGE,
  WF_CANCEL_TASKS,
  WF_QUERY_TASKS,
  coordinatorPseudoToolInfos,
  isCoordinatorPseudoTool,
  parseCoordinatorPseudoToolCall,
} from "./impl";
