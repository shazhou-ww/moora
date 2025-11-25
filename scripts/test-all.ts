#!/usr/bin/env bun

import { getAllPackages } from './utils/package.ts';
import { join } from 'path';
import { $ } from 'bun';

const command = process.argv[2] || 'test';

async function runTestsForAllPackages() {
  try {
    const packages = await getAllPackages();
    
    if (packages.length === 0) {
      console.log('No packages found');
      return;
    }

    console.log(`Found ${packages.length} package(s)\n`);

    for (const pkg of packages) {
      console.log(`Running ${command} for ${pkg.name}...`);
      
      const packagePath = pkg.path;
      const packageJsonPath = join(packagePath, 'package.json');
      
      // Check if package has the test command
      const packageJson = await Bun.file(packageJsonPath).json();
      const scripts = packageJson.scripts || {};
      
      if (!scripts[command] && !scripts['test']) {
        console.log(`⚠️  ${pkg.name} does not have a "${command}" script, skipping\n`);
        continue;
      }

      try {
        // Execute the command in the package directory
        const originalCwd = process.cwd();
        process.chdir(packagePath);
        
        try {
          const result = await $`bun run ${command}`.quiet();
          const output = result.stdout.toString();
          if (output.trim()) {
            console.log(output);
          }
          const stderr = result.stderr.toString();
          if (stderr.trim()) {
            console.error(stderr);
          }
          console.log(`✓ ${pkg.name} ${command} completed\n`);
        } finally {
          process.chdir(originalCwd);
        }
      } catch (error: any) {
        const errorMessage = error?.stderr?.toString() || error?.message || 'Unknown error';
        console.error(`❌ ${pkg.name} ${command} failed: ${errorMessage}\n`);
        process.exit(1);
      }
    }

    console.log(`✅ All packages ${command} completed successfully!`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

runTestsForAllPackages();

