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
              // 用户输入：创建用户消息（用户输入本身就是已发送状态）
              const messageId = generateId('msg', now);
              const message: UserMessage = {
                id: messageId,
                content: signal.content,
                taskId: signal.taskId,
                timestamp: now,
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
                status: 'in-progress',
                createdAt: now,
                updatedAt: now,
              };
              draft.tasks[taskId] = task;
              draft.nextTaskId += 1;
              break;
            }

            case 'reply-to-user': {
              // 回复用户：更新相关任务状态，创建响应消息
              // 更新任务状态（如果有 taskUpdates）
              for (const taskUpdate of signal.taskUpdates) {
                const task = draft.tasks[taskUpdate.id];
                if (task) {
                  task.status = taskUpdate.status;
                  // 如果完成，保存结果
                  if (taskUpdate.status === 'completed') {
                    // 如果是普通文本，保存 content；如果是流式，保存整个 response 对象
                    task.result = signal.response.isStream
                      ? signal.response
                      : signal.response.content;
                  }
                  task.updatedAt = now;
                }
              }

              // 清理相关任务之前的响应消息（只保留最新的响应）
              if (signal.taskUpdates.length > 0) {
                const taskIds = signal.taskUpdates.map((tu) => tu.id);
                draft.pendingTaskResponses = draft.pendingTaskResponses.filter(
                  (r) => !r.taskId || !taskIds.includes(r.taskId),
                );
              }

              // 创建新的响应消息
              const responseId = generateId('response', now);
              const response: TaskResponse = {
                id: responseId,
                response: signal.response,
                taskId: signal.taskUpdates.length > 0
                  ? signal.taskUpdates[0]!.id
                  : undefined,
                timestamp: now,
              };
              draft.pendingTaskResponses.push(response);
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
        effects[`send-user-message-${message.id}`] = {
          kind: 'send-user-message',
          messageId: message.id,
          content: message.content,
          taskId: message.taskId,
        };
      }

      // 为每个待发送的任务响应创建 effect
      for (const response of state.pendingTaskResponses) {
        effects[`send-task-response-${response.id}`] = {
          kind: 'send-task-response',
          messageId: response.id,
          taskId: response.taskId,
          content: response.response,
        };
      }

      // 为每个进行中的任务创建执行 effect
      for (const task of Object.values(state.tasks)) {
        if (task.status === 'in-progress') {
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
