/**
 * @moora/eslint-config
 *
 * Shared ESLint configuration for Moora monorepo packages
 */

const commonRules = {
  // TypeScript 推荐规则
  ...require("@typescript-eslint/eslint-plugin").configs.recommended.rules,

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

  // 禁止未使用的导入（但允许导出）
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

module.exports = {
  // 基础配置（用于纯 JavaScript/TypeScript 包）
  base: {
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "import"],
    rules: commonRules,
  },

  // Node.js 配置（用于服务端包）
  node: {
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "import"],
    env: {
      node: true,
    },
    globals: {
      console: "readonly",
      process: "readonly",
      setTimeout: "readonly",
      clearTimeout: "readonly",
      setInterval: "readonly",
      clearInterval: "readonly",
    },
    rules: commonRules,
  },

  // Browser 配置（用于前端包）
  browser: {
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "import"],
    env: {
      browser: true,
      es2022: true,
    },
    globals: {
      console: "readonly",
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
    },
    rules: commonRules,
  },
};