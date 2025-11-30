# Agent Core State Machine

Core state machine implementation for Agent, defining the state and state transition logic for ReAct Loop Agent.

## ReAct Loop Design

ReAct: Reason + Act, an alternating decision-making pattern of reasoning and action.

In our Agent's ReAct Loop:

- **Act (Action)**: Output responses to users in a streaming manner
- **Reason (Reasoning)**: Make decisions or collect information through Tool calls

### Tool Categories

Our Tools are divided into two categories: internal and external.

#### Internal Tools

- **No configuration required**, directly injected during LLM calls
- **Purpose**: Extend and adjust the Agent's own context
  - Example: Load older chat history
  - Example: Query older Tool call information
  - Example: Load results from a historical Tool call
- **Invocation**: When calling LLM, internal tool calls may affect LLM context in non-standard ways
  - Example: Prepend historical messages
  - Example: Add pseudo Tool call rounds to insert results from historical Tool calls
- **History**: Internal tool calls are **not** added to historical Tool calls

#### External Tools

- **Requires configuration**: Configured when creating the Agent
- **Configuration includes**:
  - `name`: Tool name
  - `description`: Tool description (string)
  - `schema`: Parameter JSON Schema (string, serialized JSON Schema)
- **Execution**: Executed asynchronously in a `string in/string out` manner
- **Invocation**: When calling LLM, external tool calls are always inserted into LLM context in standard tool call format
  - One `assistant message` (containing tool call)
  - One `tool message` (containing tool call result)
- **History**: All external tool calls are added to historical Tool calls

## State Definition

### AgentState

The complete internal state of the Agent, including:

1. **Historical Messages** (`messages`)
   - Type: `AgentMessage[]`
   - Array sorted by timestamp, containing all user and assistant messages
   - Reuses `AgentMessage` type from `@agent-webui-protocol`

2. **External Tools** (`tools`)
   - Type: `Record<string /* name */, ToolDefinition>`
   - Contains all loaded external tool definitions
   - `ToolDefinition` includes:
     - `description`: `string` - Tool description
     - `schema`: `string` - Parameter JSON Schema (serialized JSON Schema string)

3. **Historical Tool Call Records** (`toolCalls`)
   - Type: `Record<string /* toolCallId */, ToolCallRecord>`
   - Contains historical records of all external tool calls
   - `ToolCallRecord` includes:
     - `name`: `string` - Tool name
     - `parameters`: `string` - Parameters (serialized as string)
     - `calledAt`: `number` - Call timestamp
     - `result`: `ToolCallSuccess | ToolCallFailed | null` - Call result
       - `ToolCallSuccess`: `{ isSuccess: true, content: string }`
       - `ToolCallFailed`: `{ isSuccess: false, error: string }`

4. **Current ReAct Loop Context** (`reActContext`)
   - `contextWindowSize`: `number` - Context window size, indicating how many recent messages should be included
   - `toolCallIds`: `string[]` - Involved Tool Calls (Tool Call Id list)

5. **Last LLM Invocation Timestamp** (`calledLlmAt`)
   - `number` - Timestamp of the latest ReAct observation (call-llm effect completion)

## Input Definition

### AgentInput

Inputs that the Agent state machine can receive, using Discriminated Union type:

1. **User Message Received** (`user-message-received`)
   - Triggered when user sends a message
   - Contains message content

2. **LLM Message Started** (`llm-message-started`)
   - Triggered when LLM begins streaming a user-visible message
   - Appends an `assistant` message with empty content

3. **LLM Message Completed** (`llm-message-completed`)
   - Triggered when LLM finishes streaming the message
   - Updates the corresponding `assistant` message content

4. **ReAct Observation (External)** (`re-act-observed`)
   - Triggered when the call-llm effect finishes
   - `calledLlmAt`: timestamp indicating when the corresponding call-llm started
   - `observation.type === "continue-re-act"`: carries tool calls to issue as `Record<string, ToolCallRequest>`
   - `observation.type === "complete-re-act"`: indicates the current ReAct Loop is completed and updates `calledLlmAt`

5. **Tool Call Result Received (External)** (`tool-call-completed`)
   - Triggered when an external tool call finishes
   - Contains success or failure result (`ToolCallResult`)

