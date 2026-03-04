// @ts-check
import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      // ESLint иногда вызывается lint.ps1 на файлах других типов:
      "**/*.json",
      "**/*.md",
      "**/*.css",
      "**/*.html",
      "**/*.yml",
      "**/*.yaml",
      "**/*.svg",
    ],
  },
  {
    files: ["**/*.{js,ts,vue}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...eslintPluginVue.configs["flat/recommended"],
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "vue/multi-word-component-names": "off",
      "vue/no-mutating-props": "warn",
    },
  },
  eslintConfigPrettier,
);
