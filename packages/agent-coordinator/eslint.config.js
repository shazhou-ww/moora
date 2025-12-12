import { base } from "@moora/eslint-config";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    ...base[0],
    languageOptions: {
      ...base[0].languageOptions,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...base[0].rules,
      // 暂时禁用 import/no-unresolved，因为 ESLint 无法正确解析 TypeScript 模块
      "import/no-unresolved": "off",
    },
  },
  {
    ignores: ["dist", "node_modules"],
  },
];
