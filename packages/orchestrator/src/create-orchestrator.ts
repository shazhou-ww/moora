import { type Immutable } from 'mutative';
import { create } from 'mutative';
import { type MoorexDefinition } from '@moora/moorex';
import type {
  OrchestratorState,
  OrchestratorSignal,
  OrchestratorEffect,
  UserTask,
  UserMessage,
  TaskResponse,
} from './types';

/**
 * 创建 Orchestrator 定义
 *
 * Orchestrator 是一个 moorex 自动机，代表协调多个用户任务并实时与用户交互的抽象层。
 *
 * Orchestrator 是抽象实现，输出一个 Moorex，本身不包含 runEffect。
 * 实际的 effect 执行由外部通过 createEffectRunner 来实现，这样可以区分前后端的业务逻辑。
 *
 * @returns Moorex 定义
 *
 * @example
 * ```typescript
 * const definition = createOrchestrator();
 * const orchestrator = createMoorex(definition);
 *
 * // 使用 createEffectRunner 来执行 effects
 * const runEffect = (effect, state, key) => ({
 *   start: async (dispatch) => {
 *     // 执行 effect 逻辑（前端或后端）
 *     if (effect.kind === 'send-user-message') {
 *       // 前端：显示消息给用户
 *       // 后端：通过 WebSocket 发送消息
 *       await sendMessage(effect.content);
 *     }
 *   },
 *   cancel: () => {
 *     // 取消 effect
 *   }
 * });
 *
 * orchestrator.subscribe(createEffectRunner(runEffect));
 * orchestrator.dispatch({ type: 'create-task', content: 'Hello', task: 'default' });
 * ```
 */
export const createOrchestrator = (): MoorexDefinition<
  OrchestratorState,
  OrchestratorSignal,
  OrchestratorEffect
> => {
  /**
   * 生成唯一 ID
   */
  const generateId = (prefix: string, counter: number): string => {
    return `${prefix}-${counter}`;
  };

  /**
   * 获取当前时间戳
   */
  const getTimestamp = (): number => {
    return Date.now();
  };

  return {
    /**
     * 初始化状态
     *
     * 创建初始的 Orchestrator 状态，包含：
     * - 空的任务列表
     * - 空的消息队列
     */
    initiate: (): Immutable<OrchestratorState> => {
      return {
        tasks: {},
        pendingUserMessages: [],
        pendingTaskResponses: [],
        nextTaskId: 1,
      };
    },

    /**
     * 状态转换函数
     *
     * 处理各种信号，更新状态。
     */
    transition: (
      signal: Immutable<OrchestratorSignal>,
    ): ((state: Immutable<OrchestratorState>) => Immutable<OrchestratorState>) => {
      return (state) => {
        return create(state, (draft) => {
          const now = getTimestamp();

          switch (signal.type) {
            case 'user-input': {
              // 用户输入：创建用户消息
              const messageId = generateId('msg', now);
              const message: UserMessage = {
                id: messageId,
                content: signal.content,
                taskId: signal.taskId,
                timestamp: now,
                sent: false,
              };
              draft.pendingUserMessages.push(message);

              // 如果有关联的任务，更新任务
              if (signal.taskId) {
                const task = draft.tasks[signal.taskId];
                if (task) {
                  task.updatedAt = now;
                }
              }
              break;
            }

            case 'create-task': {
              // 创建新任务
              const taskId = generateId('task', draft.nextTaskId);
              const task: UserTask = {
                id: taskId,
                content: signal.content,
                task: signal.task,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
              };
              draft.tasks[taskId] = task;
              draft.nextTaskId += 1;
              break;
            }

            case 'task-response': {
              // 任务响应：更新任务状态，创建任务响应消息
              const task = draft.tasks[signal.taskId];
              if (task) {
                task.status = signal.completed ? 'completed' : 'running';
                task.result = signal.completed ? signal.content : undefined;
                task.error = signal.error;
                task.updatedAt = now;
              }

              // 创建任务响应消息
              const responseId = generateId('response', now);
              const response: TaskResponse = {
                id: responseId,
                content: signal.content,
                taskId: signal.taskId,
                timestamp: now,
                sent: false,
              };
              draft.pendingTaskResponses.push(response);
              break;
            }

            case 'task-completed': {
              // 任务完成：更新任务状态
              const task = draft.tasks[signal.taskId];
              if (task) {
                task.status = 'completed';
                task.result = signal.result;
                task.updatedAt = now;
              }
              break;
            }

            case 'task-failed': {
              // 任务失败：更新任务状态
              const task = draft.tasks[signal.taskId];
              if (task) {
                task.status = 'failed';
                task.error = signal.error;
                task.updatedAt = now;
              }
              break;
            }

            case 'cancel-task': {
              // 取消任务：更新任务状态
              const task = draft.tasks[signal.taskId];
              if (task) {
                task.status = 'cancelled';
                task.updatedAt = now;
              }
              break;
            }

            case 'user-message-sent': {
              // 用户消息已发送：标记消息为已发送并从队列中移除
              const messageIndex = draft.pendingUserMessages.findIndex(
                (msg) => msg.id === signal.messageId,
              );
              if (messageIndex !== -1) {
                draft.pendingUserMessages.splice(messageIndex, 1);
              }
              break;
            }

            case 'task-response-sent': {
              // 任务响应已发送：标记消息为已发送并从队列中移除
              const messageIndex = draft.pendingTaskResponses.findIndex(
                (msg) => msg.id === signal.messageId,
              );
              if (messageIndex !== -1) {
                draft.pendingTaskResponses.splice(messageIndex, 1);
              }
              break;
            }
          }
        });
      };
    },

    /**
     * Effect 选择器
     *
     * 根据当前状态决定需要运行的 effects。
     */
    effectsAt: (
      state: Immutable<OrchestratorState>,
    ): Record<string, Immutable<OrchestratorEffect>> => {
      const effects: Record<string, Immutable<OrchestratorEffect>> = {};

      // 为每个待发送的用户消息创建 effect
      for (const message of state.pendingUserMessages) {
        if (!message.sent) {
          effects[`send-user-message-${message.id}`] = {
            kind: 'send-user-message',
            messageId: message.id,
            content: message.content,
            taskId: message.taskId,
          };
        }
      }

      // 为每个待发送的任务响应创建 effect
      for (const response of state.pendingTaskResponses) {
        if (!response.sent) {
          effects[`send-task-response-${response.id}`] = {
            kind: 'send-task-response',
            messageId: response.id,
            taskId: response.taskId,
            content: response.content,
          };
        }
      }

      // 为每个待处理的任务创建执行 effect
      for (const task of Object.values(state.tasks)) {
        if (task.status === 'pending') {
          effects[`execute-task-${task.id}`] = {
            kind: 'execute-task',
            taskId: task.id,
            content: task.content,
            task: task.task,
          };
        }
      }

      return effects;
    },
  };
};
