# @moora/agent-coordinator

Agent coordinator for managing workforce tasks.

## Overview

The Coordinator Agent is responsible for:

- **Task Management**: Creating, monitoring, and canceling tasks in the workforce
- **User Communication**: Reporting task completion and failures to users
- **Workforce Coordination**: Acting as a bridge between user requests and the workforce system

Unlike Worker Agents, the Coordinator does not perform actual work. Instead, it:

1. Listens to user input and creates new tasks in the workforce
2. Monitors ongoing top-level tasks (not subtasks)
3. Sends messages to existing tasks when needed
4. Cancels tasks upon user request
5. Reports task outcomes (success/failure) to the user

## Actors

The Coordinator Agent recognizes three actors:

- **User**: The human user interacting with the system
- **Llm**: The language model that processes information and decides actions
- **Workforce**: The task management system that executes work

## Usage

```typescript
import { createAgent, createReaction, createUserReaction, createLlmReaction, createWorkforceReaction } from '@moora/agent-coordinator';
import type { Workforce } from '@moora/workforce';

// Create workforce instance
const workforce: Workforce = createWorkforce({ /* ... */ });

// Create reaction
const reaction = createReaction({
  user: createUserReaction({ notifyUser: async (message) => console.log(message) }),
  llm: createLlmReaction({ callLlm: async (input) => { /* ... */ } }),
  workforce: createWorkforceReaction({ workforce }),
});

// Create agent
const agent = createAgent(reaction);

// Dispatch user message
agent.dispatch({
  type: 'send-user-message',
  id: 'msg-1',
  content: 'Please analyze the sales data',
  timestamp: Date.now(),
});
```

## Architecture

The Coordinator follows the Moore automaton pattern as defined in the MOOREX methodology. See the [AGENT_MODELING_METHODOLOGY.md](../../docs/AGENT_MODELING_METHODOLOGY.md) for more details.
