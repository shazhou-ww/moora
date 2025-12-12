import { browser } from "@moora/eslint-config";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    ...browser[0],
    languageOptions: {
      ...browser[0].languageOptions,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      ...browser[0].plugins,
      "react-hooks": (await import("eslint-plugin-react-hooks")).default,
      "react-refresh": (await import("eslint-plugin-react-refresh")).default,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
      react: {
        version: "detect",
        runtime: "automatic",
      },
    },
    rules: {
      ...browser[0].rules,
      // React-specific rules
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    ...browser[1],
  },
  {
    ignores: ["dist", "node_modules", "*.config.*", "*.d.ts"],
  },
];
