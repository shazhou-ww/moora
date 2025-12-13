/**
 * Stream Manager 测试
 */

import { describe, it, expect } from "vitest";

import { createStreamManager } from "../src";

describe("StreamManager", () => {
  it("should start and end a stream", () => {
    const manager = createStreamManager();

    manager.startStream("test-message");
    expect(manager.isActive("test-message")).toBe(true);
    expect(manager.getContent("test-message")).toBe("");

    manager.endStream("test-message", "final content");
    expect(manager.isActive("test-message")).toBe(false);
    expect(manager.getContent("test-message")).toBe("final content");
  });

  it("should append chunks to a stream", () => {
    const manager = createStreamManager();

    manager.startStream("test-message");
    manager.appendChunk("test-message", "Hello ");
    manager.appendChunk("test-message", "World");

    expect(manager.getContent("test-message")).toBe("Hello World");
  });

  it("should handle non-existent streams gracefully", () => {
    const manager = createStreamManager();

    expect(manager.isActive("non-existent")).toBe(false);
    expect(manager.getContent("non-existent")).toBe(null);

    // These should not throw
    manager.appendChunk("non-existent", "chunk");
    manager.endStream("non-existent", "content");
  });

  it("should handle SSE subscriptions", () => {
    const manager = createStreamManager();

    manager.startStream("test-message");
    manager.appendChunk("test-message", "test chunk");

    const connection = {
      queue: [] as string[],
      resolve: null as (() => void) | null,
      closed: false,
    };

    const unsubscribe = manager.subscribe("test-message", connection);

    expect(unsubscribe).not.toBe(null);
    expect(connection.queue.length).toBeGreaterThan(0);

    // Cleanup
    if (unsubscribe) {
      unsubscribe();
    }
  });
});