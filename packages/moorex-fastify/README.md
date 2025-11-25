# @moora/moorex-fastify

[![npm version](https://img.shields.io/npm/v/@moora/moorex-fastify.svg)](https://www.npmjs.com/package/@moora/moorex-fastify)
[![npm downloads](https://img.shields.io/npm/dm/@moora/moorex-fastify.svg)](https://www.npmjs.com/package/@moora/moorex-fastify)
[![test coverage](https://img.shields.io/codecov/c/github/shazhou-ww/moora?flag=moorex-fastify)](https://codecov.io/gh/shazhou-ww/moora)
[![license](https://img.shields.io/npm/l/@moora/moorex-fastify.svg)](https://github.com/shazhou-ww/moora/blob/main/packages/moorex-fastify/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Fastify plugin for Moorex - exposes Moorex state and signals via HTTP API with Server-Sent Events (SSE) support.

**Note**: This package has been renamed from `createMoorexFastify` to `createMoorexNode` to better reflect its purpose.

## Installation

```bash
npm install @moora/moorex-fastify @moora/moorex fastify
# or
bun add @moora/moorex-fastify @moora/moorex fastify
# or
yarn add @moora/moorex-fastify @moora/moorex fastify
```

## Features

- **GET endpoint**: Server-Sent Events (SSE) stream that:
  - Sends the current full state immediately upon connection
  - Pushes all subsequent Moorex events (state updates, effect lifecycle, etc.)
  
- **POST endpoint**: Accepts signals to trigger state transitions (optional)

- **Flexible mounting**: Can be mounted at any path in your Fastify application

- **Two modes**: Create read-only nodes (GET only) or read-write nodes (GET + POST)

## Usage

### Node Modes

You can create two types of nodes:

1. **Read-only node**: Only exposes GET endpoint (SSE stream). Use this when you want to expose state and events but don't want to accept external signals.

2. **Read-write node**: Exposes both GET (SSE) and POST endpoints. Use this when you want to accept signals from clients to trigger state transitions.

### Basic Example

```typescript
import Fastify from 'fastify';
import { createMoorexNode } from '@moora/moorex-fastify';
import { createMoorex, type MoorexDefinition } from '@moora/moorex';
import { createEffectRunner } from '@moora/moorex';
import { create } from 'mutative';

// Define your Moorex machine
type State = { count: number };
type Signal = { type: 'increment' } | { type: 'decrement' };
type Effect = never;

const definition: MoorexDefinition<State, Signal, Effect> = {
  initiate: () => ({ count: 0 }),
  transition: (signal) => (state) => {
    if (signal.type === 'increment') {
      return create(state, (draft) => {
        draft.count += 1;
      });
    }
    if (signal.type === 'decrement') {
      return create(state, (draft) => {
        draft.count -= 1;
      });
    }
    return state;
  },
  effectsAt: () => ({}),
};

// Create Moorex instance and configure effects
const moorex = createMoorex(definition);
// Configure your effects here if needed
// moorex.subscribe(createEffectRunner(runEffect));

// Create Fastify app
const fastify = Fastify({ logger: true });

// Create and register MoorexNode
const moorexNode = createMoorexNode({
  moorex,
  handlePost: async (input, dispatch) => {
    const signal = JSON.parse(input);
    dispatch(signal);
    return { 
      code: 200, 
      content: JSON.stringify({ success: true }) 
    };
  },
});

// Mount at any path
await fastify.register(moorexNode.register, { prefix: '/api/moorex' });

// Start server
await fastify.listen({ port: 3000 });
```

### API Endpoints

#### GET `/api/moorex/` (or your custom prefix)

Establishes an SSE connection that streams Moorex events:

1. **Initial state**: On connection, immediately sends a `state-updated` event with the current full state
2. **Subsequent events**: Streams all Moorex events as they occur:
   - `signal-received`: A signal was received
   - `state-updated`: State was updated
   - `effect-started`: An effect was started
   - `effect-canceled`: An effect was canceled

**Example SSE event format:**
```
data: {"type":"state-updated","state":{"count":5}}
```

**Client example:**
```typescript
const eventSource = new EventSource('http://localhost:3000/api/moorex/');

eventSource.onmessage = (event) => {
  const moorexEvent = JSON.parse(event.data);
  console.log('Moorex event:', moorexEvent);
};

eventSource.addEventListener('state-updated', (event) => {
  const { state } = JSON.parse(event.data);
  console.log('State updated:', state);
});
```

#### POST `/api/moorex/` (or your custom prefix)

Accepts POST requests and processes them through the optional `handlePost` callback.

**Note**: The POST endpoint is only available if you provide a `handlePost` callback when creating the MoorexNode instance.

**Request body:**
The request body is passed as a string to the `handlePost` callback. It can be JSON or any other format, depending on your implementation.

**Example:**
```typescript
const response = await fetch('http://localhost:3000/api/moorex/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'increment' }),
});

const result = await response.text(); // Response content is determined by handlePost
```

### Accessing the Moorex Instance

The Moorex instance is already available to you since you pass it when creating the node:

```typescript
const moorex = createMoorex(definition);

// Configure effects before creating the node
moorex.subscribe(createEffectRunner(runEffect));

const moorexNode = createMoorexNode({ moorex, handlePost });

// You can still access it if needed
const sameMoorex = moorexNode.moorex;

// Dispatch signals programmatically
moorex.dispatch({ type: 'increment' });

// Get current state
const state = moorex.getState();
```

### Read-Only Node (GET Only)

Create a read-only node when you only want to expose state and events via SSE, without accepting external signals:

```typescript
// Create read-only node - only GET endpoint available
const readOnlyNode = createMoorexNode({
  moorex,
  // No handlePost - POST route will not be registered
});

await fastify.register(readOnlyNode.register, { prefix: '/api/moorex/read' });
```

This is useful for:
- Monitoring/debugging endpoints
- Dashboards that only need to observe state
- Internal services that don't accept external input

### Read-Write Node (GET + POST)

Create a read-write node when you want to accept signals from clients:

```typescript
// Create read-write node - both GET and POST endpoints available
const readWriteNode = createMoorexNode({
  moorex,
  handlePost: async (input, dispatch) => {
    const signal = JSON.parse(input);
    dispatch(signal);
    return { 
      code: 200, 
      content: JSON.stringify({ success: true }) 
    };
  },
});

await fastify.register(readWriteNode.register, { prefix: '/api/moorex/write' });
```

This is useful for:
- Public APIs that accept user input
- Client applications that need to trigger state changes
- Interactive services

## API Reference

### `createMoorexNode(options)`

Creates a MoorexNode instance.

**Parameters:**
- `options.moorex`: `Moorex<State, Signal, Effect>` - An existing Moorex instance (with effects already configured if needed)
- `options.handlePost?`: `HandlePost<Signal>` - Optional POST request handler

**Returns:** `MoorexNode<State, Signal, Effect>`

### `HandlePost<Signal>`

The type of the POST handler callback:

```typescript
type HandlePost<Signal> = (
  input: string,
  dispatch: (signal: Signal) => void,
) => Promise<PostResponse>;
```

**Parameters:**
- `input`: `string` - The POST request body as a string
- `dispatch`: `(signal: Signal) => void` - A function to dispatch signals to the Moorex instance

**Returns:** `Promise<PostResponse>` where `PostResponse` is:
```typescript
{
  code: number;    // HTTP status code
  content: string; // Response body as a string
}
```

### `MoorexNode.register(fastify, options?)`

Registers the plugin with Fastify. This is a standard Fastify plugin function.

**Parameters:**
- `fastify`: `FastifyInstance` - The Fastify instance
- `options.prefix?`: `string` - Optional route prefix (e.g., `/api/moorex`)

## License

MIT

