/**
 * 创建基础 Pino Logger
 */

import pino from "pino";
import type { LogLevel, LoggerOptions } from "./types";

/**
 * 创建基础 Pino logger
 *
 * @param options - Logger 配置选项
 * @returns Pino logger 实例
 */
export function createBaseLogger(options: LoggerOptions = {}): pino.Logger {
  const {
    level = (process.env.LOG_LEVEL as LogLevel) || "info",
    pretty = process.env.NODE_ENV !== "production",
    logFile = process.env.LOG_FILE,
    errorLogFile = process.env.ERROR_LOG_FILE,
  } = options;

  // 构建 transport targets
  const targets: pino.TransportTargetOptions[] = [];

  // 控制台输出
  if (pretty) {
    targets.push({
      target: "pino-pretty",
      level,
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    });
  } else {
    targets.push({
      target: "pino/file",
      level,
      options: { destination: 1 }, // stdout
    });
  }

  // 日志文件输出（所有级别）
  if (logFile) {
    targets.push({
      target: "pino/file",
      level,
      options: { destination: logFile, mkdir: true },
    });
  }

  // 错误日志文件输出（仅 error 和 fatal）
  if (errorLogFile) {
    targets.push({
      target: "pino/file",
      level: "error",
      options: { destination: errorLogFile, mkdir: true },
    });
  }

  return pino({
    level,
    transport: { targets },
    base: {
      service: "service-agent-worker",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
