import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // TypeScript 推荐规则
      ...tseslint.configs.recommended.rules,

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
          },
          pathGroups: [
            {
              pattern: "@moora/**",
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
    },
  },
  {
    ignores: ["dist", "node_modules", "bun.lock"],
  },
];