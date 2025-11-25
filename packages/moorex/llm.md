# Moorex for LLM-Driven Agents

## Name

moorex

## Description

Moorex is an asynchronous Moore machine runtime that keeps agent state and side
effects in sync. It is designed for persistent AI agents that must survive
crashes, restarts, or migrations while resuming pending LLM interactions and
tool executions safely.

## Usage

```typescript
import { createMoorex, createEffectRunner, type MoorexDefinition } from 'moorex';
import { create } from 'mutative';
```

> **Important**: All data types (State, Signal, Effect) in Moorex are
> **read-only/immutable** (using `Immutable` types from
> [mutative](https://github.com/unadlib/mutative)). We strongly recommend using
> mutative's `create()` function for immutable state updates.

> Prepare the agent definition: describe state transitions and desired effects.
> All function parameters and return values are immutable.

```typescript
const definition: MoorexDefinition<AgentState, AgentSignal, AgentEffect> = {
  initiate: () => initialState,
  transition: (signal) => (state) => reduceState(state, signal),
  effectsAt: (state) => decideEffects(state),
};
```

> Spin up the Moorex agent, create an effect runner to handle effects, subscribe to events, and dispatch the first user message.

```typescript
const agent = createMoorex(definition);

// Create and subscribe an effect runner
const runEffect = (effect, state, key) => ({
  start: async (dispatch) => { /* execute effect */ },
  cancel: () => { /* cancel effect */ },
});
agent.subscribe(createEffectRunner(runEffect));

agent.subscribe((event) => {
  console.log(event);
});

agent.dispatch({ type: 'user', message: 'Summarize the latest log entries.' });
```

### Key Types

```typescript
import { type Immutable } from 'mutative';

// Machine definition
type MoorexDefinition<State, Signal, Effect> = {
  initiate: () => Immutable<State>;
  transition: (signal: Immutable<Signal>) => (state: Immutable<State>) => Immutable<State>;
  effectsAt: (state: Immutable<State>) => Record<string, Immutable<Effect>>;
};

// Machine instance
type Moorex<State, Signal, Effect> = {
  dispatch(signal: Immutable<Signal>): void;
  subscribe(handler: (event: MoorexEvent<State, Signal, Effect>, moorex: Moorex<State, Signal, Effect>) => void): CancelFn;
  getState(): Immutable<State>;
};

// Events
type MoorexEvent<State, Signal, Effect> =
  | { type: 'signal-received'; signal: Immutable<Signal> }
  | { type: 'state-updated'; state: Immutable<State> }
  | { type: 'effect-started'; effect: Immutable<Effect>; key: string }
  | { type: 'effect-canceled'; effect: Immutable<Effect>; key: string };

// Effect initializer
type EffectInitializer<Signal> = {
  start: (dispatch: (signal: Immutable<Signal>) => void) => Promise<void>;
  cancel: () => void;
};

// Cancel function
type CancelFn = () => void;
```

### Definition Parameters

All parameters and return values are **Immutable** (read-only) types. Use
mutative's `create()` for immutable updates:

- `initiate()`: function that returns the initial state (can hydrate from
  persistent storage). Return value must be immutable.
- `transition(signal)(state)`: pure reducer that applies an incoming signal to
  produce the next state. Both `signal` and `state` are immutable; return a new
  immutable state. Use `create(state, (draft) => { ... })` for updates.
- `effectsAt(state)`: returns a Record of effects implied by the state (keys
  serve as effect identifiers). `state` is immutable; return immutable effect
  objects.

### Running Effects

To actually execute effects, use `createEffectRunner`:

```typescript
import { createEffectRunner } from 'moorex';

const runEffect = (
  effect: Immutable<Effect>,
  state: Immutable<State>,
  key: string,
) => ({
  start: async (dispatch) => {
    // Execute the effect
    // Use dispatch to send signals back to the machine
  },
  cancel: () => {
    // Cancel the effect if needed
  },
});

agent.subscribe(createEffectRunner(runEffect));
```

The `runEffect` function receives:
- `effect`: The effect to run (immutable)
- `state`: The **current state** of the machine (immutable, obtained via `moorex.getState()`)
- `key`: The effect's key from the Record returned by `effectsAt`

All parameters are immutable (except `key` which is a string).

