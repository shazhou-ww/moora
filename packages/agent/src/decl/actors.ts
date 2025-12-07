/**
 * Actors 类型和常量定义
 *
 * Actor 是 Agent 心智需要认知的行为体。
 * 例如 User Actor 并不是真正的用户，而是用户在 Agent 认知中的投射。
 */

export const USER = "user";
export const LLM = "llm";
export const TOOLKIT = "toolkit";

export type Actors = typeof USER | typeof LLM | typeof TOOLKIT;
