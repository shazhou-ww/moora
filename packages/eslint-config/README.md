# @moora/eslint-config

Shared ESLint configuration for Moora monorepo packages.

## Installation

```bash
bun add -d @moora/eslint-config
```

## Usage

### Base Configuration (for pure TypeScript packages)

```javascript
// .eslintrc.cjs
module.exports = {
  extends: ["@moora/eslint-config/base"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
};
```

### Node.js Configuration (for server packages)

```javascript
// .eslintrc.cjs
module.exports = {
  extends: ["@moora/eslint-config/node"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
};
```

### Browser Configuration (for frontend packages)

```javascript
// .eslintrc.cjs
module.exports = {
  extends: ["@moora/eslint-config/browser"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
};
```

## Features

- **TypeScript-first**: Full TypeScript support with recommended rules
- **Import organization**: Automatic import sorting with dependency → internal → local ordering
- **Type import separation**: Forces type imports to be separate from value imports
- **Path alias support**: Recognizes `@moora/**` and `@/**` path aliases
- **Flexible linting**: Configurable rules for different environments (Node.js, Browser)

## Rules

### Import Order
- `builtin` → `external` → `internal` → `parent`/`sibling` → `index` → `type`
- Alphabetical sorting within each group
- Empty lines between groups
- `@moora/**` and `@/**` patterns treated as internal imports

### Type Imports
- Must be separated from value imports
- Automatically fixed with `--fix`

### Unused Variables
- Allows variables/parameters prefixed with `_`
- Strict checking for others

## Development

```bash
# Install dependencies
bun install

# Test the config
cd packages/some-package
bunx eslint src/**/*.ts
```