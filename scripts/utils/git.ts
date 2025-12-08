import { $ } from "bun";

/**
 * Execute a shell command and return the output
 * Splits the command string into command and arguments for proper execution
 */
export async function execCommand(command: string): Promise<string> {
  try {
    // Use shell to execute the command string for proper cross-platform support
    // On Windows, use cmd /c, on Unix use sh -c
    const isWindows = process.platform === "win32";
    const shell = isWindows ? "cmd" : "sh";
    const shellArg = isWindows ? "/c" : "-c";

    const proc = Bun.spawn([shell, shellArg, command], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: process.cwd(),
    });

    const output = await new Response(proc.stdout).text();
    const errorOutput = await new Response(proc.stderr).text();

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new Error(errorOutput || `Command failed with exit code ${exitCode}`);
    }

    return output.trim();
  } catch (error: any) {
    throw new Error(error.message || "Command execution failed");
  }
}

/**
 * Get the current git branch
 */
export async function getCurrentBranch(): Promise<string> {
  return execCommand("git rev-parse --abbrev-ref HEAD");
}

/**
 * Check if there are uncommitted changes
 */
export async function hasUncommittedChanges(): Promise<boolean> {
  const status = await execCommand("git status --porcelain");
  return status.length > 0;
}

/**
 * Commit all changes with a message
 */
export async function commitChanges(message: string): Promise<void> {
  await execCommand(`git add .`);
  // Escape double quotes in the message for shell compatibility
  const escapedMessage = message.replace(/"/g, '\\"');
  await execCommand(`git commit -m "${escapedMessage}"`);
}

/**
 * Create a git tag
 */
export async function createTag(
  tagName: string,
  message: string
): Promise<void> {
  await execCommand(`git tag -a ${tagName} -m "${message}"`);
}

/**
 * Get the current commit hash
 */
export async function getCurrentCommitHash(): Promise<string> {
  return execCommand("git rev-parse HEAD");
}

/**
 * Get the commit hash that a tag points to
 */
export async function getTagCommitHash(tagName: string): Promise<string | null> {
  try {
    return await execCommand(`git rev-list -n 1 ${tagName}`);
  } catch {
    return null;
  }
}

/**
 * Check if a tag exists
 */
export async function tagExists(tagName: string): Promise<boolean> {
  try {
    await execCommand(`git rev-parse ${tagName}`);
    return true;
  } catch {
    return false;
  }
}
