# @moora/stream-manager

A stream manager for handling streaming messages and SSE connections in Moora agent services.

## Features

- Manages streaming message connections and chunk accumulation
- Provides SSE (Server-Sent Events) support for real-time updates
- Handles connection timeouts and cleanup
- Thread-safe message buffering

## Usage

```typescript
import { createStreamManager } from "@moora/stream-manager";

const streamManager = createStreamManager();

// Start a stream
streamManager.startStream("message-123");

// Append chunks
streamManager.appendChunk("message-123", "Hello ");
streamManager.appendChunk("message-123", "World!");

// End the stream
streamManager.endStream("message-123", "Hello World!");
```

## API

### `createStreamManager(timeoutMs?: number): StreamManager`

Creates a new stream manager instance.

- `timeoutMs`: Optional timeout in milliseconds (default: 5 minutes)

### StreamManager Methods

- `startStream(messageId: string)`: Start a new streaming message
- `appendChunk(messageId: string, chunk: string)`: Append a chunk to a stream
- `endStream(messageId: string, finalContent: string)`: End a stream with final content
- `subscribe(messageId: string, connection: SSEConnection)`: Subscribe to stream updates
- `getContent(messageId: string): string | null`: Get current stream content
- `isActive(messageId: string): boolean`: Check if stream is active

## Types

```typescript
interface SSEConnection {
  queue: string[];
  resolve: (() => void) | null;
  closed: boolean;
}

interface StreamConnection {
  messageId: string;
  content: string;
  pubsub: {
    sub: (callback: (data: string) => void) => CancelFn;
    pub: (data: string) => void;
  };
  isActive: boolean;
  timeoutId: NodeJS.Timeout | null;
}
```

## License

MIT