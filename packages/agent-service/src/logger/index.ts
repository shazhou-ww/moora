/**
 * Logger 模块
 *
 * 基于 Pino 的日志系统，支持分类、级别过滤、文件输出
 *
 * @example
 * ```typescript
 * import { getLogger, createLogger, setLogger } from '@moora/agent-service/logger';
 *
 * // 使用默认 logger
 * const logger = getLogger();
 * logger.llm.info('LLM call', { model: 'gpt-4' });
 *
 * // 自定义 logger
 * const customLogger = createLogger({
 *   level: 'debug',
 *   logFile: 'logs/app.log',
 * });
 * setLogger(customLogger);
 * ```
 */

// 导出类型
export type {
  LogCategory,
  LogLevel,
  LoggerOptions,
  CategoryLogger,
  Logger,
} from "./types";

// 导出函数
export { createLogger, getLogger, setLogger } from "./create";
export { createBaseLogger } from "./base";
export { createCategoryLogger } from "./category";
