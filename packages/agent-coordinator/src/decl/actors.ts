/**
 * Actors 类型和常量定义
 *
 * Actor 是 Agent 心智需要认知的行为体。
 */

export const USER = "user";
export const LLM = "llm";
export const WORKFORCE = "workforce";

export type Actors = typeof USER | typeof LLM | typeof WORKFORCE;
