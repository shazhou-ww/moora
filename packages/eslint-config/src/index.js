/**
 * @moora/eslint-config
 *
 * Shared ESLint configuration for Moora monorepo packages
 */

import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

// Common rules shared across configurations
const commonRules = {
  // Type imports 必须单独分组
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
    },
  ],

  // Import 排序规则：先 dependency，再包内；type 和非 type 分开
  "import/order": [
    "error",
    {
      groups: [
        "builtin", // Node.js built-in modules
        "external", // External dependencies (npm packages)
        "internal", // Internal modules (using path mapping like @moora/**)
        ["parent", "sibling"], // Parent and sibling imports
        "index", // Index imports
        "type", // Type imports
      ],
      "newlines-between": "always",
      alphabetize: {
        order: "asc",
        caseInsensitive: true,
        orderImportKind: "ignore",
      },
      pathGroups: [
        {
          pattern: "@moora/**",
          group: "internal",
          position: "before",
        },
        {
          pattern: "@/**",
          group: "internal",
          position: "before",
        },
      ],
      pathGroupsExcludedImportTypes: ["builtin", "type"],
      distinctGroup: false,
    },
  ],

  // 禁止未使用的导入
  "import/no-unused-modules": "off", // 关闭，因为可能影响开发体验
  "import/no-unresolved": "error",

  // TypeScript 特定规则
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      ignoreRestSiblings: true,
    },
  ],
};

// 基础配置（用于纯 JavaScript/TypeScript 包）
export const base = [
  {
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import": importPlugin,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      ...commonRules,
    },
  },
];

// Node.js 配置（用于服务端包）
export const node = [
  {
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import": importPlugin,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      ...commonRules,
    },
  },
  {
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        queueMicrotask: "readonly",
      },
    },
  },
];

// Browser 配置（用于前端包）
export const browser = [
  {
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import": importPlugin,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      ...commonRules,
    },
  },
  {
    languageOptions: {
      globals: {
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLTextAreaElement: "readonly",
        NodeJS: "readonly",
        React: "readonly",
        EventSource: "readonly",
        window: "readonly",
      },
    },
  },
];