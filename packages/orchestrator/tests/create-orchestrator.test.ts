import { describe, it, expect } from 'vitest';
import { createMoorex } from '@moora/moorex';
import { createOrchestrator } from '../src/create-orchestrator.js';
import type { OrchestratorState, OrchestratorSignal } from '../src/types.js';

describe('createOrchestrator', () => {
  it('should create an orchestrator with initial state', () => {
    const definition = createOrchestrator();
    const orchestrator = createMoorex(definition);

    const state = orchestrator.getState();
    expect(state.tasks).toEqual({});
    expect(state.pendingUserMessages).toEqual([]);
    expect(state.pendingTaskResponses).toEqual([]);
    expect(state.nextTaskId).toBe(1);
  });

  it('should handle create-task signal', () => {
    const definition = createOrchestrator();
    const orchestrator = createMoorex(definition);

    orchestrator.dispatch({
      type: 'create-task',
      content: 'Test task',
      task: 'default',
    });

    const state = orchestrator.getState();
    const taskIds = Object.keys(state.tasks);
    expect(taskIds.length).toBe(1);

    const taskId = taskIds[0];
    expect(taskId).toBeDefined();
    if (!taskId) return;
    const task = state.tasks[taskId];
    expect(task).toBeDefined();
    expect(task?.content).toBe('Test task');
    expect(task?.task).toBe('default');
    expect(task?.status).toBe('pending');
  });

  it('should handle user-input signal', () => {
    const definition = createOrchestrator();
    const orchestrator = createMoorex(definition);

    orchestrator.dispatch({
      type: 'user-input',
      content: 'Hello',
    });

    const state = orchestrator.getState();
    expect(state.pendingUserMessages.length).toBe(1);
    expect(state.pendingUserMessages[0]?.content).toBe('Hello');
    expect(state.pendingUserMessages[0]?.sent).toBe(false);
  });

  it('should handle task-response signal', () => {
    const definition = createOrchestrator();
    const orchestrator = createMoorex(definition);

    // Create a task first
    orchestrator.dispatch({
      type: 'create-task',
      content: 'Test task',
      task: 'default',
    });

    const state1 = orchestrator.getState();
    const taskIds = Object.keys(state1.tasks);
    const taskId = taskIds[0];
    expect(taskId).toBeDefined();
    if (!taskId) return;

    // Send task response
    orchestrator.dispatch({
      type: 'task-response',
      taskId,
      content: 'Task response',
      completed: false,
    });

    const state2 = orchestrator.getState();
    expect(state2.tasks[taskId]?.status).toBe('running');
    expect(state2.pendingTaskResponses.length).toBe(1);
    expect(state2.pendingTaskResponses[0]?.content).toBe('Task response');
  });

  it('should generate effects for pending messages', async () => {
    const definition = createOrchestrator();
    const orchestrator = createMoorex(definition);

    // Create a user message
    orchestrator.dispatch({
      type: 'user-input',
      content: 'Hello',
    });

    // Wait for effects to be calculated
    const effects: string[] = [];
    orchestrator.subscribe((event) => {
      if (event.type === 'effect-started') {
        effects.push(event.key);
      }
    });

    // Give time for effects to be calculated
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check that effect was created for sending user message
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.some((key) => key.startsWith('send-user-message-'))).toBe(true);
  });

  it('should generate execute-task effect for pending tasks', async () => {
    const definition = createOrchestrator();
    const orchestrator = createMoorex(definition);

    // Create a task
    orchestrator.dispatch({
      type: 'create-task',
      content: 'Test task',
      task: 'default',
    });

    // Wait for effects to be calculated
    const effects: string[] = [];
    orchestrator.subscribe((event) => {
      if (event.type === 'effect-started') {
        effects.push(event.key);
      }
    });

    // Give time for effects to be calculated
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check that effect was created for executing task
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.some((key) => key.startsWith('execute-task-'))).toBe(true);
  });
});
