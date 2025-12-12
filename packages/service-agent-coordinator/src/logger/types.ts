/**
 * Logger 类型定义
 */

/**
 * 日志类别
 */
export type LogCategory =
  | "agent" // Agent 核心逻辑
  | "llm" // LLM 调用
  | "toolkit" // Toolkit 工具调用
  | "stream" // 流处理
  | "server" // HTTP 服务器
  | "output" // 输出处理
  | "general"; // 通用日志

/**
 * 日志级别
 */
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Logger 配置选项
 */
export interface LoggerOptions {
  /** 最低日志级别，默认 'info' */
  level?: LogLevel;
  /** 是否启用 pretty 格式化（开发模式），默认根据 NODE_ENV 判断 */
  pretty?: boolean;
  /** 要过滤的类别，只有这些类别的日志会输出 */
  categories?: LogCategory[];
  /** 日志文件路径，设置后会同时写入文件 */
  logFile?: string;
  /** 错误日志文件路径，设置后 error/fatal 级别会写入该文件 */
  errorLogFile?: string;
}

/**
 * 分类 Logger 包装器
 */
export interface CategoryLogger {
  trace: (msg: string, data?: Record<string, unknown>) => void;
  debug: (msg: string, data?: Record<string, unknown>) => void;
  info: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, data?: Record<string, unknown>) => void;
  fatal: (msg: string, data?: Record<string, unknown>) => void;
  /** 创建子 logger，继承当前类别 */
  child: (bindings: Record<string, unknown>) => CategoryLogger;
}

/**
 * Logger 管理器
 */
export interface Logger {
  /** 获取指定类别的 logger */
  category: (category: LogCategory) => CategoryLogger;
  /** 获取基础 pino logger（用于高级用例） */
  raw: import("pino").Logger;
  /** Agent 日志 */
  agent: CategoryLogger;
  /** LLM 日志 */
  llm: CategoryLogger;
  /** Stream 日志 */
  stream: CategoryLogger;
  /** Server 日志 */
  server: CategoryLogger;
  /** Output 日志 */
  output: CategoryLogger;
  /** Toolkit 日志 */
  toolkit: CategoryLogger;
  /** 通用日志 */
  general: CategoryLogger;
}
