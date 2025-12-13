/**
 * Workforce 实现
 *
 * 维护 Task tree 和 Agent 池，自动调度 Worker Agent 完成分配的任务
 * 使用 automata-based 状态机实现
 */

// import { v4 as uuidv4 } from "uuid"; // Currently not used

import {
  createAgent,
  createReaction,
  createLlmReaction,
  createToolkitReaction,
  createUserReaction,
} from "@moora/agent-worker";
import { automata } from "@moora/automata";
import { createPubSub } from "@moora/pub-sub";
import { createToolkit } from "@moora/toolkit";

import {
  // ROOT_TASK_ID, // Currently not used
  type TaskId,
  type Workforce,
  type WorkforceConfig,
  type CreateTaskInput,
  type AppendMessageInput,
  type Task,
  type TaskRuntimeStatus,
  type TaskEvent,
  type TaskDetailEvent,
  type WorkforceLogLevel,
  type WorkforceLogEntry,
  type WorkforceLogger,
} from "../types";
/**
 * Nullable 工具类型
 */
type Nullable<T> = T | null;
import { createAgentManager } from "./agent-manager";
import { initial } from "./initial";
import { output } from "./output";
import {
  parsePseudoToolCall,
  createPseudoToolDefinitions,
} from "./pseudo-tools";
import { transition } from "./transition";

import type { WorkforceState, WorkforceInput, OutputContext } from "./types";
import type { Agent, AgentUpdatePack } from "@moora/agent-worker";
import type { Dispatch } from "@moora/automata";
import type { Eff } from "@moora/effects";
import type { Toolkit, ToolDefinition } from "@moora/toolkit";


// ============================================================================
// 日志辅助函数
// ============================================================================

/**
 * 创建日志记录器
 *
 * @param logger - 外部传入的日志函数
 * @returns 日志记录辅助函数
 */
function createLogHelper(logger: Nullable<WorkforceLogger>) {
  return (
    level: WorkforceLogLevel,
    message: string,
    taskId: Nullable<TaskId>,
    data: Record<string, unknown> = {}
  ) => {
    if (logger) {
      const entry: WorkforceLogEntry = {
        level,
        message,
        timestamp: Date.now(),
        taskId,
        data,
      };
      logger(entry);
    }
  };
}

// ============================================================================
// Workforce 实现
// ============================================================================

/**
 * 创建 Workforce
 *
 * @param config - Workforce 配置
 * @returns Workforce 实例
 */
