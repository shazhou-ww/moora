#!/usr/bin/env bun

/**
 * 启动 Agent WebUI
 */

import { join } from "path";
import { $ } from "bun";

const args = process.argv.slice(2);
const watch = args.includes("--watch") || args.includes("-w");
const script = "dev";

const rootDir = process.cwd();
const webuiDir = join(rootDir, "packages", "webui-agent-worker");

async function startWebUI() {
  try {
    console.log(`🚀 Starting Agent WebUI (dev mode)...`);
    console.log(`📦 Package: @moora/webui-agent-worker`);
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

