/**
 * Logger 实例创建和管理
 */

import { createBaseLogger } from "./base";
import { createCategoryLogger } from "./category";
import type { CategoryLogger, LogCategory, Logger, LoggerOptions } from "./types";

/**
 * 创建 Logger 实例
 *
 * @param options - Logger 配置选项
 * @returns Logger 实例
 *
 * @example
 * ```typescript
 * import { createLogger } from '@moora/service-agent-worker/logger';
 *
 * const logger = createLogger({ level: 'debug' });
 *
 * // 使用分类日志
 * logger.agent.info('Agent initialized');
 * logger.llm.debug('Calling OpenAI', { model: 'gpt-4' });
 * logger.stream.error('Stream error', { error: 'timeout' });
 *
 * // 动态获取类别
 * logger.category('server').info('Server started');
 *
 * // 创建子 logger
 * const reqLogger = logger.server.child({ requestId: '123' });
 * reqLogger.info('Handling request');
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const baseLogger = createBaseLogger(options);

  const categoryLoggers = new Map<LogCategory, CategoryLogger>();

  const getOrCreateCategoryLogger = (category: LogCategory): CategoryLogger => {
    let logger = categoryLoggers.get(category);
    if (!logger) {
      logger = createCategoryLogger(category, baseLogger);
      categoryLoggers.set(category, logger);
    }
    return logger;
  };

  return {
    category: getOrCreateCategoryLogger,
    raw: baseLogger,
    agent: getOrCreateCategoryLogger("agent"),
    llm: getOrCreateCategoryLogger("llm"),
    toolkit: getOrCreateCategoryLogger("toolkit"),
    stream: getOrCreateCategoryLogger("stream"),
    server: getOrCreateCategoryLogger("server"),
    output: getOrCreateCategoryLogger("output"),
    general: getOrCreateCategoryLogger("general"),
  };
}

/**
 * 默认 Logger 实例（单例）
 */
let defaultLogger: Logger | null = null;

/**
 * 获取默认 Logger 实例
 *
 * @returns 默认 Logger 实例
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = createLogger();
  }
  return defaultLogger;
}

/**
 * 设置默认 Logger 实例
 *
 * @param logger - Logger 实例
 */
export function setLogger(logger: Logger): void {
  defaultLogger = logger;
}