export function createWorkforce(config: WorkforceConfig): Workforce {
  const { toolkit: userToolkit, callLlm, logger } = config;

  console.log("[Workforce DEBUG] createWorkforce called", {
    maxAgents: config.maxAgents,
    hasLogger: logger !== null,
  });

  // 创建日志辅助函数
  const log = createLogHelper(logger);

  log("info", "Workforce 创建", null, { maxAgents: config.maxAgents });

  // 创建事件 PubSub
  const taskEventPubSub = createPubSub<TaskEvent>();
  const taskDetailEventPubSub = createPubSub<TaskDetailEvent>();

  // 创建 Agent 管理器
  const agentManager = createAgentManager();

  // 创建输出上下文
  const outputContext: OutputContext = {
    taskEventPubSub,
    taskDetailEventPubSub,
    agentManager,
    log,
  };

  // 创建状态机
  const machine = automata<WorkforceInput, Eff<Dispatch<WorkforceInput>>, WorkforceState>(
    {
      initial: () => initial(config),
      transition,
    },
    (update) => {
      const effect = output(outputContext)(update);
      return effect !== null ? { output: effect } : null;
    }
  );

  // ============================================================================
  // 内部函数
  // ============================================================================

  /**
   * 创建合并了伪工具的 Toolkit
   */
  function createCombinedToolkit(): Toolkit {
    const pseudoToolDefs = createPseudoToolDefinitions();
    const userToolInfos = userToolkit.getAllToolInfos();

    // 合并用户工具和伪工具
    const allToolDefs: ToolDefinition[] = [
      ...userToolInfos.map((info) => ({
        ...info,
        execute: (params: string) => userToolkit.invoke(info.name, params),
      })),
      ...pseudoToolDefs,
    ];

    return createToolkit(allToolDefs);
  }

  /**
   * 为指定 Task 创建 Worker Agent
   */
  function createWorkerAgent(taskId: TaskId): Agent | undefined {
    const state = machine.current();
    const task = state.tasks[taskId];
    if (!task) return undefined;

    const combinedToolkit = createCombinedToolkit();

    // 创建 callTool 函数，拦截伪工具
    const callTool = async (request: {
      toolCallId: string;
      name: string;
      arguments: string;
    }) => {
      console.log("[Workforce DEBUG] Tool call received", {
        taskId: taskId.slice(0, 8),
        toolName: request.name,
        argsPreview: request.arguments.slice(0, 100),
      });
      
      const pseudoCall = parsePseudoToolCall(request.name, request.arguments);

      if (pseudoCall) {
        console.log("[Workforce DEBUG] Pseudo tool call detected", {
          taskId: taskId.slice(0, 8),
          pseudoToolType: pseudoCall.type,
        });
        // 伪工具调用，dispatch 伪工具调用输入
        machine.dispatch({
          type: "pseudo-tool-call",
          taskId,
          call: pseudoCall,
        });
        return JSON.stringify({ status: "acknowledged" });
      }

      // 普通工具调用
      console.log("[Workforce DEBUG] Invoking real tool", {
        taskId: taskId.slice(0, 8),
        toolName: request.name,
      });
      return combinedToolkit.invoke(request.name, request.arguments);
    };

    // 获取工具定义列表
    const toolDefs = combinedToolkit.getAllToolInfos().map((info) => ({
      name: info.name,
      description: info.description,
      parameters: JSON.stringify(info.parameterSchema),
    }));

    // 创建 reaction
    const reaction = createReaction({
      user: createUserReaction({
        notifyUser: () => {
          // 可以在这里添加日志或其他通知
        },
      }),
      llm: createLlmReaction({
        callLlm,
        tools: toolDefs,
        onStart: (_messageId: string) => {
          // Worldscape 更新会通过 Agent 的 subscribe 同步
        },
        onChunk: (messageId: string, chunk: string) => {
          // 发布流式事件
          taskDetailEventPubSub.pub({
            type: "task-detail-stream-chunk",
            taskId,
            messageId,
            chunk,
            timestamp: Date.now(),
          });
        },
        onComplete: (_messageId: string, _content: string) => {
          // Worldscape 更新会通过 Agent 的 subscribe 同步
        },
      }),
      toolkit: createToolkitReaction({
        callTool: async (request: {
          toolCallId: string;
          name: string;
          arguments: string;
        }) => {
          // 发布工具调用请求事件
          taskDetailEventPubSub.pub({
            type: "task-detail-tool-call-request",
            taskId,
            toolCallId: request.toolCallId,
            name: request.name,
            arguments: request.arguments,
            timestamp: Date.now(),
          });

          // 执行工具调用
          const result = await callTool(request);

          // 发布工具调用响应事件
          taskDetailEventPubSub.pub({
            type: "task-detail-tool-call-response",
            taskId,
            toolCallId: request.toolCallId,
            result,
            timestamp: Date.now(),
          });

          return result;
        },
      }),
    });

    // 创建 Agent
    return createAgent(reaction);
  }

  // ============================================================================
  // 订阅状态机输出，处理副作用
  // ============================================================================

  machine.subscribe((effect: Eff<Dispatch<WorkforceInput>>) => {
    // 执行副作用函数，传入 dispatch
    effect(machine.dispatch);

    const state = machine.current();

    // 处理 Agent 操作
    // 1. 检查需要创建的 Agent（schedule-agent 输入后）
    // 2. 检查需要销毁的 Agent（任务完成或取消后）

    // 检查新调度的任务
    const workingAgentTaskIds = new Set(Object.keys(state.workingAgents));
    const agentManagerTaskIds = new Set(
      agentManager.getAll().map((wa) => wa.taskId)
    );

    // 创建新的 Agent
    for (const taskId of workingAgentTaskIds) {
      if (!agentManagerTaskIds.has(taskId)) {
        console.log("[Workforce DEBUG] Creating Worker Agent for task", taskId);
        log("info", "创建 Worker Agent", taskId, {
          workingAgentCount: workingAgentTaskIds.size,
        });
        const agent = createWorkerAgent(taskId);
        if (agent) {
          console.log("[Workforce DEBUG] Worker Agent created successfully for task", taskId);
          
          // 订阅 Agent 更新，同步 Worldscape 到状态
          const unsubscribe = agent.subscribe((update: AgentUpdatePack) => {
            const prevInput = update.prev?.input;
            console.log("[Workforce DEBUG] Worker Agent worldscape updated", {
              taskId: taskId.slice(0, 8),
              inputType: prevInput?.type ?? "initial",
              userMsgCount: update.state.userMessages.length,
              assiMsgCount: update.state.assiMessages.length,
              toolCallCount: update.state.toolCallRequests.length,
              toolResultCount: update.state.toolResults.length,
              cutOff: update.state.cutOff,
              // 最后一条助手消息的状态
              lastAssiMsg: update.state.assiMessages.length > 0
                ? {
                    id: update.state.assiMessages[update.state.assiMessages.length - 1]?.id,
                    streaming: update.state.assiMessages[update.state.assiMessages.length - 1]?.streaming,
                  }
                : null,
            });
            log("debug", "Agent Worldscape 更新", taskId, {
              assiMessageCount: update.state.assiMessages.length,
              userMessageCount: update.state.userMessages.length,
              toolCallRequestCount: update.state.toolCallRequests.length,
            });
            // 同步 Worldscape 到状态
            machine.dispatch({
              type: "update-worldscape",
              taskId,
              worldscape: update.state,
            });
          });

          agentManager.create(taskId, agent, unsubscribe);
          log("info", "Worker Agent 已创建", taskId, {});

          // 发送初始用户消息（从 Worldscape 获取）
          const task = state.tasks[taskId];
          if (task && task.worldscape.userMessages.length > 0) {
            console.log("[Workforce DEBUG] Sending initial user messages to agent", {
              taskId: taskId.slice(0, 8),
              messageCount: task.worldscape.userMessages.length,
            });
            log("debug", "发送初始用户消息", taskId, {
              messageCount: task.worldscape.userMessages.length,
            });
            for (const msg of task.worldscape.userMessages) {
              agent.dispatch({
                type: "send-user-message",
                id: msg.id,
                content: msg.content,
                timestamp: msg.timestamp,
              });
            }
          }
        } else {
          console.log("[Workforce DEBUG] Worker Agent creation FAILED for task", taskId);
          log("warn", "Worker Agent 创建失败", taskId, {});
        }
      }
    }

    // 销毁已完成的 Agent
    for (const taskId of agentManagerTaskIds) {
      if (!workingAgentTaskIds.has(taskId)) {
        log("info", "销毁 Worker Agent", taskId, {});
        agentManager.destroy(taskId);
        // dispatch agent-completed 输入
        machine.dispatch({ type: "agent-completed", taskId });
      }
    }
  });

  // ============================================================================
  // Workforce API 实现
  // ============================================================================

  /**
   * 创建一组 Task
   */
  function createTasks(tasks: CreateTaskInput[]): void {
    console.log("[Workforce DEBUG] createTasks called", {
      count: tasks.length,
      taskIds: tasks.map((t) => t.id),
    });
    log("info", "创建 Tasks", null, {
      count: tasks.length,
      taskIds: tasks.map((t) => t.id),
    });
    machine.dispatch({ type: "create-tasks", tasks });
  }

  /**
   * 向 Task 追加补充信息
   */
  function appendMessage(input: AppendMessageInput): void {
    log("info", "追加消息到 Tasks", null, {
      messageId: input.messageId,
      taskIds: input.taskIds,
    });
    machine.dispatch({ type: "append-message", input });

    // 如果 Task 正在被处理，通知 Agent
    const _state = machine.current();
    const { messageId, content, taskIds } = input;
    for (const taskId of taskIds) {
      const workingAgent = agentManager.get(taskId);
      if (workingAgent) {
        log("debug", "通知正在运行的 Agent", taskId, { messageId });
        workingAgent.agent.dispatch({
          type: "send-user-message",
          id: messageId,
          content,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * 取消一组 Task
   */
  function cancelTasks(taskIds: TaskId[]): void {
    log("info", "取消 Tasks", null, { taskIds });
    machine.dispatch({ type: "cancel-tasks", taskIds });

    // 销毁正在运行的 Agent
    for (const taskId of taskIds) {
      log("debug", "销毁被取消的 Agent", taskId, {});
      agentManager.destroy(taskId);
    }
  }

  /**
   * 获取指定 Task 的完整信息
   */
  function getTask(taskId: TaskId): Task | undefined {
    const state = machine.current();
    return state.tasks[taskId];
  }

  /**
   * 获取指定 Task 的运行时状态
   */
  function getTaskStatus(taskId: TaskId): TaskRuntimeStatus | undefined {
    const state = machine.current();
    const task = state.tasks[taskId];
    if (!task) return undefined;
    return {
      id: task.id,
      status: task.status,
      result: task.result,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * 获取所有 Task 的 ID 列表
   */
  function getAllTaskIds(): TaskId[] {
    const state = machine.current();
    return Object.keys(state.tasks);
  }

  /**
   * 获取指定 Task 的子任务 ID 列表
   */
  function getChildTaskIds(taskId: TaskId): TaskId[] {
    const state = machine.current();
    return state.children[taskId] || [];
  }

  /**
   * 销毁 Workforce
   */
  function destroy(): void {
    log("info", "销毁 Workforce", null, {
      activeAgents: agentManager.getAll().length,
    });
    machine.dispatch({ type: "destroy" });
    agentManager.destroyAll();
  }

  return {
    createTasks,
    appendMessage,
    cancelTasks,
    getTask,
    getTaskStatus,
    getAllTaskIds,
    getChildTaskIds,
    subscribeTaskEvent: taskEventPubSub.sub,
    subscribeTaskDetailEvent: taskDetailEventPubSub.sub,
    destroy,
  };
}
