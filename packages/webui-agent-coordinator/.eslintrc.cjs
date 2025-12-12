module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "import", "react-hooks", "react-refresh"],
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
    react: {
      version: "detect",
    },
  },
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
  rules: {
    // Type imports
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
      },
    ],

    // Import order
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "index",
          "type",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
          orderImportKind: "ignore",
        },
        pathGroups: [
          { pattern: "@/**", group: "internal", position: "before" },
        ],
        pathGroupsExcludedImportTypes: ["builtin", "type"],
        distinctGroup: false,
      },
    ],

    // React refresh
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],

    // Unused vars
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],

    // Other rules
    "import/no-unused-modules": "off",
    "import/no-unresolved": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
  ignorePatterns: ["dist", "node_modules", "*.config.*", "*.d.ts"],
};