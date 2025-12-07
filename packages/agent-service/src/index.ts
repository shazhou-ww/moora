/**
 * @moora/agent-service
 *
 * Agent Service 启动入口
 */

import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

// 从当前文件位置加载 .env 文件
// 优先加载 packages/agent-service/.env，如果不存在则加载根目录 .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageEnvPath = join(__dirname, "..", ".env");
const rootEnvPath = join(__dirname, "..", "..", "..", ".env");

if (existsSync(packageEnvPath)) {
  config({ path: packageEnvPath });
} else if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
}

import { createService } from "./server/create";
import { createLogger, getLogger, setLogger } from "./logger";

// 导出 logger 模块
export { createLogger, getLogger, setLogger };
export type { Logger, CategoryLogger, LogCategory, LogLevel, LoggerOptions } from "./logger";

// 创建 logger 实例
const logger = createLogger({
  level: (process.env.LOG_LEVEL as "trace" | "debug" | "info" | "warn" | "error" | "fatal") || "info",
});
setLogger(logger);

// 从环境变量读取配置
const llmEndpointUrl = process.env.LLM_ENDPOINT_URL || "https://api.openai.com/v1";
const llmApiKey = process.env.LLM_API_KEY;
const llmModel = process.env.LLM_MODEL || "gpt-4";
const systemPrompt = process.env.SYSTEM_PROMPT || "You are a helpful assistant.";
const port = parseInt(process.env.PORT || "3000", 10);

// 验证必需的环境变量
if (!llmApiKey) {
  logger.server.fatal("LLM_API_KEY environment variable is required");
  process.exit(1);
}

// 创建并启动服务
const app = createService({
  openai: {
    endpoint: {
      url: llmEndpointUrl,
      key: llmApiKey,
    },
    model: llmModel,
  },
  prompt: systemPrompt,
});

app.listen(port, () => {
  logger.server.info(`Agent Service is running on http://localhost:${port}`);
});

