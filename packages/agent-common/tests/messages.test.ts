/**
 * @moora/agent-common 测试
 */

import { describe, it, expect } from "vitest";
import {
  baseMessageSchema,
  userMessageSchema,
  assiMessageSchema,
  assiMessageStreamingSchema,
  assiMessageCompletedSchema,
} from "../src";

describe("@moora/agent-common", () => {
  describe("Message Schemas", () => {
    it("should validate baseMessageSchema", () => {
      const validMessage = { id: "1", timestamp: Date.now() };
      expect(baseMessageSchema.parse(validMessage)).toEqual(validMessage);
    });

    it("should validate userMessageSchema", () => {
      const validMessage = {
        id: "1",
        timestamp: Date.now(),
        role: "user" as const,
        content: "Hello",
      };
      expect(userMessageSchema.parse(validMessage)).toEqual(validMessage);
    });

    it("should validate assiMessageStreamingSchema", () => {
      const validMessage = {
        id: "1",
        timestamp: Date.now(),
        role: "assistant" as const,
        streaming: true as const,
      };
      expect(assiMessageStreamingSchema.parse(validMessage)).toEqual(validMessage);
    });

    it("should validate assiMessageCompletedSchema", () => {
      const validMessage = {
        id: "1",
        timestamp: Date.now(),
        role: "assistant" as const,
        streaming: false as const,
        content: "Hello",
      };
      expect(assiMessageCompletedSchema.parse(validMessage)).toEqual(validMessage);
    });

    it("should validate assiMessageSchema (discriminated union)", () => {
      const streamingMessage = {
        id: "1",
        timestamp: Date.now(),
        role: "assistant" as const,
        streaming: true as const,
      };
      const completedMessage = {
        id: "2",
        timestamp: Date.now(),
        role: "assistant" as const,
        streaming: false as const,
        content: "Hello",
      };
      expect(assiMessageSchema.parse(streamingMessage)).toEqual(streamingMessage);
      expect(assiMessageSchema.parse(completedMessage)).toEqual(completedMessage);
    });
  });
});
