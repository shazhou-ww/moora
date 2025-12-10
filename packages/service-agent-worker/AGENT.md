# Agent Service - Coding Agent 指南

本文档为 Coding Agent 提供开发 `@moora/service-agent-worker` 时的指导规范。

## 架构

Agent Service 使用 `@moora/agent-worker` 的 `automata` 实现。

### 输出类型

每次状态更新会输出 `AgentUpdatePack`：

```typescript
type AgentUpdatePack = {
  prev: { state: AgentState; input: AgentInput } | null; // null 表示初始状态
  state: AgentState; // 当前状态
};
```

### 副作用执行

副作用（output functions）在 `createAgent` 内部自动执行，subscribe 只需处理日志：

```typescript
// subscribe 只需记录日志，副作用已自动执行
agent.subscribe((_dispatch) => (update) => {
  logger.debug("State update", formatUpdateLog(update));
});
```

日志格式：

- **初始状态**: `{ type: "initial", userMessagesCount, assiMessagesCount, cutOff }`
- **状态变化**: `{ inputType, inputId, prevUserMessagesCount, currUserMessagesCount, ... }`

### 分析状态变化

```bash
# 查看所有 agent 状态更新
cat logs/service-agent-worker.log | jq 'select(.category == "agent")' | pino-pretty

# 按 input 类型过滤
cat logs/service-agent-worker.log | jq 'select(.inputType == "send-user-message")' | pino-pretty

# 查看 cutOff 变化
cat logs/service-agent-worker.log | jq 'select(.category == "agent" and .prevCutOff != .currCutOff)' | pino-pretty
```

## 日志系统

本项目使用 **Pino** 作为日志库。所有日志应通过统一的 Logger 模块输出。

### 使用方法

```typescript
import { getLogger } from "@moora/service-agent-worker";

const logger = getLogger();

// 使用预定义的类别 logger
logger.agent.info("Agent initialized");
logger.llm.debug("Calling LLM", { model: "gpt-4", tokens: 1000 });
logger.stream.warn("Stream slow", { delay: 500 });
logger.server.error("Request failed", { status: 500, path: "/api" });
logger.output.trace("Output processed");

// 带有额外数据
logger.llm.info("LLM response received", {
  model: "gpt-4",
  promptTokens: 100,
  completionTokens: 200,
  latency: 1500,
});

// 创建子 logger（自动继承 category）
const reqLogger = logger.server.child({ requestId: "abc-123" });
reqLogger.info("Handling request");
reqLogger.debug("Request body parsed", { size: 1024 });
```

### 日志类别

| 类别      | 用途                           |
| --------- | ------------------------------ |
| `agent`   | Agent 核心逻辑、状态变化       |
| `llm`     | LLM API 调用、响应、token 统计 |
| `stream`  | SSE 流处理、chunk 传输         |
| `server`  | HTTP 服务器、路由、中间件      |
| `output`  | 输出处理、消息发送             |
| `general` | 通用日志                       |

### 日志级别

按严重程度从低到高：

1. `trace` - 最详细的调试信息
2. `debug` - 调试信息
3. `info` - 一般信息（默认级别）
4. `warn` - 警告
5. `error` - 错误
6. `fatal` - 致命错误

### 环境变量

- `LOG_LEVEL` - 设置日志级别，默认 `info`
- `NODE_ENV` - 设置为 `production` 时禁用 pretty 格式化
- `LOG_FILE` - 日志文件路径，设置后所有日志会同时写入该文件
- `ERROR_LOG_FILE` - 错误日志文件路径，设置后 error/fatal 级别会写入该文件

### 日志文件配置示例

```bash
# .env 文件
LOG_LEVEL=debug
LOG_FILE=logs/service-agent-worker.log
ERROR_LOG_FILE=logs/service-agent-worker-error.log
```

```typescript
// 代码中配置
import { createLogger, setLogger } from "@moora/service-agent-worker";

const logger = createLogger({
  level: "debug",
  logFile: "logs/service-agent-worker.log",
  errorLogFile: "logs/service-agent-worker-error.log",
});
setLogger(logger);
```

### 日志分析

使用 `pino-pretty` 在开发时格式化输出：

```bash
# 开发模式自动启用 pretty 输出
bun run dev

# 生产模式输出 JSON，可用管道过滤
bun run start | pino-pretty

# 按类别过滤（使用 jq）
bun run start 2>&1 | jq 'select(.category == "llm")'

# 按级别过滤
bun run start 2>&1 | jq 'select(.level >= 40)'  # warn 及以上

# 按时间范围过滤
bun run start 2>&1 | jq 'select(.time >= "2024-01-01T00:00:00")'
```

### 最佳实践

1. **始终使用类别 logger** - 不要使用 `console.log`
2. **结构化数据** - 将数据作为第二参数传入，便于过滤和分析
3. **适当的级别** - 生产环境用 `info`，调试用 `debug`
4. **子 logger** - 处理请求时创建带 `requestId` 的子 logger
5. **敏感信息** - 不要记录 API 密钥、用户密码等敏感信息

### 示例：LLM 调用日志

```typescript
const logger = getLogger();

async function callLLM(messages: Message[]) {
  const startTime = Date.now();

  logger.llm.debug("Starting LLM call", {
    messageCount: messages.length,
    model: config.model,
  });

  try {
    const response = await openai.chat.completions.create({ ... });

    logger.llm.info("LLM call completed", {
      model: config.model,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      latency: Date.now() - startTime,
    });

    return response;
  } catch (error) {
    logger.llm.error("LLM call failed", {
      error: error instanceof Error ? error.message : String(error),
      latency: Date.now() - startTime,
    });
    throw error;
  }
}
```
