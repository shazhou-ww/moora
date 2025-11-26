# @moora/orchestrator

An abstraction layer for coordinating multiple AI Agents to execute user tasks and interact with users in real-time.

## Overview

Orchestrator is a moorex automaton that coordinates multiple AI Agents to execute multiple user tasks simultaneously and interact with users in real-time. It provides an abstract implementation that outputs a Moorex without containing `runEffect`, allowing different business logic for frontend and backend through external effect runners.

## Features

- **State Management**: Uses zod@^4 schemas for type-safe state, signal, and effect definitions
- **Cross-Platform**: Works in both frontend and backend environments
- **Abstract Implementation**: Outputs a Moorex definition without runEffect, allowing flexible effect execution
- **Real-time Coordination**: Manages multiple agents and tasks simultaneously
- **Type Safety**: Full TypeScript support with zod schema validation

## Installation

```bash
npm install @moora/orchestrator
```

## Usage

### Basic Example

```typescript
import { createMoorex } from '@moora/moorex';
import { createEffectRunner } from '@moora/moorex';
import { createOrchestrator } from '@moora/orchestrator';

// Create orchestrator definition
const definition = createOrchestrator();
const orchestrator = createMoorex(definition);

// Define effect runner (frontend or backend specific)
const runEffect = (effect, state, key) => {
  switch (effect.kind) {
    case 'send-user-message':
      // Frontend: Display message to user
      // Backend: Send via WebSocket
      return {
        start: async (dispatch) => {
          await sendMessage(effect.content);
          // Dispatch signal to mark message as sent
          dispatch({ type: 'message-sent', messageId: effect.messageId });
        },
        cancel: () => {},
      };
    case 'send-agent-message':
      // Send message to agent
      return {
        start: async (dispatch) => {
          await sendToAgent(effect.agentId, effect.content);
        },
        cancel: () => {},
      };
    // ... handle other effects
  }
};

// Subscribe effect runner
orchestrator.subscribe(createEffectRunner(runEffect));

// Use orchestrator
orchestrator.dispatch({ type: 'create-task', content: 'Process this task' });
```

### State, Signal, and Effect Types

All types are defined using zod@^4 schemas, allowing for:
- JSON schema generation
- LLM interaction
- Data validation for persistence layer

```typescript
import {
  OrchestratorStateSchema,
  OrchestratorSignalSchema,
  OrchestratorEffectSchema,
} from '@moora/orchestrator';

// Validate state
const state = OrchestratorStateSchema.parse(data);

// Generate JSON schema
const jsonSchema = OrchestratorStateSchema._def;
```

## Architecture

Orchestrator follows the moorex automaton pattern:

- **State**: Represents the current state of all tasks, agents, and messages
- **Signal**: Input events that trigger state transitions (user input, agent responses, etc.)
- **Effect**: Side effects implied by the state (send messages, create agents, assign tasks, etc.)

The orchestrator is abstract and doesn't contain `runEffect`. Instead, you provide your own effect runner that can implement different logic for frontend and backend while maintaining consistent state.

## License

MIT

