# Moora Monorepo

A monorepo structure for managing multiple related packages under the `@moora` scope.

## Packages

| Package | Description |
|---------|-------------|
| [@moora/effects](./packages/effects) | Lightweight effect system for stateful computations |
| [@moora/automata](./packages/automata) | State machine library based on Mealy Machine |
| [@moora/agent-worker](./packages/agent-worker) | Complete agent implementation with reaction factories |
| [@moora/toolkit](./packages/toolkit) | Tool management for LLM agents |
| [@moora/tools-tavily](./packages/tools-tavily) | Tavily web search tool integration |
| [@moora/service-agent-worker](./packages/service-agent-worker) | ElysiaJS-based agent service with SSE |
| [@moora/webui-agent-worker](./packages/webui-agent-worker) | React-based agent web UI |
| [@moora/agent-starter](./packages/agent-starter) | Starter template for building agents |

## Quick Start

```bash
# Install dependencies
bun install

# Start the agent service
bun run start:service

# Start the web UI (in another terminal)
bun run start:webui
```

## Structure

```
moora/
├── packages/           # All publishable packages
│   ├── effects/       # @moora/effects - Effect system
│   ├── automata/      # @moora/automata - State machine
│   ├── agent-worker/  # @moora/agent-worker - Agent core
│   ├── toolkit/       # @moora/toolkit - Tool management
│   ├── tools-tavily/  # @moora/tools-tavily - Tavily tools
│   ├── service-agent-worker/ # @moora/service-agent-worker - Backend service
│   ├── webui-agent-worker/   # @moora/webui-agent-worker - Frontend UI
│   └── agent-starter/ # @moora/agent-starter - Template
├── scripts/           # Management scripts
│   ├── publish.ts     # Version and publish management
│   └── utils/         # Utility functions
├── docs/              # Documentation
├── package.json       # Root package (not published)
└── README.md
```

## Package Management

All packages under `packages/` are scoped as `@moora/package-name` and share the same version number as the root package.

### TypeScript Path Mapping

For packages to reference each other, the root `tsconfig.json` includes path mappings:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@moora/core": ["./packages/core"]
      // Add more packages here as needed
    }
  }
}
```

Each package's `package.json` is configured for Bun:
- `module`: Points to TypeScript source (`./src/index.ts`) for Bun's native TypeScript support
- `main`: Points to compiled JavaScript (`./dist/index.js`) for Node.js compatibility
- `exports.bun`: Tells Bun to use the source directly

**Important:** When adding a new package, you must update the `paths` configuration in the root `tsconfig.json`. See [docs/ADDING_PACKAGES.md](docs/ADDING_PACKAGES.md) for details.

### Version Management

All packages in the monorepo maintain strict version alignment:
- All packages share the same version as the root package
- Inter-package dependencies use exact versions (no ranges)
- Version bumps are coordinated across all packages

## Scripts

### Prepare Version

Prepare a new version for publishing:

```bash
# Bump major version (1.0.0 -> 2.0.0)
bun run prepare-version major

# Bump minor version (1.0.0 -> 1.1.0)
bun run prepare-version minor

# Bump patch version (1.0.0 -> 1.0.1)
bun run prepare-version patch

# Create prerelease version (1.0.0 -> 1.0.1-a1)
bun run prepare-version prerelease --prerelease-id a

# Increment prerelease (1.0.1-a1 -> 1.0.1-a2)
bun run prepare-version prerelease --prerelease-id a
```

**What it does:**
1. Verifies you're on the `main` branch
2. Checks for uncommitted changes
3. Calculates the new version
4. Runs prepublish checks on all packages
5. Updates version in all packages and dependencies
6. Commits the changes
7. Creates a version tag (e.g., `v0.1.0`)

**After running:**
```bash
git push && git push --tags
```

### Prepublish Checks

Run comprehensive checks before publishing:

```bash
bun run prepublish
```

**Checks performed:**
1. ✓ Version alignment across all packages
2. ✓ Inter-dependency version correctness
3. ✓ No circular dependencies
4. ✓ Version format validation (standard semver or strict prerelease)
5. ✓ Registry version comparison (new version > published version)
6. ✓ Individual package `prepublishOnly` scripts pass
7. ✓ No uncommitted changes in workspace
8. ✓ Version tag exists and matches current commit

### Publish

Publish all packages to npm:

```bash
# Dry run (test without publishing)
bun run publish:dry-run

# Actual publish
bun run publish
```

**What it does:**
1. Runs all prepublish checks
2. Publishes each package to npm with public access
3. Reports success/failure for each package

## Version Format Rules

### Standard Versions
- Format: `MAJOR.MINOR.PATCH` (e.g., `0.1.0`, `1.2.3`)
- Follows semantic versioning

### Prerelease Versions
- Format: `MAJOR.MINOR.PATCH-[a-z][1-9]\d*` (e.g., `0.1.0-a1`, `1.2.3-b15`)
- Must have exactly one lowercase letter followed by a positive integer
- Examples:
  - ✓ Valid: `0.1.0-a1`, `1.0.0-b2`, `2.1.3-z99`
  - ✗ Invalid: `0.1.0-alpha1`, `1.0.0-rc.1`, `2.1.3-a`

## Development Workflow

### Adding a New Package

1. Create package directory:
```bash
mkdir packages/new-package
```

2. Create `package.json`:
```json
{
  "name": "@moora/new-package",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node --format esm && bun run build:types",
    "build:types": "tsc --emitDeclarationOnly --outDir dist",
    "prepublishOnly": "bun run build"
  },
  "files": ["dist"]
}
```

3. Add source code in `src/` directory

4. Add to workspace automatically (configured with `packages/*`)

### Release Workflow

1. **Develop and commit changes** as normal
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

2. **Prepare version** when ready to release
   ```bash
   bun run prepare-version patch
   # or minor, major, prerelease
   ```

3. **Push changes and tags**
   ```bash
   git push && git push --tags
   ```

4. **Publish packages**
   ```bash
   # Test first
   bun run publish:dry-run
   
   # Then publish
   bun run publish
   ```

## Requirements

- **Bun** runtime
- **Git** with a remote repository
- **npm** account with publish access (for actual publishing)

## Package Dependencies

Packages can depend on each other:

```json
{
  "dependencies": {
    "@moora/core": "0.1.0"
  }
}
```

The version will be automatically updated when running `prepare-version`.

## CI/CD Integration

The scripts are designed to work in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Prepare Version
  run: bun run prepare-version patch

- name: Publish
  run: bun run publish
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### "Must be on main branch"
Switch to main branch: `git checkout main`
Switch to main branch: `git checkout main`

### "There are uncommitted changes"
Commit or stash your changes first

### "Version X is not greater than published version Y"
Choose a higher version bump type or check if the package was already published

### "Tag vX.Y.Z does not exist"
Run `prepare-version` first to create the tag

### "prepublishOnly failed for package"
Check the individual package's build or test scripts

## Documentation

- [Adding New Packages](docs/ADDING_PACKAGES.md) - Step-by-step guide for adding packages
- [Quick Reference](docs/QUICK_REFERENCE.md) - Command reference card
- [Setup Summary](docs/SETUP_SUMMARY.md) - Complete setup documentation

---

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

