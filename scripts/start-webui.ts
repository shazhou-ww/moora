#!/usr/bin/env bun

/**
 * 启动 Agent WebUI
 * 
 * Usage:
 *   bun run scripts/start-webui.ts [--type worker|coordinator] [--watch|-w]
 */

import { join } from "path";
import { $ } from "bun";

const args = process.argv.slice(2);
const watch = args.includes("--watch") || args.includes("-w");
const script = "dev";

// 获取 agent 类型参数
const typeIndex = args.indexOf("--type");
const agentType = typeIndex >= 0 ? args[typeIndex + 1] : "worker";

if (agentType !== "worker" && agentType !== "coordinator") {
  console.error(`❌ Invalid agent type: ${agentType}`);
  console.error(`   Supported types: worker, coordinator`);
  process.exit(1);
}

const rootDir = process.cwd();
const packageName = `webui-agent-${agentType}`;
const webuiDir = join(rootDir, "packages", packageName);

async function startWebUI() {
  try {
    console.log(`🚀 Starting Agent WebUI [${agentType.toUpperCase()}] (dev mode)...`);
    console.log(`📦 Package: @moora/${packageName}`);
    console.log(`📁 Directory: ${webuiDir}\n`);

    // 切换到 webui 目录并执行启动命令
    const originalCwd = process.cwd();
    process.chdir(webuiDir);

    try {
      await $`bun run ${script}`;
    } finally {
      process.chdir(originalCwd);
    }
  } catch (error: any) {
    const errorMessage = error?.stderr?.toString() || error?.message || "Unknown error";
    console.error(`❌ Failed to start webui: ${errorMessage}`);
    process.exit(1);
  }
}

startWebUI();

