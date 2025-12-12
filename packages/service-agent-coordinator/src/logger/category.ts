/**
 * 分类 Logger 创建
 */

import type pino from "pino";

import type { CategoryLogger, LogCategory, LogLevel } from "./types";

/**
 * 创建分类 Logger
 *
 * @param category - 日志类别
 * @param baseLogger - 基础 pino logger
 * @returns 分类 Logger
 */
export function createCategoryLogger(
  category: LogCategory,
  baseLogger: pino.Logger
): CategoryLogger {
  const childLogger = baseLogger.child({ category });

  const logMethod =
    (level: LogLevel) =>
    (msg: string, data?: Record<string, unknown>) => {
      if (data) {
        childLogger[level](data, msg);
      } else {
        childLogger[level](msg);
      }
    };

  return {
    trace: logMethod("trace"),
    debug: logMethod("debug"),
    info: logMethod("info"),
    warn: logMethod("warn"),
    error: logMethod("error"),
    fatal: logMethod("fatal"),
    child: (bindings: Record<string, unknown>) =>
      createCategoryLogger(category, childLogger.child(bindings)),
  };
}
