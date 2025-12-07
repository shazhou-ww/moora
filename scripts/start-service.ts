#!/usr/bin/env bun

/**
 * 启动 Agent Service
 * 
 * 从根目录运行以避免 bun --watch 在 monorepo 中的警告
 */

import { join } from "path";
import { $ } from "bun";

const args = process.argv.slice(2);
const watch = args.includes("--watch") || args.includes("-w");

const rootDir = process.cwd();
const serviceEntry = join(rootDir, "packages", "agent-service", "src", "index.ts");

async function startService() {
  try {
    console.log(`🚀 Starting Agent Service (${watch ? "watch" : "production"} mode)...`);
    console.log(`📦 Package: @moora/agent-service`);
    console.log(`📁 Entry: ${serviceEntry}\n`);

    // 从根目录运行，这样所有 workspace 包都在项目目录内
    if (watch) {
      await $`bun run --watch ${serviceEntry}`;
    } else {
      await $`bun run ${serviceEntry}`;
    }
  } catch (error: any) {
    const errorMessage = error?.stderr?.toString() || error?.message || "Unknown error";
    console.error(`❌ Failed to start service: ${errorMessage}`);
    process.exit(1);
  }
}

startService();