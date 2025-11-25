#!/usr/bin/env bun

import { Command } from "commander";
import * as semver from "semver";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { $ } from "bun";
import {
  execCommand,
  getCurrentBranch,
  hasUncommittedChanges,
  commitChanges,
  createTag,
  getCurrentCommitHash,
  getTagCommitHash,
} from "./utils/git.ts";
import {
  getAllPackages,
  getRootPackageJson,
  getPackageJson,
  savePackageJson,
  findCircularDependencies,
} from "./utils/package.ts";
import { validateVersion, isValidPrereleaseVersion } from "./utils/version.ts";
import { getPublishedVersion } from "./utils/registry.ts";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  dim: "\x1b[2m",
};

// Color for check step titles (easy to change)
const CHECK_TITLE_COLOR: keyof typeof colors = "cyan";

// Helper function to create colored text
function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

const program = new Command();

program
  .name("moora-publish")
  .description("Moora monorepo publish management tool")
  .version("1.0.0");

// Command: prepare-version
program
  .command("prepare-version")
  .description("Prepare version for publishing")
  .argument("<type>", "Version bump type: major, minor, patch, prerelease")
  .option("--prerelease-id <id>", "Prerelease identifier (e.g., a, b, rc)")
  .action(async (type: string, options) => {
    try {
      console.log("🔍 Starting version preparation...\n");

      // Validate type
      if (!["major", "minor", "patch", "prerelease"].includes(type)) {
        throw new Error(
          `Invalid version type: ${type}. Must be one of: major, minor, patch, prerelease`
        );
      }

      // Step 1: Check git branch
      console.log("📌 Checking git branch...");
      const branch = await getCurrentBranch();
      if (branch !== "main") {
        throw new Error(`Must be on main branch. Current branch: ${branch}`);
      }
      console.log("✓ On main branch\n");

      // Step 2: Check for uncommitted changes
      console.log("📌 Checking for uncommitted changes...");
      if (await hasUncommittedChanges()) {
        throw new Error("There are uncommitted changes. Please commit or stash them first.");
      }
      console.log("✓ No uncommitted changes\n");

      // Step 3: Get current version
      const rootPkg = await getRootPackageJson();
      const currentVersion = rootPkg.version;
      console.log(`📌 Current version: ${currentVersion}`);

      // Step 4: Calculate new version
      let newVersion: string | null;
      if (type === "prerelease") {
        const prereleaseId = options.prereleaseId || "a";
        if (!/^[a-z]$/.test(prereleaseId)) {
          throw new Error("Prerelease ID must be a single lowercase letter");
        }
        
        // Check if current version is already a prerelease
        const prerelease = semver.prerelease(currentVersion);
        if (prerelease && prerelease.length >= 2) {
          // Increment prerelease number
          const [id, num] = prerelease;
          if (id === prereleaseId) {
            newVersion = semver.inc(currentVersion, "prerelease", prereleaseId);
          } else {
            // Different prerelease ID, start from 1
            const base = currentVersion.split("-")[0];
            newVersion = `${base}-${prereleaseId}1`;
          }
        } else {
          // First prerelease, bump patch and add prerelease
          const nextPatch = semver.inc(currentVersion, "patch");
          newVersion = `${nextPatch}-${prereleaseId}1`;
        }
      } else {
        newVersion = semver.inc(currentVersion, type as semver.ReleaseType);
      }

      if (!newVersion) {
        throw new Error(`Failed to calculate new version from ${currentVersion}`);
      }

      console.log(`📌 New version: ${newVersion}\n`);

      // Step 5: Run prepublish checks on all packages
      console.log("📌 Running prepublish checks...");
      await runPrepublishChecks(currentVersion, true);
      console.log("✓ All prepublish checks passed\n");

      // Step 6: Update all package versions
      console.log("📌 Updating package versions...");
      await updateAllPackageVersions(newVersion);
      console.log("✓ All package versions updated\n");

      // Step 7: Commit changes
      console.log("📌 Committing changes...");
      await commitChanges(`chore: bump version to ${newVersion}`);
      console.log("✓ Changes committed\n");

      // Step 8: Create version tag
      console.log("📌 Creating version tag...");
      await createTag(`v${newVersion}`, `Release version ${newVersion}`);
      console.log(`✓ Tag v${newVersion} created\n`);

      console.log(`✅ Version preparation complete! New version: ${newVersion}`);
      console.log(`\nNext steps:`);
      console.log(`  1. Review the changes`);
      console.log(`  2. Push to remote: git push && git push --tags`);
      console.log(`  3. Run publish: bun run publish`);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Command: prepublish
program
  .command("prepublish")
  .description("Run prepublish checks")
  .action(async () => {
    try {
      console.log("🔍 Running prepublish checks...\n");
      const rootPkg = await getRootPackageJson();
      const result = await runPrepublishChecks(rootPkg.version, false);
      if (result.skippedPackages.length > 0) {
        console.log("\n⚠️  Warning: Some packages will be skipped during publishing:");
        for (const skipped of result.skippedPackages) {
          console.log(
            `  - ${skipped.name}: version ${skipped.expectedVersion} is not greater than published ${skipped.publishedVersion}`
          );
        }
      }
      console.log("\n✅ All prepublish checks passed!");
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Command: publish
program
  .command("publish")
  .description("Publish all packages")
  .option("--dry-run", "Perform a dry run without actually publishing")
  .action(async (options) => {
    try {
      const isDryRun = options.dryRun || false;
      console.log(`🚀 Starting publish${isDryRun ? " (DRY RUN)" : ""}...\n`);

      // Run prepublish checks
      console.log("📌 Running prepublish checks...");
      const rootPkg = await getRootPackageJson();
      const checkResult = await runPrepublishChecks(rootPkg.version, false);
      if (checkResult.skippedPackages.length > 0) {
        console.log("\n⚠️  The following packages will be skipped during publishing:");
        for (const skipped of checkResult.skippedPackages) {
          console.log(
            `  - ${skipped.name}: version ${skipped.expectedVersion} is not greater than published ${skipped.publishedVersion}`
          );
        }
        console.log();
      }
      console.log("✓ All prepublish checks passed\n");

      // Get all packages
      const packages = await getAllPackages();
      const skippedPackageNames = new Set(
        checkResult.skippedPackages.map((p) => p.name)
      );
      const packagesToPublish = packages.filter(
        (pkg) => !skippedPackageNames.has(pkg.name)
      );

      if (packagesToPublish.length === 0) {
        console.log("⚠️  No packages to publish (all packages were skipped)\n");
        return;
      }

      console.log(
        `📌 Found ${packagesToPublish.length} package(s) to publish${packagesToPublish.length < packages.length ? ` (${packages.length - packagesToPublish.length} skipped)` : ""}\n`
      );

      // Publish each package
      for (const pkg of packagesToPublish) {
        console.log(`📦 Publishing ${pkg.name}@${pkg.version}...`);
        try {
          const originalCwd = process.cwd();
          process.chdir(pkg.path);
          try {
            const publishCmd = isDryRun
              ? $`npm publish --dry-run --access public`
              : $`npm publish --access public`;
            const result = await publishCmd.quiet();
            const output = result.stdout.toString();
            if (output.trim()) {
              console.log(output);
            }
            const stderr = result.stderr.toString();
            if (stderr.trim()) {
              console.log(stderr);
            }
          } finally {
            process.chdir(originalCwd);
          }
          console.log(`✓ ${pkg.name}@${pkg.version} published${isDryRun ? " (dry run)" : ""}\n`);
        } catch (error) {
          throw new Error(
            `Failed to publish ${pkg.name}: ${(error as Error).message}`
          );
        }
      }

      if (checkResult.skippedPackages.length > 0) {
        console.log(
          `\n✅ ${packagesToPublish.length} package(s) published successfully${isDryRun ? " (dry run)" : ""}!`
        );
        console.log(
          `⚠️  ${checkResult.skippedPackages.length} package(s) were skipped (version not greater than published version)`
        );
      } else {
        console.log(`\n✅ All packages published successfully${isDryRun ? " (dry run)" : ""}!`);
      }
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Type for skipped packages during registry check
type SkippedPackage = {
  name: string;
  expectedVersion: string;
  publishedVersion: string;
};

// Type for prepublish check results
type PrepublishCheckResult = {
  skippedPackages: SkippedPackage[];
};

// Helper function: Run prepublish checks
async function runPrepublishChecks(
  expectedVersion: string,
  skipRegistryCheck: boolean
): Promise<PrepublishCheckResult> {
  const packages = await getAllPackages();
  const skippedPackages: SkippedPackage[] = [];

  // Check 1: Version alignment
  console.log(colorize("  1. Checking version alignment...", CHECK_TITLE_COLOR));
  for (const pkg of packages) {
    if (pkg.version !== expectedVersion) {
      throw new Error(
        `Version mismatch: ${pkg.name} has version ${pkg.version}, expected ${expectedVersion}`
      );
    }
  }
  console.log("  ✓ All versions aligned\n");

  // Check 2: Inter-dependency versions
  console.log(colorize("  2. Checking inter-dependency versions...", CHECK_TITLE_COLOR));
  for (const pkg of packages) {
    const pkgJson = await getPackageJson(pkg.path);
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (depName.startsWith("@moora/")) {
        if (depVersion !== expectedVersion) {
          throw new Error(
            `Dependency version mismatch in ${pkg.name}: ${depName} has version ${depVersion}, expected ${expectedVersion}`
          );
        }
      }
    }
  }
  console.log("  ✓ All inter-dependency versions correct\n");

  // Check 3: Circular dependencies
  console.log(colorize("  3. Checking for circular dependencies...", CHECK_TITLE_COLOR));
  const circularDeps = await findCircularDependencies(packages);
  if (circularDeps.length > 0) {
    throw new Error(
      `Circular dependencies detected:\n${circularDeps.map((cycle: string[]) => `  - ${cycle.join(" -> ")}`).join("\n")}`
    );
  }
  console.log("  ✓ No circular dependencies\n");

  // Check 4: Version format validation
  console.log(colorize("  4. Validating version format...", CHECK_TITLE_COLOR));
  if (!validateVersion(expectedVersion)) {
    throw new Error(
      `Invalid version format: ${expectedVersion}. Must be standard semver (e.g., 0.1.2) or valid prerelease (e.g., 0.1.2-a1)`
    );
  }
  console.log("  ✓ Version format valid\n");

  // Check 5: Registry version comparison
  if (!skipRegistryCheck) {
    console.log(colorize("  5. Checking registry versions...", CHECK_TITLE_COLOR));
    for (const pkg of packages) {
      const publishedVersion = await getPublishedVersion(pkg.name);
      if (publishedVersion) {
        if (!semver.gt(expectedVersion, publishedVersion)) {
          // Don't throw error, just skip this package
          skippedPackages.push({
            name: pkg.name,
            expectedVersion,
            publishedVersion,
          });
          console.log(
            `    ⚠️  ${pkg.name}: Skipping (version ${expectedVersion} is not greater than published ${publishedVersion})`
          );
        } else {
          console.log(`    ${pkg.name}: ${publishedVersion} -> ${expectedVersion}`);
        }
      } else {
        console.log(`    ${pkg.name}: New package`);
      }
    }
    if (skippedPackages.length > 0) {
      console.log(
        `  ⚠️  ${skippedPackages.length} package(s) will be skipped during publishing\n`
      );
    } else {
      console.log("  ✓ All versions valid for publishing\n");
    }
  }

  // Check 6: Individual package prepublish checks
  console.log(colorize("  6. Running package prepublish checks...", CHECK_TITLE_COLOR));
  for (const pkg of packages) {
    const pkgJson = await getPackageJson(pkg.path);
    if (pkgJson.scripts?.prepublishOnly) {
      console.log(`    Running prepublishOnly for ${pkg.name}...`);
      try {
        const originalCwd = process.cwd();
        process.chdir(pkg.path);
        try {
          const result = await $`bun run prepublishOnly`.quiet();
          const output = result.stdout.toString();
          if (output.trim()) {
            console.log(output);
          }
          const stderr = result.stderr.toString();
          if (stderr.trim()) {
            console.log(stderr);
          }
        } finally {
          process.chdir(originalCwd);
        }
        console.log(`    ✓ ${pkg.name} prepublishOnly passed`);
      } catch (error) {
        throw new Error(
          `prepublishOnly failed for ${pkg.name}: ${(error as Error).message}`
        );
      }
    }
  }
  console.log("  ✓ All package checks passed\n");

  // Check 7: Uncommitted changes
  console.log(colorize("  7. Checking for uncommitted changes...", CHECK_TITLE_COLOR));
  if (await hasUncommittedChanges()) {
    throw new Error("There are uncommitted changes in the workspace");
  }
  console.log("  ✓ No uncommitted changes\n");

  // Check 8: Version tag exists and matches
  console.log(colorize("  8. Checking version tag...", CHECK_TITLE_COLOR));
  const tagName = `v${expectedVersion}`;
  const currentCommit = await getCurrentCommitHash();
  const tagCommit = await getTagCommitHash(tagName);

  if (!tagCommit) {
    throw new Error(`Tag ${tagName} does not exist`);
  }

  if (tagCommit !== currentCommit) {
    throw new Error(
      `Tag ${tagName} exists but points to a different commit.\nTag: ${tagCommit}\nCurrent: ${currentCommit}`
    );
  }
  console.log(`  ✓ Tag ${tagName} exists and matches current commit\n`);

  return { skippedPackages };
}

// Helper function: Update all package versions
async function updateAllPackageVersions(newVersion: string): Promise<void> {
  const packages = await getAllPackages();

  // Update root package
  const rootPkg = await getRootPackageJson();
  rootPkg.version = newVersion;
  await savePackageJson(join(process.cwd(), "package.json"), rootPkg);
  console.log(`  ✓ Updated root package to ${newVersion}`);

  // Update all packages
  for (const pkg of packages) {
    const pkgJson = await getPackageJson(pkg.path);

    // Update version
    pkgJson.version = newVersion;

    // Update dependencies
    if (pkgJson.dependencies) {
      for (const depName of Object.keys(pkgJson.dependencies)) {
        if (depName.startsWith("@moora/")) {
          pkgJson.dependencies[depName] = newVersion;
        }
      }
    }

    // Update devDependencies
    if (pkgJson.devDependencies) {
      for (const depName of Object.keys(pkgJson.devDependencies)) {
        if (depName.startsWith("@moora/")) {
          pkgJson.devDependencies[depName] = newVersion;
        }
      }
    }

    await savePackageJson(join(pkg.path, "package.json"), pkgJson);
    console.log(`  ✓ Updated ${pkg.name} to ${newVersion}`);
  }
}

program.parse();
