#!/usr/bin/env bun

/**
 * Lint packages script
 * Runs ESLint on all packages that have source code
 */

import { execSync } from 'child_process';
import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const packagesDir = join(import.meta.dir, '..', 'packages');

function getPackages() {
  return readdirSync(packagesDir)
    .map(name => join(packagesDir, name))
    .filter(dir => {
      const packageJsonPath = join(dir, 'package.json');
      const srcDir = join(dir, 'src');
      return existsSync(packageJsonPath) && statSync(srcDir).isDirectory();
    });
}

function runLint(packageDir: string, args: string[]) {
  const packageName = packageDir.split('/').pop()!;
  console.log(`Linting ${packageName}...`);

  try {
    // Run ESLint with the package's own config
    const eslintCommand = `bunx eslint src ${args.join(' ')}`;
    execSync(eslintCommand, {
      cwd: packageDir,
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    console.error(`ESLint failed for ${packageName}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const packages = getPackages();

  let hasErrors = false;

  for (const packageDir of packages) {
    if (!runLint(packageDir, args)) {
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log('All packages linted successfully!');
}

if (import.meta.main) {
  main();
}