6. **Expand Context Window** (`context-window-expanded`)
   - Triggered when the current ReAct Loop context window needs to be expanded
   - The expansion increment is defined by the `expandContextWindowSize` parameter of the `agentTransition` function

7. **Load Historical Tool Call Results to Current ReAct Loop** (`history-tool-calls-added`)
   - Triggered when historical Tool Calls need to be added to current ReAct Loop context
   - Contains list of Tool Call IDs to add

## File Structure

The state machine is split into four key files:

```text
src/
  state.ts          # State type definitions (using zod schema)
  input.ts          # Input/Event type definitions (using zod schema)
  initial.ts        # initial function
  transition.ts     # transition function
  index.ts          # exports
```

## Type Definition Standards

- All types use **zod@^4** schemas for definition
- Export TypeScript types through `z.infer`
- Reuse data types and schemas from `@agent-webui-protocol`
- Follow Moorex code style standards

## Usage Examples

### Basic Usage

```typescript
import { createMoorex } from "@moora/moorex";
import { initialAgentState, agentTransition } from "@moora/agent-core-state-machine";

const moorex = createMoorex({
  initial: initialAgentState,
  transition: agentTransition,
  effectsAt: (state) => {
    // Side effect calculation logic
    return {};
  },
  runEffect: (effect, state, key) => {
    // Side effect execution logic
    return {
      start: async (dispatch) => {},
      cancel: () => {},
    };
  },
});
```

### Dispatching Events

```typescript
// Dispatch user message
moorex.dispatch({
  type: "user-message-received",
  messageId: "msg-1",
  content: "Hello, Agent!",
  timestamp: Date.now(),
});

// LLM starts streaming
moorex.dispatch({
  type: "llm-message-started",
  messageId: "msg-2",
  timestamp: Date.now(),
});

// Dispatch LLM message complete
moorex.dispatch({
  type: "llm-message-completed",
  messageId: "msg-2",
  content: "Hello!",
  timestamp: Date.now(),
});

// LLM decides to continue ReAct and issue Tool Calls
moorex.dispatch({
  type: "re-act-observed",
  timestamp: Date.now(),
  calledLlmAt: Date.now(),
  observation: {
    type: "continue-re-act",
    toolCalls: {
      "tool-1": {
        name: "search",
        parameters: JSON.stringify({ query: "example" }),
        calledAt: Date.now(),
      },
    },
  },
});

// Receive Tool Call result
moorex.dispatch({
  type: "tool-call-completed",
  toolCallId: "tool-1",
  result: {
    isSuccess: true,
    content: "Search results...",
    receivedAt: Date.now(),
  },
  timestamp: Date.now(),
});
```

### Accessing State

```typescript
// Get current state
const state = moorex.current();

// Access historical messages
const messages = state.messages;

// Access external tools
const tools = state.tools;

// Access historical Tool Calls
const toolCalls = state.toolCalls;

// Access current ReAct Loop context
const context = state.reActContext;
```

## API Reference

### Type Exports

#### State Types

- `AgentState` - Complete Agent state
- `ToolDefinition` - Tool definition
- `ToolCallRecord` - Tool Call record
- `ToolCallResult` - Tool Call result (success/failure)
- `ReActContext` - ReAct Loop context

#### Input Types

- `AgentInput` - Union type of all input types
- `UserMessageInput` - User message input
- `LlmChunkInput` - LLM chunk input
- `LlmMessageCompleteInput` - LLM message complete input
- `ToolCallStartedInput` - Tool Call started input
- `ToolCallResultInput` - Tool Call result input
- `ExpandContextWindowInput` - Expand context window input
- `AddToolCallsToContextInput` - Add Tool Calls to context input

### Schema Exports

All types have corresponding Zod schemas for runtime validation:

- `agentStateSchema` - Agent state schema
- `agentEventSchema` - Agent event schema
- `toolDefinitionSchema` - Tool definition schema
- `toolCallRecordSchema` - Tool Call record schema
- `reActContextSchema` - ReAct Loop context schema
- And more...

### Function Exports

- `initialAgentState()` - Returns initial state
- `agentTransition(input)` - State transition function
