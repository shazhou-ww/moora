# @moora/agent-common

Common types and schemas shared between agent packages (`@moora/agent-starter` and `@moora/agent-worker`).

## Overview

This package provides:

- **Message Types**: Common message schemas and types used across agent implementations
- **CallLlm Types**: Abstraction layer types for LLM invocation

## Installation

```bash
bun add @moora/agent-common
```

## Types

### Message Types

```typescript
import {
  BaseMessage,
  UserMessage,
  AssiMessage,
  AssiMessageStreaming,
  AssiMessageCompleted,
  baseMessageSchema,
  userMessageSchema,
  assiMessageSchema,
  assiMessageStreamingSchema,
  assiMessageCompletedSchema,
} from "@moora/agent-common";
```

### CallLlm Types

```typescript
import {
  CallLlmMessage,
  CallLlmScenario,
  CallLlmToolDefinition,
  CallLlmToolCall,
  CallLlmContext,
  CallLlmCallbacks,
  CallLlm,
} from "@moora/agent-common";
```

## License

MIT
