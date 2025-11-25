# Volition: Moorex Automaton for AI Agent Psychological Activities

[![npm version](https://img.shields.io/npm/v/@moora/volition.svg)](https://www.npmjs.com/package/@moora/volition)
[![license](https://img.shields.io/npm/l/@moora/volition.svg)](https://github.com/shazhou-ww/moora/blob/main/packages/volition/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Volition is a moorex automaton representing AI Agent's psychological activities for achieving specific goals. It provides a structured way to manage channels, ReAct loops, and memory for AI agents.

## Getting Started

Install Volition and its dependencies:

```bash
npm install @moora/volition @moora/moorex mutative
# or
bun add @moora/volition @moora/moorex mutative
# or
yarn add @moora/volition @moora/moorex mutative
```

## Core Concepts

### Three Key Data Types

Volition is built around three core immutable data types:

1. **`VolitionState`**: The complete state of the volition, including channels, ReAct loops, and memory
2. **`VolitionSignal`**: Input events that trigger state transitions (messages, tool results, LLM responses, etc.)
3. **`VolitionEffect`**: Side effects implied by the state (sending messages, calling LLM, calling tools, etc.)

### Channel Architecture

- **Upstream channel (id: 0)**: Connects to upstream systems (not necessarily a volition)
- **Downstream channels (id: 1, 2, 3...)**: Connect to downstream volitions
- Each channel supports bidirectional alternating communication
- Supports dynamic creation and closing of downstream channels

### ReAct Loop

When a message is received, a ReAct (Reasoning-Acting-Observing) loop is triggered:

- **Reasoning**: The agent thinks about the message
- **Acting**: The agent calls tools or LLM
- **Observing**: The agent receives tool results or LLM responses
- Upstream messages must be replied to; downstream messages are optional

## Basic Usage

```typescript
import { createMoorex } from '@moora/moorex';
import { createVolition } from '@moora/volition';

// Create a volition definition
const definition = createVolition({
  callLLM: async (prompt: string) => {
    // Call your LLM API
    return await yourLLMAPI.generate(prompt);
  },
  tools: [
    {
      name: 'search',
      description: 'Search the web',
      execute: async (input: unknown) => {
        // Execute search
        return searchResults;
      },
    },
  ],
});

// Create the volition machine
const volition = createMoorex(definition);

// Dispatch signals
volition.dispatch({
  type: 'channel-message',
  channelId: 0,
  content: 'Hello, agent!',
});
```

## Type Definitions

### VolitionState

The complete state of a volition:

```typescript
type VolitionState = {
  /** All channel states */
  channels: Record<number, ChannelState>;
  /** Active ReAct loops */
  reactLoops: Record<string, ReactLoopState>;
  /** Memory/context information */
  memory: MemoryState;
  /** Next available downstream channel ID */
  nextChannelId: number;
};
```

### VolitionSignal

Signals that trigger state transitions:

```typescript
type VolitionSignal =
  | { type: 'channel-message'; channelId: number; content: string }
  | { type: 'tool-result'; reactLoopId: string; toolName: string; result: unknown }
  | { type: 'llm-response'; reactLoopId: string; content: string }
  | { type: 'create-subvolition'; target: string }
  | { type: 'react-loop-completed'; reactLoopId: string; response: string };
```

### VolitionEffect

Effects that should be executed based on the state:

```typescript
type VolitionEffect =
  | { kind: 'send-message'; channelId: number; content: string }
  | { kind: 'react-loop'; channelId: number; message: string }
  | { kind: 'call-tool'; reactLoopId: string; toolName: string; input: unknown }
  | { kind: 'call-llm'; reactLoopId: string; prompt: string };
```

### Supporting Types

#### ChannelState

```typescript
type ChannelState = {
  id: number;                    // 0 for upstream, positive for downstream
  connected: boolean;            // Whether the channel is connected
  pendingMessages: string[];     // Queue of messages to send
  waitingForReply: boolean;      // Whether waiting for a reply (for alternating communication)
};
```

#### ReactLoopState

```typescript
type ReactLoopState = {
  id: string;                    // Unique identifier for the loop
  channelId: number;             // Channel that triggered this loop
  originalMessage: string;       // Original message content
  thoughts: string[];            // Reasoning process
  toolCalls: Array<{             // Tool call history
    toolName: string;
    input: unknown;
    result?: unknown;
  }>;
  llmCalls: Array<{              // LLM call history
    prompt: string;
    response?: string;
  }>;
  completed: boolean;            // Whether the loop is completed
  response?: string;             // Final response (if completed)
};
```

#### MemoryState

```typescript
type MemoryState = {
  longTerm: Record<string, unknown>;  // Persistent memory
  shortTerm: Array<{                  // Session-level memory
    timestamp: number;
    content: string;
  }>;
};
```

## Configuration

### VolitionOptions

```typescript
type VolitionOptions = {
  /** LLM call function */
  callLLM: (prompt: string) => Promise<string>;
  /** List of tools (built-in + external) */
  tools?: Tool[];
  /** Initial memory state (optional) */
  initialMemory?: Partial<MemoryState>;
};
```

### Tool Definition

```typescript
type Tool = {
  name: string;                    // Tool name
  description: string;             // Tool description
  parameters?: unknown;            // Tool parameters schema (JSON Schema format)
  execute: (input: unknown) => Promise<unknown> | unknown;  // Tool execution function
};
```

## Current Status

⚠️ **Note**: This is an initial implementation focusing on type definitions. The `transition` and `effectsAt` functions are currently placeholders and will be implemented in future iterations.

- ✅ Type definitions complete
- ✅ Basic framework structure
- ⏳ State transition logic (to be implemented)
- ⏳ Effect selection logic (to be implemented)
- ⏳ ReAct loop implementation (to be implemented)

## License

MIT


